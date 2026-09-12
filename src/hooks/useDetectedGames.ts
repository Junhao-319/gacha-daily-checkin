import { useEffect, useState } from "react";
import type { DetectedGamesResponse } from "../types";

export function useDetectedGames(): string[] {
  const [detectedGames, setDetectedGames] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function detectGames() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/detected-games`, {
          signal: controller.signal
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Partial<DetectedGamesResponse>;
        if (Array.isArray(data.detected)) {
          setDetectedGames(data.detected.filter((value): value is string => typeof value === "string"));
        }
      } catch {
        // 普通网页版本没有本机检测接口，保持手动选择即可。
      }
    }

    void detectGames();
    return () => controller.abort();
  }, []);

  return detectedGames;
}