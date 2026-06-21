/** Relative /uploads paths work via Vite proxy in dev. */
export function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return path.startsWith("/") ? path : `/${path}`;
}
