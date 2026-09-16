import { useEffect, useState } from "react";
import { useBackgroundMedia } from "../hooks/useBackgroundMedia";
import type { BackgroundPreference } from "../types";

interface BackgroundMediaProps {
  preference: BackgroundPreference | null;
  className?: string;
}

interface AdaptiveImageFrameProps {
  className: string;
  onError?: () => void;
  stateClass: string;
  url: string;
}

function AdaptiveImageFrame({ className, onError, stateClass, url }: AdaptiveImageFrameProps) {
  return (
    <span className={`${className} adaptive-media-frame background-media-layer ${stateClass}`}>
      <img
        alt=""
        aria-hidden="true"
        className="adaptive-media-backdrop"
        decoding="async"
        onError={onError}
        src={url}
      />
      <img
        alt=""
        className="adaptive-media-foreground"
        decoding="async"
        onError={onError}
        src={url}
      />
    </span>
  );
}

function GalleryMedia({ urls, className }: { urls: string[]; className: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setPreviousIndex(null);
  }, [urls]);

  useEffect(() => {
    if (urls.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % urls.length;
        setPreviousIndex(current);
        window.setTimeout(() => setPreviousIndex(null), 900);
        return next;
      });
    }, 9_000);

    return () => window.clearInterval(timer);
  }, [urls]);

  if (urls.length === 0) {
    return null;
  }

  const activeUrl = urls[activeIndex] ?? urls[0];
  const previousUrl = previousIndex === null ? null : urls[previousIndex] ?? null;

  return (
    <>
      {previousUrl ? (
        <AdaptiveImageFrame className={className} stateClass="is-leaving" url={previousUrl} />
      ) : null}
      <AdaptiveImageFrame className={className} stateClass="is-active" url={activeUrl} />
    </>
  );
}

export function BackgroundMedia({ preference, className = "" }: BackgroundMediaProps) {
  const { url, urls, mediaType } = useBackgroundMedia(preference);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    setFailedUrl(null);
  }, [url]);

  if (!preference || urls.length === 0 || failedUrl === url) {
    return null;
  }

  if (preference.type === "gallery" || preference.type === "builtin-gallery") {
    return <GalleryMedia className={className} urls={urls} />;
  }

  const activeUrl = url ?? urls[0];
  if (mediaType === "video") {
    return (
      <video
        autoPlay
        className={`${className} adaptive-video-media`}
        loop
        muted
        onError={() => setFailedUrl(activeUrl)}
        playsInline
        preload="metadata"
        src={activeUrl}
      />
    );
  }

  return (
    <AdaptiveImageFrame
      className={className}
      onError={() => setFailedUrl(activeUrl)}
      stateClass="is-active"
      url={activeUrl}
    />
  );
}
