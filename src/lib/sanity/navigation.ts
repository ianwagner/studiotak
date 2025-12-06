import groq from "groq";
import { draftMode } from "next/headers";
import { unstable_cache } from "next/cache";

import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { resolveRouteHref, type RouteReference } from "@/lib/routes";
import { hasSanityClient, requireSanityClient } from "@/lib/sanity/config";
import type { BlockDensity, BlockLayoutSettings, BlockTheme, BlockThemeSettings } from "@/lib/sanity/types";

export type NavigationAudience = "internal" | "external";

export type NavigationIcon = (SanityImageSource & { alt?: string | null }) | null;

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  isCta: boolean;
  audience?: NavigationAudience;
  icon: NavigationIcon;
  children: NavigationItem[];
};

export type NavigationData = {
  anchor: string | null;
  theme: BlockTheme;
  backgroundTheme: BlockTheme;
  density: BlockDensity;
  layout: BlockLayoutSettings;
  itemSpacingToken: string;
  typographyToken: string;
  linkColorToken: string;
  hoverStateToken: string;
  focusRingToken: string;
  items: NavigationItem[];
};

type NavigationItemDocument = {
  _key?: string;
  label?: string;
  audience?: NavigationAudience | null;
  isCta?: boolean;
  icon?: NavigationIcon;
  route?: RouteReference | null;
  externalUrl?: string | null;
  children?: NavigationItemDocument[] | null;
};

type NavigationDocument = {
  anchor?: string | null;
  theme?: BlockTheme | BlockThemeSettings | null;
  density?: BlockDensity | null;
  layout?: BlockLayoutSettings | null;
  itemSpacingToken?: string | null;
  typographyToken?: string | null;
  linkColorToken?: string | null;
  hoverStateToken?: string | null;
  focusRingToken?: string | null;
  items?: NavigationItemDocument[] | null;
};

const DEFAULT_LAYOUT: BlockLayoutSettings = {
  container: "gm-layout-shell",
  maxWidth: "gm-layout-shell-max",
  inlinePadding: "gm-spacing-shell-inline",
  blockPadding: "gm-spacing-shell-block",
  stackSpacing: "gm-spacing-shell-stack",
};

const DEFAULT_THEME: BlockTheme = "light";
const DEFAULT_DENSITY: BlockDensity = "default";
const DEFAULT_ITEM_SPACING_TOKEN = "gm-spacing-shell-stack";
const DEFAULT_TYPOGRAPHY_TOKEN = "gm-typography-body-sm";
const DEFAULT_LINK_COLOR_TOKEN = "gm-color-text-primary";
const DEFAULT_HOVER_TOKEN = "gm-color-hover-surface-tint";
const DEFAULT_FOCUS_TOKEN = "gm-color-border-accent";

const resolveNavigationTheme = (
  theme: BlockTheme | BlockThemeSettings | null | undefined,
): { background: BlockTheme; content: BlockTheme } => {
  if (!theme) {
    return { background: DEFAULT_THEME, content: DEFAULT_THEME };
  }

  if (typeof theme === "string") {
    return { background: theme, content: theme };
  }

  const background = (theme.background ?? theme.content ?? DEFAULT_THEME) as BlockTheme;
  const content = (theme.content ?? background ?? DEFAULT_THEME) as BlockTheme;

  return { background, content };
};

const FALLBACK_NAV_ITEMS: NavigationItem[] = [
  {
    id: "fallback-home",
    label: "Home",
    href: "/",
    isExternal: false,
    isCta: false,
    icon: null,
    children: [],
  },
  {
    id: "fallback-solutions",
    label: "Solutions",
    href: "/solutions",
    isExternal: false,
    isCta: false,
    icon: null,
    children: [
      {
        id: "fallback-solutions-journey",
        label: "Journey Orchestration",
        href: "/solutions/journey-orchestration",
        isExternal: false,
        isCta: false,
        icon: null,
        children: [],
      },
      {
        id: "fallback-solutions-insights",
        label: "Analytics & Insights",
        href: "/solutions/analytics-insights",
        isExternal: false,
        isCta: false,
        icon: null,
        children: [],
      },
      {
        id: "fallback-solutions-automation",
        label: "Lifecycle Automation",
        href: "/solutions/lifecycle-automation",
        isExternal: false,
        isCta: false,
        icon: null,
        children: [],
      },
    ],
  },
  {
    id: "fallback-blog",
    label: "Blog",
    href: "https://blog.studiotak.com",
    isExternal: true,
    isCta: false,
    icon: null,
    children: [],
  },
  {
    id: "fallback-get-started",
    label: "Get Started",
    href: "/contact",
    isExternal: false,
    isCta: true,
    icon: null,
    children: [],
  },
];

export const navigationFallback: NavigationData = {
  anchor: "site-navigation",
  theme: DEFAULT_THEME,
  backgroundTheme: DEFAULT_THEME,
  density: DEFAULT_DENSITY,
  layout: {...DEFAULT_LAYOUT},
  itemSpacingToken: DEFAULT_ITEM_SPACING_TOKEN,
  typographyToken: DEFAULT_TYPOGRAPHY_TOKEN,
  linkColorToken: DEFAULT_LINK_COLOR_TOKEN,
  hoverStateToken: DEFAULT_HOVER_TOKEN,
  focusRingToken: DEFAULT_FOCUS_TOKEN,
  items: FALLBACK_NAV_ITEMS,
};

const navigationItemProjection = groq`
  _key,
  label,
  audience,
  isCta,
  icon,
  "route": destination.route->{
    product,
    path
  },
  "externalUrl": destination.externalUrl,
  children[]{
    _key,
    label,
    audience,
    isCta,
    icon,
    "route": destination.route->{
      product,
      path
    },
    "externalUrl": destination.externalUrl,
    children[]{
      _key,
      label,
      audience,
      isCta,
      icon,
      "route": destination.route->{
        product,
        path
      },
      "externalUrl": destination.externalUrl
    }
  }
`;

const navigationQuery = groq`
  *[_type == "navigation"][0]{
    anchor,
    theme,
    density,
    layout,
    itemSpacingToken,
    typographyToken,
    linkColorToken,
    hoverStateToken,
    focusRingToken,
    "items": items[]{
      ${navigationItemProjection}
    }
  }
`;

type Perspective = "published" | "previewDrafts";

type NormalizedDestination = {
  href: string;
  isExternal: boolean;
} | null;

function resolveDestination(item: NavigationItemDocument): NormalizedDestination {
  const internalHref = resolveRouteHref(item.route ?? null);
  if (internalHref) {
    return {
      href: internalHref,
      isExternal: false,
    };
  }

  const url = item.externalUrl?.trim();
  if (url) {
    const normalizedUrl = url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("tel:")
      ? url
      : url.startsWith("/")
      ? url
      : `/${url}`;
    const isExternal = /^(https?:)?\/\//i.test(normalizedUrl) || normalizedUrl.startsWith("mailto:") || normalizedUrl.startsWith("tel:");

    return {
      href: normalizedUrl,
      isExternal,
    };
  }

  return null;
}

function sanitizeLabel(label?: string | null): string {
  const trimmed = label?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Untitled";
}

function normalizeLayout(layout?: BlockLayoutSettings | null): BlockLayoutSettings {
  return {
    ...DEFAULT_LAYOUT,
    ...(layout ?? {}),
  };
}

function normalizeIcon(icon?: NavigationIcon): NavigationIcon {
  if (!icon || typeof icon !== "object") {
    return null;
  }

  if (!("asset" in icon) || !icon.asset) {
    return null;
  }

  return icon;
}

function normalizeItems(items?: NavigationItemDocument[] | null): NavigationItem[] {
  if (!items) {
    return [];
  }

  const normalized = items
    .map((item) => {
      const destination = resolveDestination(item);
      const label = sanitizeLabel(item.label);
      const children = normalizeItems(item.children);

      if (!destination && children.length === 0) {
        return null;
      }

      return {
        id: item._key ?? label.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""),
        label,
        href: destination?.href ?? "#",
        isExternal: destination?.isExternal ?? false,
        isCta: Boolean(item.isCta),
        audience: item.audience ?? undefined,
        icon: normalizeIcon(item.icon),
        children,
      } satisfies NavigationItem;
    })
    .filter(Boolean) as NavigationItem[];

  return normalized;
}

function normalizeNavigation(doc: NavigationDocument | null): NavigationData | null {
  if (!doc) {
    return null;
  }

  const items = normalizeItems(doc.items);
  const { background, content } = resolveNavigationTheme(doc.theme);

  return {
    anchor: doc.anchor ?? navigationFallback.anchor,
    theme: content,
    backgroundTheme: background,
    density: (doc.density ?? DEFAULT_DENSITY) as BlockDensity,
    layout: normalizeLayout(doc.layout),
    itemSpacingToken: doc.itemSpacingToken ?? DEFAULT_ITEM_SPACING_TOKEN,
    typographyToken: doc.typographyToken ?? DEFAULT_TYPOGRAPHY_TOKEN,
    linkColorToken: doc.linkColorToken ?? DEFAULT_LINK_COLOR_TOKEN,
    hoverStateToken: doc.hoverStateToken ?? DEFAULT_HOVER_TOKEN,
    focusRingToken: doc.focusRingToken ?? DEFAULT_FOCUS_TOKEN,
    items: items.length > 0 ? items : navigationFallback.items,
  } satisfies NavigationData;
}

async function fetchNavigationFromSanity(perspective: Perspective): Promise<NavigationData | null> {
  if (!hasSanityClient()) {
    return null;
  }

  const client = requireSanityClient();
  const configured = perspective === "previewDrafts"
    ? client.withConfig({ perspective: "previewDrafts", useCdn: false })
    : client;

  const result = await configured.fetch<NavigationDocument | null>(navigationQuery);
  return normalizeNavigation(result);
}

const cachedNavigationFetcher = unstable_cache(
  async () => fetchNavigationFromSanity("published"),
  ["navigation"],
  { revalidate: 30, tags: ["navigation"] },
);

export async function fetchNavigation(): Promise<NavigationData> {
  if (!hasSanityClient()) {
    return navigationFallback;
  }

  const { isEnabled } = await draftMode();

  if (isEnabled) {
    const preview = await fetchNavigationFromSanity("previewDrafts");
    return preview ?? navigationFallback;
  }

  const useCache = process.env.NODE_ENV === "production";
  if (!useCache) {
    const latest = await fetchNavigationFromSanity("published");
    return latest ?? navigationFallback;
  }

  const published = await cachedNavigationFetcher();
  return published ?? navigationFallback;
}
