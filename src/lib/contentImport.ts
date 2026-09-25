/**
 * Helpers for importing owned content without an iRacing API.
 *
 * iRacing's Data API has no "owned content" endpoint, so we infer ownership
 * from two user-supplied sources instead:
 *
 *  1. The local install folder. The iRacing updater only downloads content the
 *     member owns (plus the free content), so the sub-folder names under
 *     `iRacing/cars` and `iRacing/tracks` are effectively an ownership list.
 *  2. A pasted list of names (e.g. copied from the "My Content" page).
 *
 * Neither source uses our display names (folders look like `lagunaseca`,
 * pasted text carries extra words), so everything goes through a fuzzy
 * matcher and the user reviews the result before it is applied.
 */

export interface ContentMatch {
  /** The folder name or pasted line the match came from. */
  source: string;
  /** Candidate names that matched (usually one; several on a tie). */
  matches: string[];
}

export interface MatchResult {
  matched: ContentMatch[];
  unmatched: string[];
}

export interface InstalledFolders {
  cars: string[];
  tracks: string[];
}

/** Lowercase, strip accents and anything that is not a letter or digit. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Filler words that would otherwise match inside unrelated folder names.
const STOP_WORDS = new Set(["at", "de", "la", "le", "of", "the", "and", "des", "del", "di"]);

/**
 * Significant words of a display name, normalized. Hyphenated words count
 * both whole and split, so "MX-5" gives "mx5" and "Spa-Francorchamps" also
 * gives "spa".
 */
function nameTokens(name: string): string[] {
  const tokens = name
    .split(/[\s/,()–]+/)
    .flatMap((word) => (word.includes("-") ? [word, ...word.split("-")] : [word]))
    .map(normalize)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
  return Array.from(new Set(tokens)).sort((a, b) => b.length - a.length);
}

// A match must explain at least this share of the source's characters, so a
// folder like "charlotte" can't match a name that merely shares a short word.
const MIN_SOURCE_COVERAGE = 0.6;
const TIE_EPSILON = 0.001;

/**
 * How much of the normalized source a display name's words cover (0..1), or
 * 0 below MIN_SOURCE_COVERAGE. Every occurrence counts, so "mx5mx52016"
 * gets credit for both "mx5"s.
 */
function sourceCoverage(source: string, name: string): number {
  const covered = new Array<boolean>(source.length).fill(false);
  for (const token of nameTokens(name)) {
    let idx = source.indexOf(token);
    while (idx >= 0) {
      for (let i = idx; i < idx + token.length; i++) covered[i] = true;
      idx = source.indexOf(token, idx + 1);
    }
  }
  const coverage = covered.filter(Boolean).length / source.length;
  return coverage >= MIN_SOURCE_COVERAGE ? coverage : 0;
}

/**
 * Match free-form sources (folder names or pasted lines) to candidate names.
 *
 * Tries, in order: exact normalized equality, a candidate contained whole in
 * the source (longest wins — pasted lines often carry extra text), then the
 * fuzzy word coverage. A source can come back with several tied matches.
 */
export function matchNames(sources: string[], candidates: string[]): MatchResult {
  const normalized = candidates.map((c) => ({ name: c, norm: normalize(c) }));
  const matched: ContentMatch[] = [];
  const unmatched: string[] = [];

  for (const source of sources) {
    const s = normalize(source);
    if (s.length < 3) {
      if (source.trim()) unmatched.push(source.trim());
      continue;
    }

    let matches = normalized.filter((c) => c.norm === s).map((c) => c.name);

    if (matches.length === 0) {
      const contained = normalized.filter((c) => c.norm.length >= 4 && s.includes(c.norm));
      const longest = Math.max(0, ...contained.map((c) => c.norm.length));
      matches = contained.filter((c) => c.norm.length === longest).map((c) => c.name);
    }

    if (matches.length === 0) {
      // Keep every name tied for best coverage rather than guessing: a folder
      // like "charlotte" really is ambiguous, and the user settles it in review.
      const scored = normalized.map((c) => ({ name: c.name, score: sourceCoverage(s, c.name) }));
      const best = Math.max(0, ...scored.map((c) => c.score));
      if (best > 0) {
        matches = scored.filter((c) => best - c.score <= TIE_EPSILON).map((c) => c.name);
      }
    }

    if (matches.length > 0) matched.push({ source: source.trim(), matches });
    else unmatched.push(source.trim());
  }

  return { matched, unmatched };
}

/** Split pasted text into candidate lines (one item per line, or comma/semicolon separated). */
export function splitPastedText(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\r\n;]+|,(?=\s*[A-Z])/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
  );
}

// --- Reading the install folder -------------------------------------------

// Minimal File System Access API types — not in TypeScript's DOM lib yet.
interface DirHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterable<DirHandle | { kind: "file"; name: string }>;
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { id?: string; mode?: "read" }) => Promise<DirHandle>;
  }
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

async function listSubfolders(dir: DirHandle): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of dir.values()) {
    if (entry.kind === "directory") names.push(entry.name);
  }
  return names.sort();
}

async function findChild(dir: DirHandle, name: string): Promise<DirHandle | null> {
  for await (const entry of dir.values()) {
    if (entry.kind === "directory" && entry.name.toLowerCase() === name) return entry;
  }
  return null;
}

/**
 * Let the user pick their iRacing install folder (or its `cars` / `tracks`
 * folder directly) and list the content folders inside. Only folder names
 * are read — no file contents, nothing leaves the browser.
 *
 * Resolves to null if the user cancels the picker.
 */
export async function pickInstalledFolders(): Promise<InstalledFolders | null> {
  if (!window.showDirectoryPicker) throw new Error("Folder access is not supported in this browser.");

  let root: DirHandle;
  try {
    root = await window.showDirectoryPicker({ id: "iracing-install", mode: "read" });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null;
    throw e;
  }

  const rootName = root.name.toLowerCase();
  if (rootName === "cars") return { cars: await listSubfolders(root), tracks: [] };
  if (rootName === "tracks") return { cars: [], tracks: await listSubfolders(root) };

  const [carsDir, tracksDir] = await Promise.all([findChild(root, "cars"), findChild(root, "tracks")]);
  if (!carsDir && !tracksDir) {
    throw new Error(
      `"${root.name}" has no cars or tracks folder. Pick your iRacing install folder, usually C:\\Program Files (x86)\\iRacing.`
    );
  }

  return {
    cars: carsDir ? await listSubfolders(carsDir) : [],
    tracks: tracksDir ? await listSubfolders(tracksDir) : [],
  };
}

/**
 * Fallback for browsers without showDirectoryPicker: derive the content
 * folders from the relative paths of an `<input webkitdirectory>` selection.
 */
export function foldersFromFileList(files: FileList): InstalledFolders {
  const cars = new Set<string>();
  const tracks = new Set<string>();

  for (const file of Array.from(files)) {
    const parts = file.webkitRelativePath.split("/");
    // parts: [...ancestors, "cars" | "tracks", folder, ...rest, fileName]
    for (let i = 0; i < parts.length - 2; i++) {
      const segment = parts[i].toLowerCase();
      if (segment === "cars") cars.add(parts[i + 1]);
      else if (segment === "tracks") tracks.add(parts[i + 1]);
      else continue;
      break;
    }
  }

  return { cars: Array.from(cars).sort(), tracks: Array.from(tracks).sort() };
}
