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

/** Profile photo from DB only — no random placeholders. */
export function resolveAvatarUrl(path: string | null | undefined): string {
  return resolveMediaUrl(path);
}

export function avatarInitial(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}
