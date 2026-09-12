import { useEffect, useState } from "react";
import type { WallpaperItem } from "../types";

interface WallpaperResponse {
  wallpapers: WallpaperItem[];
}

export function useWallpapers(): { wallpapers: WallpaperItem[]; loading: boolean } {
  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWallpapers() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/wallpapers`, {
          signal: controller.signal
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Partial<WallpaperResponse>;
        if (Array.isArray(data.wallpapers)) {
          setWallpapers(data.wallpapers);
        }
      } catch {
        // 普通网页版本没有本地 Wallpaper Engine 接口。
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadWallpapers();
    return () => controller.abort();
  }, []);

  return { wallpapers, loading };
}