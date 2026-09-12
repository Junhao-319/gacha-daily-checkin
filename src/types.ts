export type ThemeMode = "system" | "light" | "dark";

export interface GameTask {
  id: string;
  name: string;
  createdAt: string;
}

export interface Game {
  id: string;
  catalogId: string | null;
  name: string;
  createdAt: string;
  archivedAt: string | null;
  tasks: GameTask[];
}

export interface PersistedStateV2 {
  version: 2;
  games: Game[];
  checkIns: Record<string, Record<string, Record<string, string>>>;
  theme: ThemeMode;
}

export interface StorageLoadResult {
  state: PersistedStateV2;
  error: string | null;
}

export interface DetectedGamesResponse {
  detected: string[];
}