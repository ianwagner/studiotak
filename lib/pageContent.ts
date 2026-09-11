import { collection, documentId, getDocs, getFirestore, limit, query, where } from "firebase/firestore";
import type {
  ArticleFeaturedBlock,
  ArticleGridBlock,
  BlockRecord,
  HeroBlock,
  PageRecord,
  StoryBlock,
  FeatureItem,
  FeaturesBlock,
  FeatureSpotlightBlock,
  ScrollGalleryBlock
} from "./admin/pages";
import { seedPages } from "./admin/pages";
import { getFirebaseApp } from "./firebaseClient";
import { seedComponents, type ComponentRecord } from "./admin/components";
import { getGhostPosts, type GhostPost } from "./ghost";

const collectionName = "pages";

const buildHeroFromLegacy = (page: any): HeroBlock => ({
  id: page.id ? `${page.id}-hero` : crypto.randomUUID(),
  type: "hero",
  adminLabel: "Hero block",
  eyebrow: page.title,
  title: page.heroTitle || page.title || "Hero",
  subtitle: page.heroSubtitle || "",
  primaryCtaLabel: page.ctaLabel,
  primaryCtaHref: page.ctaHref,
  secondaryCtaLabel: page.secondaryCtaLabel,
  secondaryCtaHref: page.secondaryCtaHref,
  alignment: "centered",
  overlayStyle: "gradient",
  mode: "static"
});

const buildStoryFromLegacy = (page: any): StoryBlock => ({
  id: page.id ? `${page.id}-story` : crypto.randomUUID(),
  type: "story",
  adminLabel: "Story block",
  heading: page.title || "Story",
  body: page.heroSubtitle || "",
  variant: "single_column",
  sections: Array.isArray(page.sections) ? page.sections : []
});

const normalizeBlocks = (page: any): BlockRecord[] => {
  if (Array.isArray(page.blocks) && page.blocks.length > 0) {
    return page.blocks as BlockRecord[];
  }
  return [buildHeroFromLegacy(page), buildStoryFromLegacy(page)];
};

export const normalizePageShape = (page: any): PageRecord => {
  if (!page) return page;
  const updatedAt =
    page.updatedAt && typeof page.updatedAt.toDate === "function"
      ? page.updatedAt.toDate().toISOString()
      : page.updatedAt;
  const {
    id,
    slug,
    title,
    status,
    seoTitle,
    metaDescription,
    canonicalUrl,
    noindex,
    nofollow,
    ogTitle,
    ogDescription,
    socialImage,
    twitterTitle,
    twitterDescription,
    jsonLd,
    sitemapExclude,
    focusKeyword,
    internalLinks,
    redirects
  } = page;
  return {
    id,
    slug,
    title,
    status: status ?? "draft",
    blocks: normalizeBlocks(page),
    seoTitle,
    metaDescription,
    canonicalUrl,
    noindex,
    nofollow,
    ogTitle,
    ogDescription,
    socialImage,
    twitterTitle,
    twitterDescription,
    jsonLd,
    sitemapExclude,
    focusKeyword,
    internalLinks,
    redirects,
    updatedAt
  };
};

const fromSnapshot = (doc: any): PageRecord => normalizePageShape({ id: doc.id, ...(doc.data() as Omit<PageRecord, "id">) });

const chunkArray = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const mergeFeatureItemWithComponent = (item: FeatureItem, map: Record<string, ComponentRecord>): FeatureItem => {
  if (!item.componentId) return item;
  const component = map[item.componentId];
  if (!component) return item;
  return {
    ...item,
    title: component.title ?? item.title,
    body: component.body ?? item.body,
    icon: component.icon ?? item.icon,
    industry: component.industry ?? item.industry,
    type: component.type ?? item.type,
    mediaFit: component.mediaFit ?? item.mediaFit
  };
};

const mergeBlocksWithComponents = (blocks: BlockRecord[], map: Record<string, ComponentRecord>): BlockRecord[] =>
  blocks.map((block) => {
    if (block.type === "features") {
      const items = (block.items ?? []).map((item) => mergeFeatureItemWithComponent(item, map));
      return { ...(block as FeaturesBlock), items };
    }
    if (block.type === "scroll_gallery") {
      const items = (block.items ?? []).map((item) => mergeFeatureItemWithComponent(item, map));
      return { ...(block as ScrollGalleryBlock), items };
    }
    if (block.type === "feature_spotlight") {
      const items = (block.items ?? []).map((item) => mergeFeatureItemWithComponent(item, map));
      return { ...(block as FeatureSpotlightBlock), items };
    }
    return block;
  });

const collectComponentIds = (blocks: BlockRecord[]): string[] => {
  const ids = new Set<string>();
  blocks.forEach((block) => {
    if (block.type === "features" || block.type === "scroll_gallery" || block.type === "feature_spotlight") {
      (block.items ?? []).forEach((item) => {
        if (item.componentId) ids.add(item.componentId);
      });
    }
  });
  return Array.from(ids);
};

const getComponentsByIds = async (componentIds: string[]): Promise<ComponentRecord[]> => {
  if (!componentIds.length) return [];
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return seedComponents.filter((component) => componentIds.includes(component.id));
  }

  try {
    const db = getFirestore(getFirebaseApp());
    const ref = collection(db, "components");
    const chunks = chunkArray(componentIds, 10);
    const results: ComponentRecord[] = [];
    for (const chunk of chunks) {
      const q = query(ref, where(documentId(), "in", chunk));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach((doc) => results.push({ id: doc.id, ...(doc.data() as Omit<ComponentRecord, "id">) }));
    }
    return results;
  } catch (error) {
    console.error("Failed to load components for page render", error);
    return seedComponents.filter((component) => componentIds.includes(component.id));
  }
};

const mergePageWithComponents = async (page: PageRecord | null): Promise<PageRecord | null> => {
  if (!page) return page;
  const componentIds = collectComponentIds(page.blocks ?? []);
  if (!componentIds.length) return page;
  const components = await getComponentsByIds(componentIds);
  const componentMap = Object.fromEntries(components.map((component) => [component.id, component]));
  return { ...page, blocks: mergeBlocksWithComponents(page.blocks, componentMap) };
};

const normalizeTagFilter = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const excludedArticleGridTagNames = new Set(["#resource", "#campfire-compare"]);
const excludedArticleGridTagSlugs = new Set(["hash-resource", "hash-campfire-compare"]);

const isExcludedFromArticleGrids = (post: GhostPost): boolean =>
  post.tags?.some(
    (tag) =>
      excludedArticleGridTagNames.has(tag.name.trim().toLowerCase()) ||
      excludedArticleGridTagSlugs.has(tag.slug.trim().toLowerCase())
  ) ?? false;

const mergePageWithArticles = async (page: PageRecord | null, tagOverride?: string | null): Promise<PageRecord | null> => {
  if (!page) return page;
  const blocks = page.blocks ?? [];
  const needsArticles = blocks.some((block) => block.type === "article_featured" || block.type === "article_grid");
  if (!needsArticles) return page;

  const tagCache = new Map<string | null, Awaited<ReturnType<typeof getGhostPosts>>>();
  const normalizedOverride = normalizeTagFilter(tagOverride);
  const getPostsForTag = async (tagFilter?: string | null) => {
    const key = normalizeTagFilter(tagFilter);
    if (tagCache.has(key)) {
      return tagCache.get(key) ?? [];
    }
    const posts = await getGhostPosts(key);
    tagCache.set(key, posts);
    return posts;
  };

  const hydratedBlocks = await Promise.all(
    blocks.map(async (block) => {
      if (block.type === "article_featured") {
        const effectiveTag = normalizedOverride ?? block.tagFilter;
        const posts = await getPostsForTag(effectiveTag);
        const featured = posts.slice(0, 1);
        return { ...(block as ArticleFeaturedBlock), posts: featured };
      }
      if (block.type === "article_grid") {
        const effectiveTag = normalizedOverride ?? block.tagFilter;
        const posts = await getPostsForTag(effectiveTag);
        const gridPosts = posts.filter((post) => !isExcludedFromArticleGrids(post));
        const offset = Math.max(0, block.offset ?? 0);
        const limit = block.limit && block.limit > 0 ? block.limit : gridPosts.length - offset;
        const list = gridPosts.slice(offset, offset + Math.max(0, limit));
        return { ...(block as ArticleGridBlock), posts: list };
      }
      return block;
    })
  );

  return { ...page, blocks: hydratedBlocks };
};

const mergePageWithComponentsAndArticles = async (
  page: PageRecord | null,
  tagOverride?: string | null
): Promise<PageRecord | null> => {
  const withComponents = await mergePageWithComponents(page);
  return mergePageWithArticles(withComponents, tagOverride);
};

export const normalizeSlugPath = (slug: string): string => {
  const trimmed = slug.trim();
  if (!trimmed || trimmed === "/") return "/";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
};

export type PageDataSource = "firestore" | "seed" | "not_found";

export interface PageWithSource {
  page: PageRecord | null;
  source: PageDataSource;
}

export async function getPublishedPageBySlugWithSource(
  slug: string,
  options?: { tagFilter?: string | null }
): Promise<PageWithSource> {
  const normalizedSlug = normalizeSlugPath(slug);
  const fallback =
    seedPages.find((page) => normalizeSlugPath(page.slug) === normalizedSlug && page.status === "published") ?? null;

  // If Firebase isn't configured we still want the marketing site to render with seed content.
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    const page = await mergePageWithComponentsAndArticles(fallback, options?.tagFilter);
    return { page, source: page ? "seed" : "not_found" };
  }

  try {
    const db = getFirestore(getFirebaseApp());
    const pagesRef = collection(db, collectionName);
    const q = query(pagesRef, where("slug", "==", normalizedSlug), where("status", "==", "published"), limit(1));
    let snapshot = await getDocs(q);

    // Handle slugs stored without a leading slash.
    if (snapshot.empty && normalizedSlug.startsWith("/")) {
      const withoutLeading = normalizedSlug.slice(1);
      const altQuery = query(
        pagesRef,
        where("slug", "==", withoutLeading),
        where("status", "==", "published"),
        limit(1)
      );
      snapshot = await getDocs(altQuery);
    }

    if (snapshot.empty) {
      const page = await mergePageWithComponentsAndArticles(fallback, options?.tagFilter);
      return { page, source: page ? "seed" : "not_found" };
    }
    const firestorePage = fromSnapshot(snapshot.docs[0]);
    const page = await mergePageWithComponentsAndArticles(firestorePage, options?.tagFilter);
    return { page, source: "firestore" };
  } catch (error) {
    console.error("Failed to load published page from Firestore", error);
    const page = await mergePageWithComponentsAndArticles(fallback, options?.tagFilter);
    return { page, source: page ? "seed" : "not_found" };
  }
}

export async function getPublishedPageBySlug(
  slug: string,
  options?: { tagFilter?: string | null }
): Promise<PageRecord | null> {
  const { page } = await getPublishedPageBySlugWithSource(slug, options);
  return page;
}

export async function getPublishedPages(): Promise<PageRecord[]> {
  const fallback = seedPages.filter((page) => page.status === "published");

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return fallback;
  }

  try {
    const db = getFirestore(getFirebaseApp());
    const pagesRef = collection(db, collectionName);
    const q = query(pagesRef, where("status", "==", "published"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return fallback;
    return snapshot.docs.map((doc) => fromSnapshot(doc));
  } catch (error) {
    console.error("Failed to load published pages from Firestore", error);
    return fallback;
  }
}
