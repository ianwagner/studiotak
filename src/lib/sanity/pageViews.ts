import groq from "groq";

import { hasSanityClient, requireSanityClient } from "@/lib/sanity/config";
import type { BlockTheme, SanityBlock } from "@/lib/sanity/types";

type SortOrder = "newestFirst" | "oldestFirst" | "alphabeticalAsc" | "random";
type FallbackMode = "strict" | "pinsOnly" | "anyApproved";

export type TaxonomySummary = {
  id: string;
  label: string;
  slug: string;
  description?: string;
  icon?: string;
};

export type HeroContent = {
  headline: string;
  tagline?: string;
  body?: SanityBlock[];
};

export type ContentItem = {
  id: string;
  type: string;
  title: string;
  status?: string;
  publishedAt?: string;
  contentType?: TaxonomySummary | null;
  industries: TaxonomySummary[];
  personas: TaxonomySummary[];
  imageUrl?: string | null;
};

export type PaginationInfo = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type SetBlockView = SanityBlock & {
  _type: "setBlock";
  title: string;
  description?: string;
  setId?: string;
  setTitle?: string;
  setType: "dynamicSet" | "curatedSet" | "generated";
  items: ContentItem[];
  pagination?: PaginationInfo;
  resolvedFromFallback?: boolean;
  theme: BlockTheme;
};

type PageContext = {
  source: "document" | "generated";
  industry?: TaxonomySummary;
  persona?: TaxonomySummary;
  pageTitle: string;
};

export type PageViewData = {
  hero: HeroContent;
  blocks: SetBlockView[];
  context: PageContext;
};

type ContentDocument = {
  _id: string;
  _type: string;
  title: string;
  status?: string;
  _createdAt?: string;
  industries?: TaxonomySummary[];
  personas?: TaxonomySummary[];
  contentType?: TaxonomySummary | null;
  imageUrl?: string | null;
};

type CuratedSetDoc = {
  _id: string;
  _type: "curatedSet";
  title?: string;
  description?: string;
  items?: ContentDocument[];
};

type DynamicSetDoc = {
  _id: string;
  _type: "dynamicSet";
  title?: string;
  description?: string;
  limit: number;
  sortOrder: SortOrder;
  fallbackMode: FallbackMode;
  filters?: {
    industries?: string[];
    personas?: string[];
    contentTypes?: string[];
  } | null;
  pins?: ContentDocument[];
  updatedAt?: string;
  revision?: string;
};

type ResolvedFilterSet = {
  industryIds?: string[];
  personaIds?: string[];
  contentTypeIds?: string[];
};

type SetBlockDoc = {
  _key?: string;
  title?: string;
  description?: string;
  set?: CuratedSetDoc | DynamicSetDoc | null;
  fallbackSet?: CuratedSetDoc | DynamicSetDoc | null;
  theme?: BlockTheme | null;
};

type IndustryPageDoc = {
  title?: string;
  hero?: HeroContent | null;
  blocks?: SetBlockDoc[];
  industry?: TaxonomySummary | null;
};

type PersonaPageDoc = {
  title?: string;
  hero?: HeroContent | null;
  blocks?: SetBlockDoc[];
  persona?: TaxonomySummary | null;
};

type TaxonomyDoc = {
  _id: string;
  label: string;
  description?: string;
  icon?: string;
  slug?: { current?: string };
};

const taxonomyProjection = groq`
  _id,
  label,
  description,
  icon,
  "slug": slug.current,
`;

const contentProjection = groq`
  _id,
  _type,
  title,
  "status": status,
  "industries": industries[]->{${taxonomyProjection}},
  "personas": personas[]->{${taxonomyProjection}},
  "contentType": contentType->{${taxonomyProjection}},
  "imageUrl": select(
    _type == "example" && defined(media.asset) => media.asset->url,
    null
  ),
  _createdAt,
`;

const setProjection = groq`
  _id,
  _type,
  title,
  description,
  "items": select(
    _type == "curatedSet" => items[@->status == "approved"]->{${contentProjection}}
  ),
  "limit": select(_type == "dynamicSet" => limit),
  "sortOrder": select(_type == "dynamicSet" => sortOrder),
  "fallbackMode": select(_type == "dynamicSet" => fallbackMode),
  "filters": select(
    _type == "dynamicSet" => {
      "industries": filters.industries[]->_id,
      "personas": filters.personas[]->_id,
      "contentTypes": filters.contentTypes[]->_id,
    }
  ),
  "pins": select(
    _type == "dynamicSet" => pins[@->status == "approved"]->{${contentProjection}}
  ),
  "updatedAt": select(_type == "dynamicSet" => _updatedAt),
  "revision": select(_type == "dynamicSet" => _rev),
`;

const industryPageBySlugQuery = groq`
  *[_type == "industryPage" && slug.current == $slug][0]{
    title,
    hero,
    blocks[]{
      _key,
      title,
      description,
      "theme": coalesce(theme, "light"),
      set->{${setProjection}},
      "fallbackSet": fallbackSet->{${setProjection}}
    },
    industry->{${taxonomyProjection}}
  }
`;

const personaPageBySlugQuery = groq`
  *[_type == "personaPage" && slug.current == $slug][0]{
    title,
    hero,
    blocks[]{
      _key,
      title,
      description,
      "theme": coalesce(theme, "light"),
      set->{${setProjection}},
      "fallbackSet": fallbackSet->{${setProjection}}
    },
    persona->{${taxonomyProjection}}
  }
`;

const industryBySlugQuery = groq`
  *[_type == "industry" && slug.current == $slug][0]{
    _id,
    label,
    description,
    icon,
    slug
  }
`;

const personaBySlugQuery = groq`
  *[_type == "persona" && slug.current == $slug][0]{
    _id,
    label,
    description,
    icon,
    slug
  }
`;

const approvedContentFilter = groq`
  _type in $types &&
  status == "approved" &&
  (!defined($industryIds) || count((industries[]->_id)[@ in $industryIds]) > 0) &&
  (!defined($personaIds) || count((personas[]->_id)[@ in $personaIds]) > 0) &&
  (!defined($contentTypeIds) || contentType._ref in $contentTypeIds) &&
  !(_id in $excludeIds)
`;

const approvedContentQuery = groq`
  {
    "items": *[
      ${approvedContentFilter}
    ] | order(_createdAt desc) [$offset...$offset + $fetchWindow]{
      ${contentProjection}
    },
    "total": count(*[
      ${approvedContentFilter}
    ]),
    "latestUpdatedAt": *[
      ${approvedContentFilter}
    ] | order(_updatedAt desc)[0]._updatedAt
  }
`;

const latestApprovedContentTimestampQuery = groq`
  *[
    _type in $types &&
    status == "approved"
  ] | order(_updatedAt desc)[0]._updatedAt
`;

const DEFAULT_TYPES = ["article", "feature", "example"] as const;

const DEFAULT_PAGE_SIZE = 12;
const GLOBAL_PAGE_KEY = "*" as const;
const DYNAMIC_SET_CACHE_TTL_MS = 60_000;
const APPROVAL_SIGNATURE_TTL_MS = 5_000;

type DynamicSetCacheEntry = {
  timestamp: number;
  approvalSignature: string | null;
  result: DynamicSetResult;
};

type DynamicSetResult = {
  items: ContentItem[];
  pagination: PaginationInfo;
};

const dynamicSetCache = new Map<string, DynamicSetCacheEntry>();

const latestApprovalSignatureCache: {
  value: string | null;
  timestamp: number;
} = {
  value: null,
  timestamp: 0,
};

function toTaxonomySummary(doc: TaxonomyDoc | TaxonomySummary | null | undefined): TaxonomySummary | undefined {
  if (!doc) {
    return undefined;
  }

  const maybeSummary = doc as TaxonomySummary;
  const maybeDoc = doc as TaxonomyDoc;
  const slug = typeof maybeSummary.slug === "string" ? maybeSummary.slug : maybeDoc.slug?.current;
  const id = maybeSummary.id ?? maybeDoc._id;

  return {
    id: id ?? "",
    label: doc.label,
    description: doc.description,
    icon: doc.icon,
    slug: slug ?? "",
  };
}

function mapContentItem(doc: ContentDocument | null | undefined): ContentItem | null {
  if (!doc || !doc._id) {
    return null;
  }

  return {
    id: doc._id,
    type: doc._type,
    title: doc.title,
    status: doc.status,
    publishedAt: doc._createdAt,
    contentType: doc.contentType ? toTaxonomySummary(doc.contentType) ?? null : null,
    industries: (doc.industries ?? [])
      .map((item) => toTaxonomySummary(item))
      .filter((value): value is TaxonomySummary => Boolean(value)),
    personas: (doc.personas ?? [])
      .map((item) => toTaxonomySummary(item))
      .filter((value): value is TaxonomySummary => Boolean(value)),
    imageUrl: doc.imageUrl,
  };
}

function filterApproved(items: (ContentDocument | null | undefined)[] | undefined): ContentItem[] {
  if (!items) {
    return [];
  }

  return items
    .map(mapContentItem)
    .filter((item): item is ContentItem => Boolean(item && item.status === "approved"));
}

function createPortableTextBlock(text: string, index = 0): SanityBlock {
  return {
    _type: "block",
    _key: `generated-${index}`,
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `generated-${index}-0`,
        text,
        marks: [],
      },
    ],
  } as unknown as SanityBlock;
}

type ResolveSetArgs = {
  block: SetBlockDoc;
  sortOverride?: SortOrder;
  filtersOverride?: {
    industryIds?: string[];
    personaIds?: string[];
  };
  pageOverrides?: Record<string, number>;
};

type ResolveSetDocArgs = {
  set: CuratedSetDoc | DynamicSetDoc;
  sortOverride?: SortOrder;
  filtersOverride?: {
    industryIds?: string[];
    personaIds?: string[];
  };
  visited: Set<string>;
  pageOverrides?: Record<string, number>;
};


type SetResolution = {
  items: ContentItem[];
  setType: "curatedSet" | "dynamicSet";
  setId: string;
  setTitle?: string;
  setDescription?: string;
  pagination?: PaginationInfo;
};

async function resolveSetDoc({ set, sortOverride, filtersOverride, visited, pageOverrides }: ResolveSetDocArgs): Promise<SetResolution | null> {
  if (!set?._id || visited.has(set._id)) {
    return null;
  }

  visited.add(set._id);

  if (set._type === "curatedSet") {
    const items = filterApproved(set.items).filter((item) => matchesOverrides(item, filtersOverride));
    return {
      items,
      setType: "curatedSet",
      setId: set._id,
      setTitle: set.title ?? undefined,
      setDescription: set.description ?? undefined,
    };
  }

  const dynamicResult = await resolveDynamicSet({
    set,
    sortOverride,
    filtersOverride,
    pageOverrides,
  });

  return {
    items: dynamicResult.items,
    setType: "dynamicSet",
    setId: set._id,
    setTitle: set.title ?? undefined,
    setDescription: set.description ?? undefined,
    pagination: dynamicResult.pagination,
  };
}

async function resolveSetBlock({ block, sortOverride, filtersOverride, pageOverrides }: ResolveSetArgs): Promise<SetBlockView | null> {
  if (!block.set) {
    return null;
  }

  const visited = new Set<string>();
  const primaryResolution = await resolveSetDoc({
    set: block.set,
    sortOverride,
    filtersOverride,
    visited,
    pageOverrides,
  });

  let resolution = primaryResolution;
  let resolvedFromFallback = false;

  const needsFallback = !resolution || resolution.items.length === 0;

  if (needsFallback && block.fallbackSet?._id && !visited.has(block.fallbackSet._id)) {
    const fallbackResolution = await resolveSetDoc({
      set: block.fallbackSet,
      sortOverride,
      filtersOverride,
      visited,
      pageOverrides,
    });

    if (fallbackResolution && fallbackResolution.items.length > 0) {
      resolution = fallbackResolution;
      resolvedFromFallback = true;
    }
  }

  if (!resolution || resolution.items.length === 0) {
    return null;
  }

  const resolvedSetDoc = resolvedFromFallback ? block.fallbackSet : block.set;
  const title = block.title ?? resolvedSetDoc?.title ?? "Untitled";
  const description = block.description ?? resolvedSetDoc?.description ?? undefined;

  return {
    _type: "setBlock",
    _key: block._key ?? `${resolution.setId}`,
    title,
    description,
    setId: resolution.setId,
    setTitle: resolvedSetDoc?.title ?? undefined,
    setType: resolution.setType,
    items: resolution.items,
    pagination: resolution.pagination,
    resolvedFromFallback: resolvedFromFallback || undefined,
    theme: block.theme ?? "light",
  };
}


type ResolveDynamicSetArgs = {
  set: DynamicSetDoc;
  sortOverride?: SortOrder;
  filtersOverride?: {
    industryIds?: string[];
    personaIds?: string[];
  };
  pageOverrides?: Record<string, number>;
};

async function resolveDynamicSet({ set, sortOverride, filtersOverride, pageOverrides }: ResolveDynamicSetArgs): Promise<DynamicSetResult> {
  const pageSize = Math.max(set.limit ?? 0, 0) || DEFAULT_PAGE_SIZE;
  const requestedPage = getRequestedPage(pageOverrides, set._id);

  if (!hasSanityClient()) {
    return {
      items: [],
      pagination: {
        page: 1,
        pageSize,
        totalItems: 0,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      },
    };
  }

  const client = requireSanityClient();
  const sortOrder = sortOverride ?? set.sortOrder;
  const filters: ResolvedFilterSet = {
    industryIds: mergeUnique(set.filters?.industries, filtersOverride?.industryIds),
    personaIds: mergeUnique(set.filters?.personas, filtersOverride?.personaIds),
    contentTypeIds: set.filters?.contentTypes,
  };

  const pins = filterApproved(set.pins);
  const pinIds = pins.map((item) => item.id);
  const pinIdSet = new Set(pinIds);

  const approvalSignature = await getLatestApprovalSignature(client);

  const cacheKey = buildDynamicSetCacheKey({
    set,
    filters,
    sortOrder,
    page: requestedPage,
    pageSize,
    pinIds,
  });

  const cached = dynamicSetCache.get(cacheKey);
  if (
    cached &&
    Date.now() - cached.timestamp < DYNAMIC_SET_CACHE_TTL_MS &&
    cached.approvalSignature === approvalSignature
  ) {
    return cached.result;
  }

  const targetCount = Math.max(requestedPage * pageSize, pageSize);
  const dynamicSeed = sortOrder === "random" ? createDailySeed(`${set._id}:dynamic`) : undefined;

  const dynamicResult = await fetchApprovedContent({
    client,
    limit: Math.max(targetCount - pins.length, 0),
    sortOrder,
    industryIds: filters.industryIds,
    personaIds: filters.personaIds,
    contentTypeIds: filters.contentTypeIds,
    excludeIds: Array.from(pinIdSet),
    seed: dynamicSeed,
  });

  let combined = [...pins, ...dynamicResult.items].slice(0, targetCount);
  const combinedIds = new Set([...pinIdSet, ...dynamicResult.items.map((item) => item.id)]);

  let fallbackTotal = 0;

  if (combined.length < targetCount) {
    const slots = targetCount - combined.length;

    if (set.fallbackMode === "anyApproved" && slots > 0) {
      const fallbackSeed = sortOrder === "random" ? createDailySeed(`${set._id}:fallback`) : undefined;
      const fallbackResult = await fetchApprovedContent({
        client,
        limit: slots,
        sortOrder,
        excludeIds: Array.from(combinedIds),
        contentTypeIds: filters.contentTypeIds,
        seed: fallbackSeed,
      });

      const fallbackFiltered = fallbackResult.items.filter((item) => !combinedIds.has(item.id));
      fallbackFiltered.forEach((item) => combinedIds.add(item.id));
      combined = [...combined, ...fallbackFiltered].slice(0, targetCount);
      fallbackTotal = fallbackResult.total;
    } else if (set.fallbackMode === "pinsOnly") {
      combined = pins.slice(0, targetCount);
    }
  }

  let totalDynamic = dynamicResult.total;
  if (set.fallbackMode === "pinsOnly" && combined.length < targetCount) {
    totalDynamic = 0;
  }

  const totalPins = pins.length;
  const totalFallback = set.fallbackMode === "anyApproved" ? fallbackTotal : 0;
  const totalItemsAvailable = totalPins + totalDynamic + totalFallback;
  const totalPages = totalItemsAvailable > 0 ? Math.ceil(totalItemsAvailable / pageSize) : 1;
  const maxFetchedPages = Math.max(1, Math.ceil(combined.length / pageSize));
  const safePage = Math.min(Math.max(requestedPage, 1), Math.max(totalPages, 1), maxFetchedPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = combined.slice(start, end);

  const pagination: PaginationInfo = {
    page: safePage,
    pageSize,
    totalItems: totalItemsAvailable,
    totalPages,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
  };

  const result: DynamicSetResult = {
    items: pageItems,
    pagination,
  };

  dynamicSetCache.set(cacheKey, {
    timestamp: Date.now(),
    approvalSignature,
    result,
  });

  return result;
}

type FetchContentArgs = {
  client: ReturnType<typeof requireSanityClient>;
  limit: number;
  sortOrder: SortOrder;
  offset?: number;
  industryIds?: string[];
  personaIds?: string[];
  contentTypeIds?: string[];
  excludeIds?: string[];
  types?: string[];
  seed?: number;
};

type ApprovedContentResponse = {
  items: ContentDocument[];
  total: number;
  latestUpdatedAt?: string | null;
};

type ContentQueryResult = {
  items: ContentItem[];
  total: number;
  latestUpdatedAt: string | null;
};

async function fetchApprovedContent({
  client,
  limit,
  sortOrder,
  offset = 0,
  industryIds,
  personaIds,
  contentTypeIds,
  excludeIds,
  types = [...DEFAULT_TYPES],
  seed,
}: FetchContentArgs): Promise<ContentQueryResult> {
  if (limit <= 0) {
    return {
      items: [],
      total: 0,
      latestUpdatedAt: null,
    };
  }

  const clampedOffset = Math.max(offset, 0);
  const fetchWindow = Math.min(Math.max(limit, 20), 150);

  const params = {
    types,
    industryIds: industryIds && industryIds.length > 0 ? industryIds : null,
    personaIds: personaIds && personaIds.length > 0 ? personaIds : null,
    contentTypeIds: contentTypeIds && contentTypeIds.length > 0 ? contentTypeIds : null,
    excludeIds: excludeIds && excludeIds.length > 0 ? excludeIds : ["__none__"],
    offset: clampedOffset,
    fetchWindow,
  };

  const response = await client.fetch<ApprovedContentResponse>(approvedContentQuery, params);

  const mapped = (response.items ?? [])
    .map(mapContentItem)
    .filter((item): item is ContentItem => Boolean(item && item.status === "approved"));

  const sorted = sortItems(mapped, sortOrder, { seed });
  const items = sorted.slice(0, limit);

  return {
    items,
    total: response.total ?? 0,
    latestUpdatedAt: response.latestUpdatedAt ?? null,
  };
}

function sortItems(items: ContentItem[], sortOrder: SortOrder, options?: { seed?: number }): ContentItem[] {
  if (items.length <= 1) {
    return [...items];
  }

  if (sortOrder === "alphabeticalAsc") {
    return reorderAlphabetically(items);
  }

  if (sortOrder === "oldestFirst") {
    return reorderByCreatedAt(items, "asc");
  }

  if (sortOrder === "newestFirst") {
    return reorderByCreatedAt(items, "desc");
  }

  if (sortOrder === "random") {
    return shuffleItems(items, options?.seed);
  }

  return [...items];
}

function reorderAlphabetically(items: ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => a.title.localeCompare(b.title));
}

function reorderByCreatedAt(items: ContentItem[], direction: "asc" | "desc"): ContentItem[] {
  return [...items].sort((a, b) => {
    const aDate = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bDate = b.publishedAt ? Date.parse(b.publishedAt) : 0;

    if (direction === "asc") {
      return aDate - bDate;
    }

    return bDate - aDate;
  });
}

function shuffleItems(items: ContentItem[], seed?: number): ContentItem[] {
  const shuffled = [...items];
  const random = seed != null ? createSeededRandom(seed) : Math.random;

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function mergeUnique(primary?: string[] | null, secondary?: string[] | null): string[] | undefined {
  const values = [...new Set([...(primary ?? []), ...(secondary ?? [])])];
  return values.length > 0 ? values : undefined;
}

function matchesOverrides(
  item: ContentItem,
  overrides?: {
    industryIds?: string[];
    personaIds?: string[];
  },
): boolean {
  if (!overrides) {
    return true;
  }

  if (overrides.industryIds && overrides.industryIds.length > 0) {
    const matchesIndustry = item.industries.some((taxonomy) => overrides.industryIds?.includes(taxonomy.id));
    if (!matchesIndustry) {
      return false;
    }
  }

  if (overrides.personaIds && overrides.personaIds.length > 0) {
    const matchesPersona = item.personas.some((taxonomy) => overrides.personaIds?.includes(taxonomy.id));
    if (!matchesPersona) {
      return false;
    }
  }

  return true;
}

function getRequestedPage(pageOverrides: Record<string, number> | undefined, setId: string): number {
  if (!pageOverrides) {
    return 1;
  }

  const specific = pageOverrides[setId];
  const global = pageOverrides[GLOBAL_PAGE_KEY];
  return normalizePageNumber(specific ?? global);
}

function normalizePageNumber(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function buildDynamicSetCacheKey({
  set,
  filters,
  sortOrder,
  page,
  pageSize,
  pinIds,
}: {
  set: DynamicSetDoc;
  filters: ResolvedFilterSet;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
  pinIds: string[];
}): string {
  const sortedFilters = {
    industryIds: filters.industryIds ? [...filters.industryIds].sort() : undefined,
    personaIds: filters.personaIds ? [...filters.personaIds].sort() : undefined,
    contentTypeIds: filters.contentTypeIds ? [...filters.contentTypeIds].sort() : undefined,
  } satisfies ResolvedFilterSet;

  const sortedPins = [...pinIds].sort();

  return JSON.stringify({
    id: set._id,
    revision: set.revision ?? set.updatedAt ?? "",
    sortOrder,
    fallbackMode: set.fallbackMode,
    page,
    pageSize,
    filters: sortedFilters,
    pins: sortedPins,
  });
}

async function getLatestApprovalSignature(
  client: ReturnType<typeof requireSanityClient>,
): Promise<string | null> {
  const now = Date.now();

  if (now - latestApprovalSignatureCache.timestamp < APPROVAL_SIGNATURE_TTL_MS) {
    return latestApprovalSignatureCache.value;
  }

  const signature = await client.fetch<string | null>(latestApprovedContentTimestampQuery, {
    types: [...DEFAULT_TYPES],
  });

  latestApprovalSignatureCache.value = signature ?? null;
  latestApprovalSignatureCache.timestamp = Date.now();

  return latestApprovalSignatureCache.value;
}

function createDailySeed(scope: string, date = new Date()): number {
  const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  return hashStringToSeed(`${scope}:${key}`);
}

function createSeededRandom(seed: number): () => number {
  return mulberry32(seed);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(input: string): number {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  const normalized = hash >>> 0;
  return normalized === 0 ? 1 : normalized;
}

function buildHeroFromDoc(hero: HeroContent | null | undefined, fallbackTitle: string): HeroContent {
  if (hero && hero.headline) {
    return hero;
  }

  return {
    headline: fallbackTitle,
  };
}

function taxonomyDocToSummary(doc: TaxonomyDoc | null): TaxonomySummary | undefined {
  if (!doc) {
    return undefined;
  }

  return {
    id: doc._id,
    label: doc.label,
    description: doc.description,
    icon: doc.icon,
    slug: doc.slug?.current ?? "",
  };
}

function heroFromTaxonomies({
  industry,
  persona,
}: {
  industry?: TaxonomySummary;
  persona?: TaxonomySummary;
}): HeroContent {
  const pieces: string[] = [];

  if (industry) {
    pieces.push(industry.label);
  }

  if (persona) {
    pieces.push(`for ${persona.label}`);
  }

  const headline = pieces.length > 0 ? pieces.join(" ") : "Explore content";

  const bodyText = industry?.description ?? persona?.description;

  return {
    headline,
    tagline: industry && persona ? `${industry.label} • ${persona.label}` : industry?.label ?? persona?.label,
    body: bodyText ? [createPortableTextBlock(bodyText)] : undefined,
  };
}

type GeneratedBlockDefinition = {
  key: string;
  title: string;
  description?: string;
  types: string[];
  limit: number;
};

const GENERATED_BLOCKS: GeneratedBlockDefinition[] = [
  {
    key: "examples",
    title: "Examples",
    description: "Real implementations tagged for this view.",
    types: ["example"],
    limit: 6,
  },
  {
    key: "features",
    title: "Features",
    description: "Product features relevant to this context.",
    types: ["feature"],
    limit: 6,
  },
  {
    key: "articles",
    title: "Articles",
    description: "Articles and insights tailored to the filters.",
    types: ["article"],
    limit: 6,
  },
];

async function buildGeneratedBlocks({
  industry,
  persona,
}: {
  industry?: TaxonomySummary;
  persona?: TaxonomySummary;
}): Promise<SetBlockView[]> {
  if (!hasSanityClient()) {
    return [];
  }

  const client = requireSanityClient();

  const industryIds = industry ? [industry.id] : undefined;
  const personaIds = persona ? [persona.id] : undefined;

  const blocks = await Promise.all(
    GENERATED_BLOCKS.map(async (definition) => {
      const result = await fetchApprovedContent({
        client,
        limit: definition.limit,
        sortOrder: "newestFirst",
        industryIds,
        personaIds,
        types: definition.types,
      });

      if (result.items.length === 0) {
        return null;
      }

      return {
        _type: "setBlock" as const,
        _key: `generated-${definition.key}`,
        title: definition.title,
        description: definition.description,
        setType: "generated" as const,
        items: result.items,
      } satisfies SetBlockView;
    }),
  );

  return blocks.filter(Boolean) as SetBlockView[];
}

export async function fetchIndustryPageView({
  slug,
  personaSlug,
  page,
}: {
  slug: string;
  personaSlug?: string;
  page?: number;
}): Promise<PageViewData | null> {
  if (!hasSanityClient()) {
    return null;
  }

  const client = requireSanityClient();

  const [pageDoc, personaDoc] = await Promise.all([
    client.fetch<IndustryPageDoc | null>(industryPageBySlugQuery, { slug }),
    personaSlug ? client.fetch<TaxonomyDoc | null>(personaBySlugQuery, { slug: personaSlug }) : Promise.resolve(null),
  ]);

  const persona = taxonomyDocToSummary(personaDoc ?? null);

  const pageOverrides = typeof page === "number" ? { [GLOBAL_PAGE_KEY]: normalizePageNumber(page) } : undefined;

  if (pageDoc) {
    const industry = toTaxonomySummary(pageDoc.industry ?? null);
    const hero = buildHeroFromDoc(pageDoc.hero ?? null, pageDoc.title ?? industry?.label ?? slug);

    const blocks = pageDoc.blocks ? await Promise.all(
      pageDoc.blocks.map((block) =>
        resolveSetBlock({
          block,
          filtersOverride: persona ? { personaIds: [persona.id] } : undefined,
          pageOverrides,
        }),
      ),
    ) : [];

    return {
      hero,
      blocks: blocks.filter(Boolean) as SetBlockView[],
      context: {
        source: "document",
        industry,
        persona,
        pageTitle: pageDoc.title ?? hero.headline,
      },
    };
  }

  const industryDoc = await client.fetch<TaxonomyDoc | null>(industryBySlugQuery, { slug });

  if (!industryDoc) {
    return null;
  }

  const industry = taxonomyDocToSummary(industryDoc);
  const hero = heroFromTaxonomies({ industry, persona });
  const blocks = await buildGeneratedBlocks({ industry, persona });

  return {
    hero,
    blocks,
    context: {
      source: "generated",
      industry,
      persona,
      pageTitle: industry?.label ?? slug,
    },
  };
}

export async function fetchPersonaPageView({
  slug,
  industrySlug,
  page,
}: {
  slug: string;
  industrySlug?: string;
  page?: number;
}): Promise<PageViewData | null> {
  if (!hasSanityClient()) {
    return null;
  }

  const client = requireSanityClient();

  const [pageDoc, industryDoc] = await Promise.all([
    client.fetch<PersonaPageDoc | null>(personaPageBySlugQuery, { slug }),
    industrySlug ? client.fetch<TaxonomyDoc | null>(industryBySlugQuery, { slug: industrySlug }) : Promise.resolve(null),
  ]);

  const industry = taxonomyDocToSummary(industryDoc ?? null);

  const pageOverrides = typeof page === "number" ? { [GLOBAL_PAGE_KEY]: normalizePageNumber(page) } : undefined;

  if (pageDoc) {
    const persona = toTaxonomySummary(pageDoc.persona ?? null);
    const hero = buildHeroFromDoc(pageDoc.hero ?? null, pageDoc.title ?? persona?.label ?? slug);

    const blocks = pageDoc.blocks ? await Promise.all(
      pageDoc.blocks.map((block) =>
        resolveSetBlock({
          block,
          filtersOverride: industry ? { industryIds: [industry.id] } : undefined,
          pageOverrides,
        }),
      ),
    ) : [];

    return {
      hero,
      blocks: blocks.filter(Boolean) as SetBlockView[],
      context: {
        source: "document",
        industry,
        persona,
        pageTitle: pageDoc.title ?? hero.headline,
      },
    };
  }

  const personaDoc = await client.fetch<TaxonomyDoc | null>(personaBySlugQuery, { slug });

  if (!personaDoc) {
    return null;
  }

  const persona = taxonomyDocToSummary(personaDoc);
  const hero = heroFromTaxonomies({ industry, persona });
  const blocks = await buildGeneratedBlocks({ industry, persona });

  return {
    hero,
    blocks,
    context: {
      source: "generated",
      industry,
      persona,
      pageTitle: persona?.label ?? slug,
    },
  };
}
