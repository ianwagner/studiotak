export const DEFAULT_SITE_URL = "https://www.studiotak.co";

const LEGACY_HOSTNAME = "studiotak.co";
const CANONICAL_HOSTNAME = "www.studiotak.co";

const normalizeStudioTakUrl = (value: string): string | null => {
  try {
    const url = new URL(value);
    if (url.hostname === LEGACY_HOSTNAME) {
      url.hostname = CANONICAL_HOSTNAME;
    }
    return url.toString();
  } catch {
    return null;
  }
};

export const getSiteUrl = (): string => {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  const normalizedUrl = normalizeStudioTakUrl(configuredUrl);

  if (!normalizedUrl) return DEFAULT_SITE_URL;
  return new URL(normalizedUrl).origin;
};

export const getCanonicalUrl = (path: string, override?: string | null): string => {
  const normalizedOverride = override?.trim() ? normalizeStudioTakUrl(override.trim()) : null;
  if (normalizedOverride) return normalizedOverride;

  return new URL(path, getSiteUrl()).toString();
};
