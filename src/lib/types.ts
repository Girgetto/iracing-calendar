export interface WeekSchedule {
  week: number;
  track: string;
  trackId: string;
  startDate: string;
  endDate: string;
  raceDateTime?: string;
  conditions?: string;
  durationMins?: number;
  durationLaps?: number;
}

export interface Series {
  id: string;
  name: string;
  category: string;
  region?: string;
  car?: string;
  licenseRange?: string;
  raceFrequency?: string;
  drops?: number;
  schedule: WeekSchedule[];
}

export interface SeasonMetadata {
  season: string;
  seasonNumber: number;
  seasonYear: number;
  lastUpdated: string;
  weeks: number;
}

export interface SeasonData {
  metadata: SeasonMetadata;
  series: Series[];
}

export type CategoryFilter = string;

export type ViewMode = "grid" | "list";
