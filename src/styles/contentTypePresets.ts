import type { TaxonomySummary } from "@/lib/sanity/pageViews";

import { gmColors, gmRadius, gmSpacing, gmTypography } from "./designTokens";

type ContentTypePresetKey =
  | "default"
  | "case-study"
  | "article"
  | "feature-spotlight"
  | "example";

type ContentTypePreset = {
  key: ContentTypePresetKey;
  label: string;
  description: string;
  card: string[];
  metaRow: string[];
  typeLabel: string[];
  contentTypeBadge: string[];
  title: string[];
  mediaWrapper: string[];
  mediaFallback: string[];
};

const BASE_CARD = [
  gmSpacing["gm-spacing-compact-stack"],
  gmRadius["gm-radius-base"],
  "border",
  gmSpacing["gm-spacing-card"],
  gmColors["gm-color-border-subtle"],
  gmColors["gm-color-surface-raised"],
  "shadow-sm",
  gmColors["gm-color-shadow-subtle"],
] as const;

const BASE_META_ROW = [
  "flex flex-wrap items-center justify-between",
  gmSpacing["gm-spacing-grid-tight"],
  gmTypography["gm-typography-label-xs"],
  gmColors["gm-color-text-muted"],
] as const;

const BASE_TYPE_LABEL = [gmColors["gm-color-text-subtle"]] as const;

const BASE_CONTENT_TYPE_BADGE = [
  gmRadius["gm-radius-pill"],
  gmSpacing["gm-spacing-chip"],
  gmTypography["gm-typography-label-xs"],
  gmColors["gm-color-surface-tint"],
  gmColors["gm-color-text-secondary"],
] as const;

const BASE_TITLE = [
  gmTypography["gm-typography-body-lg"],
  gmTypography["gm-typography-strong"],
  gmColors["gm-color-text-primary"],
] as const;

const BASE_MEDIA_WRAPPER = [
  "block",
  "aspect-[4/3]",
  "overflow-hidden",
  "relative",
  gmRadius["gm-radius-lg"],
  gmColors["gm-color-surface-muted"],
] as const;

const BASE_MEDIA_FALLBACK = [
  "flex",
  "h-full",
  "w-full",
  "items-center",
  "justify-center",
  gmTypography["gm-typography-label-xs"],
  gmColors["gm-color-text-subtle"],
] as const;

const cloneBase = () => ({
  card: [...BASE_CARD],
  metaRow: [...BASE_META_ROW],
  typeLabel: [...BASE_TYPE_LABEL],
  contentTypeBadge: [...BASE_CONTENT_TYPE_BADGE],
  title: [...BASE_TITLE],
  mediaWrapper: [...BASE_MEDIA_WRAPPER],
  mediaFallback: [...BASE_MEDIA_FALLBACK],
});

type PresetOverrides = Partial<
  Omit<ContentTypePreset, "key" | "label" | "description">
>;

const createPreset = (
  key: ContentTypePresetKey,
  label: string,
  description: string,
  overrides: PresetOverrides = {},
): ContentTypePreset => ({
  key,
  label,
  description,
  ...cloneBase(),
  ...overrides,
});

export const contentTypePresets = {
  default: createPreset("default", "Default", "Fallback styling for general content."),
  "case-study": createPreset("case-study", "Case Study", "Success stories with impact."),
  article: createPreset("article", "Article", "Editorial explainers and updates."),
  "feature-spotlight": createPreset(
    "feature-spotlight",
    "Feature Spotlight",
    "Product walkthroughs and highlights.",
  ),
  example: createPreset(
    "example",
    "Example",
    "Implementation inspiration from the library.",
    {
      card: [
        gmRadius["gm-radius-lg"],
        gmColors["gm-color-border-subtle"],
        "border",
        "bg-transparent",
        "p-0",
        "overflow-hidden",
      ],
      mediaWrapper: [],
      mediaFallback: [],
      metaRow: [],
      typeLabel: [],
      contentTypeBadge: [],
      title: [],
    },
  ),
} satisfies Record<ContentTypePresetKey, ContentTypePreset>;

type ContentTypeIdentifier = TaxonomySummary | string | null | undefined;

const isContentTypePresetKey = (value: string): value is ContentTypePresetKey =>
  Object.prototype.hasOwnProperty.call(contentTypePresets, value);

const normalizePresetKey = (input: ContentTypeIdentifier): ContentTypePresetKey => {
  if (!input) {
    return "default";
  }

  if (typeof input === "string") {
    const candidate = input.toLowerCase();
    return isContentTypePresetKey(candidate) ? candidate : "default";
  }

  const slug = input.slug?.toLowerCase();
  if (slug && isContentTypePresetKey(slug)) {
    return slug;
  }

  const id = input.id?.toLowerCase();
  if (id && isContentTypePresetKey(id)) {
    return id;
  }

  return "default";
};

export const getContentTypePreset = (input: ContentTypeIdentifier): ContentTypePreset => {
  const key = normalizePresetKey(input);
  return contentTypePresets[key];
};

export const contentTypePresetList: ContentTypePreset[] = Object.values(contentTypePresets);

export type { ContentTypePreset, ContentTypePresetKey };
