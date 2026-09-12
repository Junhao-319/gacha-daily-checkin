import { useEffect, useMemo, useState } from "react";
import { getArtworkUrls, useArtworkVersion } from "../lib/artworkSync";
import { BackgroundMedia } from "./BackgroundMedia";
import type { BackgroundPreference } from "../types";

interface GlobalBackgroundProps {
  preference: BackgroundPreference | null;
}

const ANIME_GALLERY_PATHS = [
  "anime-gallery/sina-forest.jpg",
  "anime-gallery/sina-sakura.jpg"
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
  const initialSource = localUrl ?? remoteUrl;
  const [source, setSource] = useState(initialSource);

  useEffect(() => {
    let active = true;
    setSource(initialSource);

    if (remoteUrl && localUrl && remoteUrl !== localUrl) {
      const image = new Image();
      image.onload = () => {
        if (active) {
          setSource(remoteUrl);
        }
      };
      image.src = remoteUrl;
    }

    return () => {
      active = false;
    };
  }, [initialSource, localUrl, remoteUrl]);

  if (!source) {
    return null;
  }

  return (
    <img
      alt=""
      className="global-background-slide is-active"
      decoding="async"
      onError={() => {
        if (localUrl && source !== localUrl) {
          setSource(localUrl);
        } else if (remoteUrl && source !== remoteUrl) {
          setSource(remoteUrl);
        }
      }}
      src={source}
    />
  );
}

export function GlobalBackground({ preference }: GlobalBackgroundProps) {
  const remoteArtworkVersion = useArtworkVersion();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = useMemo(() => {
    if (preference) {
      return [{ id: "saved-background", preference, localUrl: null, remoteUrl: null }];
    }

    return shuffle(
      ANIME_GALLERY_PATHS.map((path, index) => {
        const { localUrl, remoteUrl } = getArtworkUrls(path, remoteArtworkVersion);
        return { id: `anime-${index}`, preference: null, localUrl, remoteUrl };
      }).filter((slide) => slide.localUrl || slide.remoteUrl)
    );
  }, [preference, remoteArtworkVersion]);

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 10_000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (activeSlide >= slides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, slides.length]);

  const active = slides[activeSlide];

  return (
    <div className="global-background" aria-hidden="true">
      {active?.preference ? (
        <BackgroundMedia className="global-background-slide is-active" preference={active.preference} />
      ) : active ? (
        <LocalImageSlide key={active.id} localUrl={active.localUrl} remoteUrl={active.remoteUrl} />
      ) : null}
      <span className="global-background-overlay" />
    </div>
  );
}