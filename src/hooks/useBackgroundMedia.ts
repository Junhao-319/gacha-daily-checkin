import { useEffect, useState } from "react";
import { loadBackgroundAsset } from "../lib/backgroundAssets";
import type { BackgroundPreference } from "../types";

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
    url: preference?.type === "upload" ? uploadedUrl : preference?.value ?? null,
    mediaType: preference?.mediaType ?? null,
    loading
  };
}