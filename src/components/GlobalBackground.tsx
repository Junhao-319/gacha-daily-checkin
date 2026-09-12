import { useEffect, useState } from "react";
import { getPublicAssetUrl } from "../lib/assets";
import { getArtworkUrls, useArtworkVersion } from "../lib/artworkSync";
import { getGameArtworkPath, getGameVideoArtworkPath } from "../lib/games";
import { BackgroundMedia } from "./BackgroundMedia";
import type { BackgroundPreference, Game } from "../types";

interface GlobalBackgroundProps {
  preference: BackgroundPreference | null;
  activeGames: Game[];
}

const HOME_ARTWORK_PATHS = [
  "game-art/home-miku-magical-mirai-2026.jpg",
  "game-art/home-miku-magical-mirai-2025.jpg"
];

export function GlobalBackground({ preference, activeGames }: GlobalBackgroundProps) {
  const remoteArtworkVersion = useArtworkVersion();
  const [activeSlide, setActiveSlide] = useState(0);
  const defaultSlides = HOME_ARTWORK_PATHS.map((path, index) => {
    const { localUrl, remoteUrl } = getArtworkUrls(path, remoteArtworkVersion);
    return { id: `home-${index}`, localUrl, remoteUrl, videoUrl: null };
  });
  const gameSlides = activeGames.map((game) => {
    const { localUrl, remoteUrl } = getArtworkUrls(
      getGameArtworkPath(game),
      remoteArtworkVersion
    );
    return {
      id: game.id,
      localUrl,
      remoteUrl,
      videoUrl: getPublicAssetUrl(getGameVideoArtworkPath(game))
    };
  });
  const allSlides = [...defaultSlides, ...gameSlides].filter(
    (slide) => slide.localUrl || slide.remoteUrl || slide.videoUrl
  );

  useEffect(() => {
    if (preference || allSlides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % allSlides.length);
    }, 11_000);

    return () => window.clearInterval(timer);
  }, [preference, allSlides.length]);

  useEffect(() => {
    if (activeSlide >= allSlides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, allSlides.length]);

  return (
    <div className="global-background" aria-hidden="true">
      {preference ? (
        <BackgroundMedia className="global-background-media" preference={preference} />
      ) : (
        allSlides.map((slide, index) => {
          const active = index === activeSlide;
          if (slide.videoUrl && active) {
            return (
              <video
                autoPlay
                className="global-background-slide is-active"
                key={slide.id}
                loop
                muted
                playsInline
                poster={slide.localUrl ?? undefined}
                src={slide.videoUrl}
              />
            );
          }

          return (
            <span
              className={`global-background-slide${active ? " is-active" : ""}`}
              key={slide.id}
              style={
                {
                  "--slide-image": slide.remoteUrl ? `url("${slide.remoteUrl}")` : "none",
                  "--slide-fallback": slide.localUrl ? `url("${slide.localUrl}")` : "none"
                } as React.CSSProperties
              }
            />
          );
        })
      )}
      <span className="global-background-overlay" />
    </div>
  );
}