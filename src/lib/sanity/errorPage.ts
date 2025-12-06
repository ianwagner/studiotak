import groq from "groq";
import { draftMode } from "next/headers";
import { unstable_cache } from "next/cache";

import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { hasSanityClient, requireSanityClient } from "@/lib/sanity/config";
import type { BlockTheme, BlockThemeSettings } from "@/lib/sanity/types";

export type ErrorPageIcon = (SanityImageSource & { alt?: string | null }) | null;

export type ErrorPageData = {
  heading: string;
  buttonLabel: string;
  icon: ErrorPageIcon;
  iconAlt: string;
  theme: BlockTheme;
  backgroundTheme: BlockTheme;
};

type ErrorPageDocument = {
  heading?: string | null;
  buttonLabel?: string | null;
  icon?: ErrorPageIcon;
  theme?: BlockTheme | BlockThemeSettings | null;
};

type Perspective = "published" | "previewDrafts";

const DEFAULT_HEADING = "We couldn't find that page.";
const DEFAULT_BUTTON_LABEL = "Go back home";

export const errorPageFallback: ErrorPageData = {
  heading: DEFAULT_HEADING,
  buttonLabel: DEFAULT_BUTTON_LABEL,
  icon: null,
  iconAlt: "",
  theme: "light",
  backgroundTheme: "light",
};

const errorPageQuery = groq`
  *[_type == "errorPage"][0]{
    heading,
    buttonLabel,
    theme,
    icon{
      alt,
      asset->{
        _id,
        _ref,
        url,
        metadata{
          dimensions{
            width,
            height
          }
        }
      }
    }
  }
`;

function sanitizeString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasIconAsset(icon: ErrorPageIcon): icon is NonNullable<ErrorPageIcon> {
  if (!icon) {
    return false;
  }

  if (typeof icon === "string") {
    return icon.trim().length > 0;
  }

  if ("asset" in icon) {
    const asset = icon.asset;
    if (!asset) {
      return false;
    }

    if (typeof asset === "string") {
      return asset.trim().length > 0;
    }

    return Boolean(asset._ref ?? asset._id);
  }

  return Boolean((icon as { _ref?: string; _id?: string })._ref ?? (icon as { _id?: string })._id);
}

function normalizeIcon(icon: ErrorPageIcon): { source: ErrorPageIcon; alt: string } {
  if (!hasIconAsset(icon)) {
    return { source: null, alt: "" };
  }

  if (icon && typeof icon === "object") {
    const rawAlt = "alt" in icon ? icon.alt ?? null : null;
    const sanitizedAlt = sanitizeString(rawAlt) ?? "";

    return {
      source: {
        ...icon,
        alt: sanitizedAlt || undefined,
      } as ErrorPageIcon,
      alt: sanitizedAlt,
    };
  }

  return { source: icon, alt: "" };
}

type RawTheme = BlockTheme | BlockThemeSettings | null | undefined;

function normalizeTheme(theme: RawTheme): { background: BlockTheme; content: BlockTheme } {
  if (!theme) {
    return { background: "light", content: "light" };
  }

  if (typeof theme === "string") {
    return { background: theme, content: theme };
  }

  const background = (theme.background ?? theme.content ?? "light") as BlockTheme;
  const content = (theme.content ?? background ?? "light") as BlockTheme;

  return { background, content };
}

function normalizeErrorPage(doc: ErrorPageDocument | null | undefined): ErrorPageData | null {
  if (!doc) {
    return null;
  }

  const heading = sanitizeString(doc.heading) ?? DEFAULT_HEADING;
  const buttonLabel = sanitizeString(doc.buttonLabel) ?? DEFAULT_BUTTON_LABEL;
  const { source: icon, alt: iconAlt } = normalizeIcon(doc.icon ?? null);
  const { background: backgroundTheme, content: theme } = normalizeTheme(doc.theme ?? null);

  return {
    heading,
    buttonLabel,
    icon,
    iconAlt,
    theme,
    backgroundTheme,
  };
}

async function fetchErrorPageFromSanity(perspective: Perspective): Promise<ErrorPageData | null> {
  if (!hasSanityClient()) {
    return null;
  }

  const client = requireSanityClient();
  const configured =
    perspective === "previewDrafts"
      ? client.withConfig({ perspective: "previewDrafts", useCdn: false })
      : client;

  const result = await configured.fetch<ErrorPageDocument | null>(errorPageQuery);
  return normalizeErrorPage(result);
}

const cachedErrorPageFetcher = unstable_cache(
  async () => fetchErrorPageFromSanity("published"),
  ["errorPage"],
  { revalidate: 120, tags: ["errorPage"] },
);

export async function fetchErrorPage(): Promise<ErrorPageData> {
  if (!hasSanityClient()) {
    return errorPageFallback;
  }

  const { isEnabled } = await draftMode();

  if (isEnabled) {
    const preview = await fetchErrorPageFromSanity("previewDrafts");
    return preview ?? errorPageFallback;
  }

  const useCache = process.env.NODE_ENV === "production";
  if (!useCache) {
    const latest = await fetchErrorPageFromSanity("published");
    return latest ?? errorPageFallback;
  }

  const published = await cachedErrorPageFetcher();
  return published ?? errorPageFallback;
}
