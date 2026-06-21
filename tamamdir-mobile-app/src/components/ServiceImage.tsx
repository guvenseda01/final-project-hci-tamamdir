import { useState } from "react";
import { resolveMediaUrl } from "../lib/mediaUrl";

interface ServiceImageProps {
  src?: string | null;
  serviceId?: string;
  alt?: string;
  className?: string;
}

export default function ServiceImage({
  src,
  alt,
  className = "",
}: ServiceImageProps) {
  const [failed, setFailed] = useState(false);
  const url = resolveMediaUrl(src);

  if (!url || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-container text-outline ${className}`}
        aria-hidden={!alt}
      >
        <span className="material-symbols-outlined text-3xl">image</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt ?? ""}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
