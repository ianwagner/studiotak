import type { GhostPost } from "@/lib/ghost";

export type LearnGroupKey = "learn" | "campfire" | "compare";

export type LearnGroup = {
  key: LearnGroupKey;
  title: string;
  description: string;
};

export const LEARN_GROUPS: LearnGroup[] = [
  {
    key: "learn",
    title: "Learn",
    description: ""
  },
  {
    key: "campfire",
    title: "Reference",
    description: ""
  },
  {
    key: "compare",
    title: "Compare",
    description: ""
  }
];

const ACADEMY_TAGS = new Set(["academy", "studio-tak-academy", "tak-academy"]);
const REFERENCE_TAGS = new Set([
  "reference",
  "references",
  "campfire-reference",
  "campfire-references",
  "campfire-help"
]);
const CAMPFIRE_COMPARE_TAGS = new Set(["campfire-compare"]);

const COLLECTION_TAGS = new Set(Array.from(ACADEMY_TAGS).concat(Array.from(REFERENCE_TAGS)));
const NON_TOPIC_TAGS = new Set(["product-campfire"]);
const TITLE_CASE_EXCEPTIONS: Record<string, string> = {
  ai: "AI",
  b2b: "B2B",
  bfcm: "BFCM",
  cpg: "CPG",
  dtc: "DTC",
  meta: "Meta",
  saas: "SaaS"
};
const TOPIC_TITLE_OVERRIDES: Record<string, string> = {
  "brand ads": "Branded Ads",
  "media buying": "Media Buying"
};
const LEARN_TITLE_TAG_PATTERN = /^#?learn-title\s*:\s*(.+)$/i;
// Keep recently published articles compact in Learn while their editorial
// `#learn-title:` Ghost tag is being added. A Ghost tag always takes priority.
const LEARN_TITLE_FALLBACKS: Record<string, string> = {
  "how-to-increase-your-facebook-ad-budget-without-lowering-performance": "Scale Your Ad Budget",
  "what-tools-actually-help-you-scale-social-media-ads-without-losing-quality": "Scale Social Ads",
  "ad-management-platforms-for-scaling-facebook-ads-what-to-actually-look-for": "Choose an Ad Management Platform",
  "how-to-identify-and-expand-high-performing-audiences-on-meta": "Expand High-Performing Audiences",
  "tools-for-automating-meta-ad-budget-optimization-what-actually-helps": "Automate Meta Ad Budgets"
};

const normalizeCollectionSlug = (slug: string) => slug.toLowerCase().replace(/^hash-/, "");

export const getLearnGroupForPost = (post: GhostPost): LearnGroupKey => {
  const tags = post.tags ?? [];
  const tagSlugs = tags.map((tag) => normalizeCollectionSlug(tag.slug));
  if (tagSlugs.some((slug) => CAMPFIRE_COMPARE_TAGS.has(slug))) return "compare";
  if (tagSlugs.some((slug) => REFERENCE_TAGS.has(slug))) return "campfire";
  if (tagSlugs.some((slug) => ACADEMY_TAGS.has(slug))) return "learn";
  return "learn";
};

/**
 * Optional Ghost editorial override for compact Learn navigation labels.
 * Add an internal tag such as `#learn-title: How many ads do we need?`.
 */
export const getLearnDisplayTitle = (post: GhostPost) => {
  const override = (post.tags ?? []).find((tag) => {
    if (tag.visibility !== "internal") return false;
    return LEARN_TITLE_TAG_PATTERN.test(tag.name);
  });
  const label = override?.name.match(LEARN_TITLE_TAG_PATTERN)?.[1]?.trim();
  return label || LEARN_TITLE_FALLBACKS[post.slug] || post.title;
};

const toTopicTitle = (value: string) => {
  const normalizedValue = value.replace(/[-_]+/g, " ").trim().toLowerCase();
  if (TOPIC_TITLE_OVERRIDES[normalizedValue]) return TOPIC_TITLE_OVERRIDES[normalizedValue];

  return value
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => {
      const normalized = word.toLowerCase();
      if (TITLE_CASE_EXCEPTIONS[normalized]) return TITLE_CASE_EXCEPTIONS[normalized];
      if (/^[A-Z0-9]{2,6}$/.test(word)) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
};

const formatTopicName = (name: string, slug: string) => {
  const withoutPrefix = name.replace(/^(topic|product|audience|category)\s*:\s*/i, "");
  const cleaned = slug.startsWith("campfire-") ? withoutPrefix.replace(/^campfire\s*[-–—:]?\s*/i, "") : withoutPrefix;
  return cleaned ? toTopicTitle(cleaned) : "Getting Started";
};

export const getLearnTopicForPost = (post: GhostPost, group: LearnGroupKey) => {
  if (group === "compare") return "Compare";

  const candidateTags = (post.tags ?? []).filter((item) => {
    const slug = normalizeCollectionSlug(item.slug);
    return item.visibility !== "internal" && !COLLECTION_TAGS.has(slug) && !NON_TOPIC_TAGS.has(slug);
  });
  const tag =
    candidateTags.find((item) => {
      const slug = normalizeCollectionSlug(item.slug);
      return slug.startsWith("topic-") || /^topic\s*:/i.test(item.name);
    }) ?? candidateTags[0];

  if (!tag) return group === "campfire" ? "Getting started" : "Studio Tak essentials";
  return formatTopicName(tag.name, tag.slug);
};

export const postMatchesLearnSearch = (post: GhostPost, query: string) => {
  if (!query) return true;
  const searchable = [post.title, post.excerpt, ...(post.tags ?? []).map((tag) => tag.name)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
};
