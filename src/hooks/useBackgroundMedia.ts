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
      // 保留原始地址，由图片加载失败逻辑处理。
    }
  }

  return preference.value;
}
export function useBackgroundMedia(preference: BackgroundPreference | null) {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(preference?.type === "upload");

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function resolveUpload() {
      setUploadedUrl(null);
      if (!preference || preference.type !== "upload") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const blob = await loadBackgroundAsset(preference.value);
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setUploadedUrl(objectUrl);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void resolveUpload();
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [preference]);

  return {
    url: preference?.type === "upload" ? uploadedUrl : resolvePreferenceUrl(preference),
    mediaType: preference?.mediaType ?? null,
    loading
  };
}