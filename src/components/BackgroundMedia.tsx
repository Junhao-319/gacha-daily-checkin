import { useEffect, useState } from "react";
import { useBackgroundMedia } from "../hooks/useBackgroundMedia";
import type { BackgroundPreference } from "../types";

interface BackgroundMediaProps {
  preference: BackgroundPreference | null;
  className?: string;
}

export function BackgroundMedia({ preference, className = "" }: BackgroundMediaProps) {
  const { url, mediaType } = useBackgroundMedia(preference);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!preference || !url || failed) {
    return null;
  }

  if (mediaType === "video") {
    return (
      <video
        autoPlay
        className={className}
        loop
        muted
        onError={() => setFailed(true)}
        playsInline
        src={url}
      />
    );
  }

  return <img alt="" className={className} onError={() => setFailed(true)} src={url} />;
}