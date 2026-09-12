import { useEffect, useState } from "react";
import { getArtworkUrls, useArtworkVersion } from "../lib/artworkSync";
import { getGameArtworkPath } from "../lib/games";
import { BackgroundMedia } from "./BackgroundMedia";
import type { BackgroundPreference, Game } from "../types";

interface GlobalBackgroundProps {
  preference: BackgroundPreference | null;
  activeGames: Game[];
}

export function GlobalBackground({ preference, activeGames }: GlobalBackgroundProps) {
  const remoteArtworkVersion = useArtworkVersion();
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = activeGames
    .map((game) => {
      const { localUrl, remoteUrl } = getArtworkUrls(
        getGameArtworkPath(game),
        remoteArtworkVersion
      );
      return { gameId: game.id, localUrl, remoteUrl };
    })
    .filter((slide) => slide.localUrl || slide.remoteUrl);

  useEffect(() => {
    if (preference || slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 11_000);

    return () => window.clearInterval(timer);
  }, [preference, slides.length]);

  useEffect(() => {
    if (activeSlide >= slides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, slides.length]);

  return (
    <div className="global-background" aria-hidden="true">
      {preference ? (
        <BackgroundMedia className="global-background-media" preference={preference} />
      ) : (
        slides.map((slide, index) => (
          <span
            className={`global-background-slide${index === activeSlide ? " is-active" : ""}`}
            key={slide.gameId}
            style={
              {
                "--slide-image": slide.remoteUrl ? `url("${slide.remoteUrl}")` : "none",
                "--slide-fallback": slide.localUrl ? `url("${slide.localUrl}")` : "none"
              } as React.CSSProperties
            }
          />
        ))
      )}
      <span className="global-background-overlay" />
    </div>
  );
}