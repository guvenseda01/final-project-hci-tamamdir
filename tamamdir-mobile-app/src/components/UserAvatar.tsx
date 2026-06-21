import { useState } from "react";
import { avatarInitial, resolveMediaUrl } from "../lib/mediaUrl";

interface UserAvatarProps {
  src?: string | null;
  userId?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
}

export default function UserAvatar({
  src,
  name,
  alt,
  className = "w-14 h-14 rounded-full object-cover",
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const url = resolveMediaUrl(src);
  const initial = avatarInitial(name);

  if (!url || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-primary/10 text-primary font-bold shrink-0 ${className}`}
        aria-hidden={!alt}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt ?? name ?? ""}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
