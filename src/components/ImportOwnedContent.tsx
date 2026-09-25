"use client";

import { useMemo, useRef, useState } from "react";
import {
  foldersFromFileList,
  matchNames,
  pickInstalledFolders,
  splitPastedText,
  supportsDirectoryPicker,
  type ContentMatch,
} from "@/lib/contentImport";

interface ImportOwnedContentProps {
  availableCars: string[];
  /** Base track name → its layout variants, as grouped in the Tracks tab. */
  trackGroups: Map<string, string[]>;
  ownedCars: string[];
  ownedTracks: string[];
  onApply: (cars: string[], tracks: string[]) => void;
  onCancel: () => void;
}

type Kind = "car" | "track";

interface ReviewGroup extends ContentMatch {
  kind: Kind;
  /** False when the source matched several names, before owned ones were dropped. */
  unambiguous?: boolean;
}

interface Review {
  origin: "folder" | "paste";
  groups: ReviewGroup[];
  unmatched: string[];
  alreadyOwned: number;
}

const secondaryButton =
  "px-4 py-2 text-sm text-slate-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300";
const primaryButton =
  "px-4 py-2 bg-red-500 hover:bg-red-600 light-theme:bg-red-600 light-theme:hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

export default function ImportOwnedContent({
  availableCars,
  trackGroups,
  ownedCars,
  ownedTracks,
  onApply,
  onCancel,
}: ImportOwnedContentProps) {
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const folderInputRef = useRef<HTMLInputElement>(null);

  const trackBases = useMemo(() => Array.from(trackGroups.keys()), [trackGroups]);
  const carSet = useMemo(() => new Set(availableCars), [availableCars]);

  const isOwned = (kind: Kind, name: string) =>
    kind === "car"
      ? ownedCars.includes(name)
      : (trackGroups.get(name) ?? [name]).every((v) => ownedTracks.includes(v));

  const keyOf = (kind: Kind, name: string) => `${kind}:${name}`;

  /**
   * Build the review list: drop matches the user already owns, and pre-tick
   * only unambiguous ones so a fuzzy tie never gets added silently.
   */
  const startReview = (origin: Review["origin"], groups: ReviewGroup[], unmatched: string[]) => {
    let alreadyOwned = 0;
    const seen = new Set<string>();
    const pending: ReviewGroup[] = [];

    for (const group of groups) {
      const fresh = group.matches.filter((name) => {
        const key = keyOf(group.kind, name);
        if (seen.has(key)) return false;
        seen.add(key);
        if (isOwned(group.kind, name)) {
          alreadyOwned++;
          return false;
        }
        return true;
      });
      if (fresh.length > 0) pending.push({ ...group, matches: fresh, unambiguous: group.matches.length === 1 });
    }

    const preselected = new Set(pending.filter((g) => g.unambiguous).map((g) => keyOf(g.kind, g.matches[0])));

    setSelected(preselected);
    setReview({ origin, groups: pending, unmatched, alreadyOwned });
  };

  const reviewFolders = (folders: { cars: string[]; tracks: string[] }) => {
    if (folders.cars.length === 0 && folders.tracks.length === 0) {
      setError("No car or track folders found there. Pick your iRacing install folder, usually C:\\Program Files (x86)\\iRacing.");
      return;
    }
    const cars = matchNames(folders.cars, availableCars);
    const tracks = matchNames(folders.tracks, trackBases);
    startReview(
      "folder",
      [
        ...cars.matched.map((m) => ({ ...m, kind: "car" as const })),
        ...tracks.matched.map((m) => ({ ...m, kind: "track" as const })),
      ],
      [...cars.unmatched, ...tracks.unmatched]
    );
  };

  const handlePickFolder = async () => {
    setError(null);
    if (!supportsDirectoryPicker()) {
      folderInputRef.current?.click();
      return;
    }
    setBusy(true);
    try {
      const folders = await pickInstalledFolders();
      if (folders) reviewFolders(folders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that folder.");
    } finally {
      setBusy(false);
    }
  };

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) reviewFolders(foldersFromFileList(e.target.files));
    e.target.value = "";
  };

  const handleMatchPaste = () => {
    setError(null);
    const lines = splitPastedText(pasted);
    if (lines.length === 0) {
      setError("Paste at least one car or track name.");
      return;
    }
    const result = matchNames(lines, [...availableCars, ...trackBases]);
    // Each pasted line may hit a car or a track; split its matches by kind.
    const groups: ReviewGroup[] = result.matched.flatMap((m) => {
      const cars = m.matches.filter((n) => carSet.has(n));
      const tracks = m.matches.filter((n) => !carSet.has(n));
      return [
        ...(cars.length ? [{ source: m.source, matches: cars, kind: "car" as const }] : []),
        ...(tracks.length ? [{ source: m.source, matches: tracks, kind: "track" as const }] : []),
      ];
    });
    startReview("paste", groups, result.unmatched);
  };

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleApply = () => {
    const cars: string[] = [];
    const tracks: string[] = [];
    for (const key of selected) {
      const [kind, ...rest] = key.split(":");
      const name = rest.join(":");
      if (kind === "car") cars.push(name);
      else tracks.push(...(trackGroups.get(name) ?? [name]));
    }
    onApply(cars, tracks);
  };

  if (review) {
    const carGroups = review.groups.filter((g) => g.kind === "car");
    const trackGroupsToReview = review.groups.filter((g) => g.kind === "track");

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <p className="text-sm text-slate-300 light-theme:text-gray-700">
            {review.groups.length === 0
              ? "Nothing new to add."
              : `Found ${review.groups.length} new item${review.groups.length === 1 ? "" : "s"}. Ambiguous matches are unticked, so pick the right one yourself.`}
            {review.alreadyOwned > 0 && ` ${review.alreadyOwned} already in your list.`}
          </p>

          {[
            { title: "Cars", groups: carGroups },
            { title: "Tracks", groups: trackGroupsToReview },
          ].map(
            ({ title, groups }) =>
              groups.length > 0 && (
                <section key={title}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 light-theme:text-gray-500 mb-2">
                    {title}
                  </h3>
                  <ul className="space-y-2">
                    {groups.map((group) => (
                      <li
                        key={`${group.kind}-${group.source}`}
                        className="rounded-lg border border-white/5 light-theme:border-gray-200 bg-slate-900/50 light-theme:bg-gray-50 px-3 py-2"
                      >
                        <p className="text-[11px] text-slate-500 light-theme:text-gray-500 mb-1 break-all">
                          {review.origin === "folder" ? "Folder" : "Line"}: <code>{group.source}</code>
                        </p>
                        {group.matches.map((name) => {
                          const key = keyOf(group.kind, name);
                          return (
                            <label key={key} className="flex items-center gap-2 py-0.5 text-sm text-white light-theme:text-gray-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selected.has(key)}
                                onChange={() => toggle(key)}
                                className="h-4 w-4 accent-red-500"
                              />
                              {name}
                            </label>
                          );
                        })}
                      </li>
                    ))}
                  </ul>
                </section>
              )
          )}

          {review.unmatched.length > 0 && (
            <details className="text-sm text-slate-400 light-theme:text-gray-600">
              <summary className="cursor-pointer">
                {review.unmatched.length} not recognised (tick these by hand if you own them)
              </summary>
              <p className="mt-2 break-words text-xs">{review.unmatched.join(", ")}</p>
            </details>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-white/10 light-theme:border-gray-200">
          <button onClick={() => setReview(null)} className={secondaryButton}>
            Back
          </button>
          <button onClick={handleApply} disabled={selected.size === 0} className={primaryButton}>
            Add {selected.size} to my content
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-white light-theme:text-gray-900">From your iRacing folder</h3>
          <p className="text-sm text-slate-400 light-theme:text-gray-600">
            iRacing only downloads content you own, so we can read it from your install folder, usually{" "}
            <code className="text-xs">C:\Program Files (x86)\iRacing</code>. Only folder names are read, and nothing
            leaves your browser.
          </p>
          <button onClick={handlePickFolder} disabled={busy} className={primaryButton}>
            {busy ? "Reading…" : "Choose iRacing folder"}
          </button>
          <input
            ref={folderInputRef}
            type="file"
            className="hidden"
            onChange={handleFolderInput}
            {...{ webkitdirectory: "", directory: "" }}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-white light-theme:text-gray-900">Or paste a list</h3>
          <p className="text-sm text-slate-400 light-theme:text-gray-600">
            Copy your owned content from the iRacing site or app and paste it here, one item per line.
          </p>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={6}
            aria-label="Owned cars and tracks, one per line"
            placeholder={"Porsche 911 GT3 R (992)\nWeatherTech Raceway at Laguna Seca\n…"}
            className="w-full px-3 py-2 bg-slate-900 light-theme:bg-gray-50 border border-white/10 light-theme:border-gray-300 rounded-lg text-sm text-white light-theme:text-gray-900 placeholder-slate-500 light-theme:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
          <button onClick={handleMatchPaste} disabled={!pasted.trim()} className={primaryButton}>
            Match pasted list
          </button>
        </section>

        {error && (
          <p role="alert" className="text-sm text-red-400 light-theme:text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-start p-4 border-t border-white/10 light-theme:border-gray-200">
        <button onClick={onCancel} className={secondaryButton}>
          Back to list
        </button>
      </div>
    </div>
  );
}
