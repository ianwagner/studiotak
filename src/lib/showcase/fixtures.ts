import type { SanityBlock } from "@/lib/sanity/types";
import type {
  ContentItem,
  DisplayBlockView,
  SetBlockView,
  TaxonomySummary,
} from "@/lib/sanity/pageViews";
import type {
  ContentTypePreset,
  ContentTypePresetKey,
} from "@/styles/contentTypePresets";
import { contentTypePresetList } from "@/styles/contentTypePresets";

const industries = {
  beauty: {
    id: "industry-beauty",
    label: "Beauty",
    slug: "beauty",
  },
  retail: {
    id: "industry-retail",
    label: "Retail",
    slug: "retail",
  },
  finance: {
    id: "industry-finance",
    label: "Financial Services",
    slug: "financial-services",
  },
} satisfies Record<string, TaxonomySummary>;

const personas = {
  productLead: {
    id: "persona-product-lead",
    label: "Product Lead",
    slug: "product-lead",
  },
  marketer: {
    id: "persona-marketer",
    label: "Marketing Lead",
    slug: "marketing-lead",
  },
  operations: {
    id: "persona-operations",
    label: "Operations",
    slug: "operations",
  },
} satisfies Record<string, TaxonomySummary>;

const contentTypes = {
  caseStudy: {
    id: "content-type-case-study",
    label: "Case Study",
    slug: "case-study",
  },
  example: {
    id: "content-type-example",
    label: "Example",
    slug: "example",
  },
  article: {
    id: "content-type-article",
    label: "Article",
    slug: "article",
  },
  feature: {
    id: "content-type-feature",
    label: "Feature Spotlight",
    slug: "feature-spotlight",
  },
} satisfies Record<string, TaxonomySummary>;

type PlaceholderColors = {
  background: string;
  foreground: string;
};

const createPlaceholderMedia = (label: string, colors: PlaceholderColors): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="${label}">
      <rect width="400" height="300" rx="24" fill="${colors.background}" />
      <text x="50%" y="52%" text-anchor="middle" fill="${colors.foreground}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="32" font-weight="600">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const mediaPlaceholders = {
  default: createPlaceholderMedia("Content", { background: "#f4f4f5", foreground: "#27272a" }),
  caseStudy: createPlaceholderMedia("Case Study", { background: "#f7dac6", foreground: "#ff700b" }),
  article: createPlaceholderMedia("Article", { background: "#e0f2fe", foreground: "#0f172a" }),
  feature: createPlaceholderMedia("Feature", { background: "#fef3c7", foreground: "#92400e" }),
  example: createPlaceholderMedia("Example", { background: "#ecfdf5", foreground: "#047857" }),
};

type ContentItemConfig = {
  id: string;
  type: ContentItem["type"];
  title: string;
  industries?: TaxonomySummary[];
  personas?: TaxonomySummary[];
  contentType?: TaxonomySummary | null;
  publishedAt?: string;
  imageUrl?: string;
  imageAlt?: string | null;
};

const createContentItem = ({
  id,
  type,
  title,
  industries: industryList = [],
  personas: personaList = [],
  contentType = null,
  publishedAt,
  imageUrl,
  imageAlt = null,
}: ContentItemConfig): ContentItem => ({
  id,
  type,
  title,
  status: "approved",
  industries: industryList,
  personas: personaList,
  contentType,
  publishedAt,
  imageUrl,
  imageAlt,
});

const contentItems = {
  beautyLaunch: createContentItem({
    id: "example-beauty-launch",
    type: "example",
    title: "GlowUp Launch Campaign",
    industries: [industries.beauty],
    personas: [personas.marketer],
    contentType: contentTypes.caseStudy,
    imageUrl: mediaPlaceholders.caseStudy,
  }),
  beautyLifecycle: createContentItem({
    id: "feature-beauty-lifecycle",
    type: "feature",
    title: "Lifecycle Journeys for Beauty",
    industries: [industries.beauty],
    personas: [personas.productLead],
    contentType: contentTypes.feature,
    imageUrl: mediaPlaceholders.feature,
  }),
  beautyInsights: createContentItem({
    id: "article-beauty-insights",
    type: "article",
    title: "Trends Shaping the Beauty Market",
    industries: [industries.beauty],
    personas: [personas.operations],
    contentType: contentTypes.article,
    publishedAt: "2024-03-12T10:00:00Z",
    imageUrl: mediaPlaceholders.article,
  }),
  retailAutomation: createContentItem({
    id: "feature-retail-automation",
    type: "feature",
    title: "Connected Retail Integrations",
    industries: [industries.retail],
    personas: [personas.operations],
    contentType: contentTypes.feature,
    imageUrl: mediaPlaceholders.feature,
  }),
  personaPlaybook: createContentItem({
    id: "article-persona-playbook",
    type: "article",
    title: "Personalization Playbook",
    personas: [personas.marketer],
    contentType: contentTypes.article,
    imageUrl: mediaPlaceholders.article,
  }),
  opsChecklist: createContentItem({
    id: "feature-ops-checklist",
    type: "feature",
    title: "Operational Excellence Checklist",
    personas: [personas.operations],
    industries: [industries.finance],
    contentType: contentTypes.feature,
    imageUrl: mediaPlaceholders.feature,
  }),
  fintechExample: createContentItem({
    id: "example-fintech-onboarding",
    type: "example",
    title: "FinPay Onboarding Benchmark",
    industries: [industries.finance],
    personas: [personas.productLead],
    contentType: contentTypes.example,
    publishedAt: "2024-02-04T08:30:00Z",
    imageUrl: mediaPlaceholders.example,
  }),
  generalOverview: createContentItem({
    id: "resource-general-overview",
    type: "resource",
    title: "Customer Engagement Overview",
    imageUrl: mediaPlaceholders.default,
  }),
};

const portableParagraph = (
  key: string,
  text: string,
  options: { style?: string; listItem?: "bullet" | "number" } = {},
) => ({
  _type: "block",
  _key: key,
  style: options.style ?? "normal",
  markDefs: [],
  children: [
    {
      _type: "span",
      _key: `${key}-0`,
      text,
      marks: [],
    },
  ],
  ...(options.listItem ? { listItem: options.listItem } : {}),
});

const createPortableTextBlock = (): SanityBlock => ({
  _type: "portableText",
  _key: "showcase-portable-text",
  content: [
    portableParagraph("portable-heading", "Portable Text Block", { style: "h3" }),
    portableParagraph(
      "portable-intro",
      "Portable text handles multi-paragraph storytelling with embedded styles.",
    ),
    portableParagraph("portable-callout", "Use this block whenever rich editorial copy is needed."),
    portableParagraph("portable-bullet-1", "Systematically surface the core value first.", {
      listItem: "bullet",
    }),
    portableParagraph("portable-bullet-2", "Follow with proof points to reinforce the message.", {
      listItem: "bullet",
    }),
  ],
});

const createRichTextBlock = (): SanityBlock => ({
  _type: "richText",
  _key: "showcase-rich-text",
  body: [
    portableParagraph("rich-text-heading", "Rich Text Block", { style: "h3" }),
    portableParagraph(
      "rich-text-lede",
      "Rich text mirrors the styling used in long-form explainers and release notes.",
    ),
    portableParagraph(
      "rich-text-secondary",
      "Add emphasis to headings with typographic hierarchy and intersperse media as needed.",
    ),
  ],
});

const createBlockContentBlock = (): SanityBlock => ({
  _type: "blockContent",
  _key: "showcase-block-content",
  value: [
    portableParagraph("block-content-heading", "Block Content", { style: "h3" }),
    portableParagraph("block-content-title", "Modular content block for simple callouts."),
    portableParagraph("block-content-list-1", "Supports short and direct bullet lists.", {
      listItem: "bullet",
    }),
    portableParagraph("block-content-list-2", "Perfect for lightweight layout validation.", {
      listItem: "bullet",
    }),
  ],
});

type SetBlockFactory = (key: string) => SetBlockView;
type DisplayBlockFactory = (key: string) => DisplayBlockView;

const createCuratedSetBlock: SetBlockFactory = (key) => ({
  _type: "setBlock",
  _key: key,
  title: "Launch Campaign Highlights",
  description: "Hand-selected examples that match launch planning moments.",
  setTitle: "Launch curator picks",
  setType: "curatedSet",
  theme: "light",
  backgroundTheme: "light",
  density: "default",
  layout: {},
  items: [
    contentItems.beautyLaunch,
    contentItems.fintechExample,
    contentItems.retailAutomation,
  ],
});

const createGeneratedSetBlock: SetBlockFactory = (key) => ({
  _type: "setBlock",
  _key: key,
  title: "Auto-generated Essentials",
  description: "Generated sets pull from latest approved content across the library.",
  setType: "generated",
  theme: "light",
  backgroundTheme: "light",
  density: "default",
  layout: {},
  items: [
    contentItems.beautyInsights,
    contentItems.personaPlaybook,
    contentItems.opsChecklist,
  ],
});

const createIndustryDynamicSetBlock: SetBlockFactory = (key) => ({
  _type: "setBlock",
  _key: key,
  title: "Beauty Industry Focus",
  description: "Dynamic filtering with an industry constraint surfaces relevant material.",
  setTitle: "Beauty industry dynamic set",
  setType: "dynamicSet",
  theme: "light",
  backgroundTheme: "light",
  density: "default",
  layout: {},
  items: [
    contentItems.beautyLaunch,
    contentItems.beautyLifecycle,
    contentItems.beautyInsights,
  ],
});

const createPersonaDynamicSetBlock: SetBlockFactory = (key) => ({
  _type: "setBlock",
  _key: key,
  title: "Marketing Persona Lens",
  description: "Persona-only filters allow cross-industry inspiration for a specific role.",
  setTitle: "Marketing persona dynamic set",
  setType: "dynamicSet",
  resolvedFromFallback: true,
  theme: "light",
  backgroundTheme: "light",
  density: "default",
  layout: {},
  items: [
    contentItems.beautyLaunch,
    contentItems.personaPlaybook,
    contentItems.retailAutomation,
  ],
});

const createCombinedDynamicSetBlock: SetBlockFactory = (key) => ({
  _type: "setBlock",
  _key: key,
  title: "Product Lead in Financial Services",
  description: "Industry + persona filters tighten recommendations while staying fresh.",
  setTitle: "Financial services product leads",
  setType: "dynamicSet",
  theme: "light",
  backgroundTheme: "light",
  density: "default",
  layout: {},
  items: [
    contentItems.fintechExample,
    contentItems.opsChecklist,
  ],
});

const createGalleryDisplayBlock: DisplayBlockFactory = (key) => ({
  _type: "displayBlock",
  _key: key,
  displayType: "gallery",
  setType: "generated",
  setTitle: "Gallery Library",
  setDescription: "A clean gallery layout that scales gracefully with the viewport.",
  theme: "light",
  backgroundTheme: "light",
  density: "default",
  layout: {},
  items: [
    contentItems.beautyLaunch,
    contentItems.retailAutomation,
    contentItems.personaPlaybook,
    contentItems.opsChecklist,
  ],
});

const createSplayDisplayBlock: DisplayBlockFactory = (key) => ({
  _type: "displayBlock",
  _key: key,
  displayType: "splay",
  splayLimit: 4,
  splayGap: 24,
  setType: "generated",
  setTitle: "Splayed Highlights",
  setDescription: "Layered arrangement with playful rotation for inspiration spreads.",
  theme: "light",
  backgroundTheme: "light",
  density: "default",
  layout: {},
  items: [
    contentItems.beautyLaunch,
    contentItems.fintechExample,
    contentItems.retailAutomation,
    contentItems.beautyInsights,
    contentItems.opsChecklist,
  ],
});

export type SetShowcaseSection = {
  title: string;
  description: string;
  block: SetBlockView;
};

export const getBlockShowcaseFixtures = (): SanityBlock[] => [
  createPortableTextBlock(),
  createRichTextBlock(),
  createBlockContentBlock(),
  createCuratedSetBlock("showcase-curated-set"),
  createGeneratedSetBlock("showcase-generated-set"),
  createIndustryDynamicSetBlock("showcase-dynamic-industry"),
  createGalleryDisplayBlock("showcase-display-gallery"),
  createSplayDisplayBlock("showcase-display-splay"),
];

export const getSetShowcaseSections = (): SetShowcaseSection[] => [
  {
    title: "Industry filter",
    description: "Dynamic set constrained to the Beauty industry.",
    block: createIndustryDynamicSetBlock("sets-showcase-industry"),
  },
  {
    title: "Persona filter",
    description: "Dynamic set filtered to Marketing personas only (fallback example).",
    block: createPersonaDynamicSetBlock("sets-showcase-persona"),
  },
  {
    title: "Industry + persona",
    description: "Dynamic set combining Financial Services and Product Lead filters.",
    block: createCombinedDynamicSetBlock("sets-showcase-combined"),
  },
];

export const getSetBlockFixtures = () => ({
  curated: createCuratedSetBlock("fixture-curated"),
  generated: createGeneratedSetBlock("fixture-generated"),
  industry: createIndustryDynamicSetBlock("fixture-industry"),
  persona: createPersonaDynamicSetBlock("fixture-persona"),
  combined: createCombinedDynamicSetBlock("fixture-combined"),
});

const presetContentItemMap: Record<ContentTypePresetKey, ContentItem> = {
  default: contentItems.generalOverview,
  "case-study": contentItems.beautyLaunch,
  article: contentItems.beautyInsights,
  "feature-spotlight": contentItems.beautyLifecycle,
  example: contentItems.fintechExample,
};

export type ContentTypeShowcaseEntry = {
  preset: ContentTypePreset;
  item: ContentItem;
};

export const getContentTypeShowcaseEntries = (): ContentTypeShowcaseEntry[] =>
  contentTypePresetList.map((preset) => ({
    preset,
    item: presetContentItemMap[preset.key],
  }));
