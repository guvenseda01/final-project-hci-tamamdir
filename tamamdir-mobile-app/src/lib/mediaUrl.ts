const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Relative /uploads paths — prefix API origin when set, else same-origin. */
export function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  if (path.startsWith("/")) {
    return API_BASE ? `${API_BASE}${path}` : path;
  }
  return API_BASE ? `${API_BASE}/${path}` : `/${path}`;
}

/** Avatar with pravatar fallback when user has no uploaded photo. */
export function resolveAvatarUrl(
  path: string | null | undefined,
  userId?: string | null
): string {
  const media = resolveMediaUrl(path);
  if (media) return media;
  if (userId) return `https://i.pravatar.cc/150?u=${encodeURIComponent(userId)}`;
  return "";
}

export function avatarInitial(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}
