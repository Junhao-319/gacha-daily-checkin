export function getPublicAssetUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\/+/, "")}`;
}