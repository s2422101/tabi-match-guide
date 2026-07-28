const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

export function getApiUrl(path: string): string {
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  return `${configuredApiBaseUrl}${normalizedPath}`;
}
