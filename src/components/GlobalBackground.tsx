import { useEffect, useMemo, useState } from "react";
import { getPublicAssetUrl } from "../lib/assets";
import { getArtworkUrls, useArtworkVersion } from "../lib/artworkSync";
import { getGameArtworkPath, getGameVideoArtworkPath } from "../lib/games";
import { BackgroundMedia } from "./BackgroundMedia";
import type { BackgroundPreference, BackgroundSettings, Game } from "../types";

interface GlobalBackgroundProps {
  preference: BackgroundPreference | null;
  activeGames: Game[];
  backgrounds: BackgroundSettings;
}

const HOME_ARTWORK_PATHS = [
  "game-art/home-miku-magical-mirai-2026.jpg",
  "game-art/home-miku-magical-mirai-2025.jpg"
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function LocalImageSlide({ localUrl, remoteUrl }: { localUrl: string | null; remoteUrl: string | null }) {
  const [source, setSource] = useState(remoteUrl ?? localUrl);

  useEffect(() => {
    setSource(remoteUrl ?? localUrl);
  }, [localUrl, remoteUrl]);

  if (!source) {
    return null;
  }

  return (
    <img
      alt=""
      className="global-background-slide is-active"
      onError={() => {
        if (localUrl && source !== localUrl) {
          setSource(localUrl);
        }
      }}
      src={source}
    />
  );
}

export function GlobalBackground({ preference, activeGames, backgrounds }: GlobalBackgroundProps) {
  const remoteArtworkVersion = useArtworkVersion();
  const [activeSlide, setActiveSlide] = useState(0);
  const activeGameKey = activeGames.map((game) => game.id).join("|");

  const slides = useMemo(() => {
    const homeSlides = HOME_ARTWORK_PATHS.map((path, index) => {
      const { localUrl, remoteUrl } = getArtworkUrls(path, remoteArtworkVersion);
      return {
        id: `home-${index}`,
        preference: null as BackgroundPreference | null,
        localUrl,
        remoteUrl,
        videoUrl: null as string | null
      };
    });

    const gameSlides = activeGames.map((game) => {
      const gamePreference = backgrounds.games[game.id] ?? null;
      const { localUrl, remoteUrl } = getArtworkUrls(
        getGameArtworkPath(game),
        remoteArtworkVersion
      );
      return {
        id: game.id,
        preference: gamePreference,
        localUrl,
        remoteUrl,
        videoUrl: getPublicAssetUrl(getGameVideoArtworkPath(game))
      };
    });

    return shuffle([...homeSlides, ...gameSlides]).filter(
      (slide) => slide.preference || slide.localUrl || slide.remoteUrl || slide.videoUrl
    );
  }, [activeGameKey, backgrounds, remoteArtworkVersion]);

  useEffect(() => {
    if (preference || slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 12_000);

    return () => window.clearInterval(timer);
  }, [preference, slides.length]);

  useEffect(() => {
    if (activeSlide >= slides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, slides.length]);

  const active = slides[activeSlide];

  return (
    <div className="global-background" aria-hidden="true">
      {preference ? (
        <BackgroundMedia className="global-background-media" preference={preference} />
      ) : active?.preference ? (
        <BackgroundMedia
          className={`global-background-slide ${active.preference.mediaType === "video" ? "" : "is-active"}`}
          preference={active.preference}
        />
      ) : active?.videoUrl ? (
        <video
          autoPlay
          className="global-background-slide is-active"
          key={active.id}
          loop
          muted
          playsInline
          poster={active.localUrl ?? undefined}
          preload="metadata"
          src={active.videoUrl}
        />
      ) : active ? (
        <LocalImageSlide key={active.id} localUrl={active.localUrl} remoteUrl={active.remoteUrl} />
      ) : null}
      <span className="global-background-overlay" />
    </div>
  );
}
