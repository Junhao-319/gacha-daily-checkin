import { useEffect, useState } from "react";
import { loadBackgroundAsset } from "../lib/backgroundAssets";
import type { BackgroundPreference } from "../types";

function resolvePreferenceUrl(preference: BackgroundPreference | null): string | null {
  if (!preference) {
    return null;
  }

  if (preference.type === "wallpaper") {
    try {
      const url = new URL(preference.value, window.location.origin);
      if (url.pathname.endsWith("/api/wallpaper-file")) {
        return `${import.meta.env.BASE_URL}api/wallpaper-file${url.search}`;
      }
    } catch {
      // 保留原始地址，由媒体加载失败逻辑处理。
    }
  }

  return preference.value;
}

export function useBackgroundMedia(preference: BackgroundPreference | null) {
  const [assetUrls, setAssetUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(
    preference?.type === "upload" || preference?.type === "gallery"
  );

  useEffect(() => {
    const objectUrls: string[] = [];
    let cancelled = false;

    async function resolveLocalAssets() {
      setAssetUrls([]);
      if (!preference || (preference.type !== "upload" && preference.type !== "gallery")) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const assetIds =
          preference.type === "gallery"
            ? preference.assetIds ?? []
            : [preference.value];
        const blobs = await Promise.all(assetIds.map((assetId) => loadBackgroundAsset(assetId)));
        const urls = blobs
          .filter((blob): blob is Blob => Boolean(blob))
          .map((blob) => URL.createObjectURL(blob));
        objectUrls.push(...urls);
        if (!cancelled) {
          setAssetUrls(urls);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void resolveLocalAssets();
    return () => {
      cancelled = true;
      for (const objectUrl of objectUrls) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [preference]);

  const externalUrl =
    preference?.type === "upload" || preference?.type === "gallery"
      ? null
      : resolvePreferenceUrl(preference);

  return {
    url: externalUrl ?? assetUrls[0] ?? null,
    urls: externalUrl ? [externalUrl] : assetUrls,
    mediaType: preference?.mediaType ?? null,
    loading
  };
}