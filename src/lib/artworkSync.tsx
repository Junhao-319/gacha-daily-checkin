import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getPublicAssetUrl } from "./assets";

const GITHUB_PAGES_BASE = "https://junhao-319.github.io/gacha-daily-checkin/";

interface ArtworkManifest {
  version: string;
  images: Record<string, { sha256: string; bytes: number }>;
}

const ArtworkVersionContext = createContext<string | null>(null);

async function fetchManifest(url: string): Promise<ArtworkManifest | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const manifest = (await response.json()) as Partial<ArtworkManifest>;
    return typeof manifest.version === "string" ? (manifest as ArtworkManifest) : null;
  } catch {
    return null;
  }
}

export function ArtworkSyncProvider({ children }: { children: ReactNode }) {
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncArtwork() {
      const localManifest = await fetchManifest(`${import.meta.env.BASE_URL}game-art/manifest.json`);
      const remoteManifest = await fetchManifest(`${GITHUB_PAGES_BASE}game-art/manifest.json`);

      if (
        !cancelled &&
        localManifest &&
        remoteManifest &&
        remoteManifest.version !== localManifest.version
      ) {
        setRemoteVersion(remoteManifest.version);
      }
    }

    void syncArtwork();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ArtworkVersionContext.Provider value={remoteVersion}>
      {children}
    </ArtworkVersionContext.Provider>
  );
}

export function useArtworkVersion(): string | null {
  return useContext(ArtworkVersionContext);
}

export function getArtworkUrls(path: string | null, remoteVersion?: string | null) {
  const localUrl = getPublicAssetUrl(path);
  const remoteUrl =
    path && remoteVersion
      ? `${GITHUB_PAGES_BASE}${path.replace(/^\/+/, "")}?v=${encodeURIComponent(remoteVersion)}`
      : null;

  return { localUrl, remoteUrl };
}