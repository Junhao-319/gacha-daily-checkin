export type ThemeMode = "system" | "light" | "dark";
export type BackgroundMediaType = "image" | "video";

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

export interface BackgroundPreference {
  type: "wallpaper" | "upload" | "url" | "gallery" | "builtin-gallery";
  mediaType: BackgroundMediaType;
  value: string;
  assetIds?: string[];
  urls?: string[];
  title?: string;
}

export interface BackgroundSettings {
  global: BackgroundPreference | null;
  homeCustomEnabled: boolean;
  games: Record<string, BackgroundPreference>;
}

export interface PersistedStateV3 {
  version: 3;
  games: Game[];
  checkIns: Record<string, Record<string, Record<string, string>>>;
  theme: ThemeMode;
  backgrounds: BackgroundSettings;
}

export interface StorageLoadResult {
  state: PersistedStateV3;
  error: string | null;
  hasStoredState: boolean;
}

export interface WallpaperItem {
  id: string;
  title: string;
  type: string;
  mediaType: BackgroundMediaType;
  mediaUrl: string;
  previewUrl: string;
}

export interface DetectedGamesResponse {
  detected: string[];
}

export type PersistedState = PersistedStateV3;
