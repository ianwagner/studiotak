import groq from "groq";
import { draftMode } from "next/headers";
import { unstable_cache } from "next/cache";

import { hasSanityClient, requireSanityClient } from "@/lib/sanity/config";

export type SiteAsset = {
  url: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
};

export type SiteLogoAsset = SiteAsset;

export type SiteIconAsset = SiteAsset & {
  rel: string;
  sizes: string | null;
  type: string | null;
};

export type SiteLogoSet = {
  primary: SiteLogoAsset | null;
  markOnly: SiteLogoAsset | null;
  rasterFallbacks: SiteLogoAsset[];
  alt: string;
  minHeight: number | null;
  clearSpaceNote: string | null;
};

export type SiteProduct = {
  slug: string;
  name: string;
  badgeText?: string | null;
  productColor?: string | null;
  logos: {
    light: SiteLogoAsset | null;
    dark: SiteLogoAsset | null;
    compactLight: SiteLogoAsset | null;
    compactDark: SiteLogoAsset | null;
  };
};

export type SiteSettings = {
  logos: SiteLogoSet;
  favicons: SiteIconAsset[];
  appIcons: SiteIconAsset[];
};

type MaybeNumber = number | null | undefined;

type SanityFileAsset = {
  url?: string | null;
  mimeType?: string | null;
  metadata?: {
    dimensions?: {
      width?: number | null;
      height?: number | null;
    } | null;
  } | null;
};

type SanityLogoEntry = {
  url?: string | null;
  mimeType?: string | null;
  metadata?: {
    dimensions?: {
      width?: number | null;
      height?: number | null;
    } | null;
  } | null;
};

type SanityIconEntry = {
  rel?: string | null;
  sizes?: string | null;
  type?: string | null;
  asset?: SanityFileAsset | null;
};

type RawLogoSet = {
  alt?: string | null;
  minHeight?: number | null;
  clearSpaceNote?: string | null;
  primary?: SanityLogoEntry | null;
  markOnly?: SanityLogoEntry | null;
  rasterFallbacks?: Array<{ asset?: SanityLogoEntry | null } | null> | null;
  favicons?: Array<SanityIconEntry | null> | null;
  appIcons?: Array<SanityIconEntry | null> | null;
};

type SiteSettingsDocument = {
  logoSet?: RawLogoSet | null;
};

const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0]{
    logoSet {
      alt,
      minHeight,
      clearSpaceNote,
      "primary": primary.asset->{
        url,
        mimeType,
        metadata { dimensions }
      },
      "markOnly": markOnly.asset->{
        url,
        mimeType,
        metadata { dimensions }
      },
      "rasterFallbacks": rasterFallbacks[] {
        "asset": asset->{
          url,
          mimeType,
          metadata { dimensions }
        }
      },
      "favicons": favicons[] {
        rel,
        sizes,
        type,
        "asset": file.asset->{
          url,
          mimeType
        }
      },
      "appIcons": appIcons[] {
        rel,
        sizes,
        type,
        "asset": image.asset->{
          url,
          mimeType,
          metadata { dimensions }
        }
      }
    }
  }
`;

const DEFAULT_ALT = "Studio Tak";

const fallbackSiteSettings: SiteSettings = {
  logos: {
    primary: {
      url: "/logo-primary.svg",
      mimeType: "image/svg+xml",
      width: 180,
      height: 48,
    },
    markOnly: {
      url: "/logo-mark.svg",
      mimeType: "image/svg+xml",
      width: 64,
      height: 64,
    },
    rasterFallbacks: [],
    alt: DEFAULT_ALT,
    minHeight: 32,
    clearSpaceNote: null,
  },
  favicons: [
    {
      url: "/favicon.ico",
      rel: "icon",
      sizes: "32x32",
      type: "image/x-icon",
      mimeType: "image/x-icon",
      width: null,
      height: null,
    },
  ],
  appIcons: [],
};

export const siteSettingsFallback = fallbackSiteSettings;

function sanitizeNumber(value: MaybeNumber): number | null {
  if (typeof value !== "number") {
    return null;
  }

  if (Number.isNaN(value)) {
    return null;
  }

  return value;
}

function sanitizeString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAsset(asset: SanityFileAsset | null | undefined): SiteAsset | null {
  const url = sanitizeString(asset?.url);

  if (!url) {
    return null;
  }

  const width = sanitizeNumber(asset?.metadata?.dimensions?.width ?? null);
  const height = sanitizeNumber(asset?.metadata?.dimensions?.height ?? null);

  return {
    url,
    mimeType: sanitizeString(asset?.mimeType),
    width,
    height,
  };
}

function normalizeLogoEntry(entry: SanityLogoEntry | null | undefined): SiteLogoAsset | null {
  return normalizeAsset(entry ?? null);
}

function normalizeLogoSet(raw: RawLogoSet | null | undefined): SiteLogoSet {
  const primary = normalizeLogoEntry(raw?.primary);
  const markOnly = normalizeLogoEntry(raw?.markOnly);
  const rasterFallbacks = Array.isArray(raw?.rasterFallbacks)
    ? raw!.rasterFallbacks
        .map((item) => normalizeLogoEntry(item?.asset))
        .filter((asset): asset is SiteLogoAsset => Boolean(asset))
    : [];

  const alt = sanitizeString(raw?.alt) ?? DEFAULT_ALT;
  const minHeight = sanitizeNumber(raw?.minHeight ?? null);
  const clearSpaceNote = sanitizeString(raw?.clearSpaceNote);

  return {
    primary,
    markOnly,
    rasterFallbacks,
    alt,
    minHeight,
    clearSpaceNote,
  };
}

function normalizeIconEntry(entry: SanityIconEntry | null | undefined, defaultRel: string): SiteIconAsset | null {
  const asset = normalizeAsset(entry?.asset ?? null);

  if (!asset) {
    return null;
  }

  const rel = sanitizeString(entry?.rel) ?? defaultRel;
  const sizes = sanitizeString(entry?.sizes);
  const type = sanitizeString(entry?.type) ?? asset.mimeType;

  return {
    ...asset,
    rel,
    sizes,
    type,
  };
}

function normalizeFavicons(raw: RawLogoSet | null | undefined): SiteIconAsset[] {
  if (!Array.isArray(raw?.favicons)) {
    return [];
  }

  return raw!.favicons
    .map((entry) => normalizeIconEntry(entry, "icon"))
    .filter((icon): icon is SiteIconAsset => Boolean(icon));
}

function normalizeAppIcons(raw: RawLogoSet | null | undefined): SiteIconAsset[] {
  if (!Array.isArray(raw?.appIcons)) {
    return [];
  }

  return raw!.appIcons
    .map((entry) => normalizeIconEntry(entry, "apple-touch-icon"))
    .filter((icon): icon is SiteIconAsset => Boolean(icon));
}

function normalizeSiteSettings(doc: SiteSettingsDocument | null): SiteSettings | null {
  if (!doc?.logoSet) {
    return null;
  }

  const logos = normalizeLogoSet(doc.logoSet);
  const favicons = normalizeFavicons(doc.logoSet);
  const appIcons = normalizeAppIcons(doc.logoSet);

  return {
    logos,
    favicons,
    appIcons,
  } satisfies SiteSettings;
}

type Perspective = "published" | "previewDrafts";

async function fetchSiteSettingsFromSanity(perspective: Perspective): Promise<SiteSettings | null> {
  if (!hasSanityClient()) {
    return null;
  }

  const client = requireSanityClient();
  const configured = perspective === "previewDrafts"
    ? client.withConfig({ perspective: "previewDrafts", useCdn: false })
    : client;

  const result = await configured.fetch<SiteSettingsDocument | null>(siteSettingsQuery);
  return normalizeSiteSettings(result);
}

const cachedSiteSettingsFetcher = unstable_cache(
  async () => fetchSiteSettingsFromSanity("published"),
  ["site-settings"],
  { revalidate: 300 },
);

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!hasSanityClient()) {
    return fallbackSiteSettings;
  }

  const { isEnabled } = await draftMode();

  if (isEnabled) {
    const preview = await fetchSiteSettingsFromSanity("previewDrafts");
    return preview ?? fallbackSiteSettings;
  }

  const published = await cachedSiteSettingsFetcher();
  return published ?? fallbackSiteSettings;
}
