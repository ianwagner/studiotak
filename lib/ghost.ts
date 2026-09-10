type GhostTag = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility?: string | null;
};

export type GhostPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  html?: string | null;
  feature_image?: string | null;
  feature_image_alt?: string | null;
  feature_image_caption?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  canonical_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  reading_time?: number | null;
  tags?: GhostTag[];
};

type GhostListResponse = {
  posts: GhostPost[];
};

type GhostSingleResponse = {
  posts: GhostPost[];
};

const ghostUrl = process.env.GHOST_CONTENT_URL;
const ghostKey = process.env.GHOST_CONTENT_API_KEY;

const getGhostApiBase = (): URL | null => {
  if (!ghostUrl || !ghostKey) return null;
  return new URL("/ghost/api/content/", ghostUrl);
};

const buildGhostUrl = (path: string, params: URLSearchParams): string | null => {
  const base = getGhostApiBase();
  if (!base || !ghostKey) return null;
  const cleanedPath = path.replace(/^\/+/, "");
  const url = new URL(cleanedPath, base);
  params.set("key", ghostKey);
  url.search = params.toString();
  return url.toString();
};

const fetchGhost = async <T>(path: string, params: URLSearchParams, revalidate = 120): Promise<T | null> => {
  const url = buildGhostUrl(path, params);
  if (!url) return null;
  try {
    const response = await fetch(url, { next: { revalidate } });
    if (!response.ok) {
      console.error("Ghost Content API request failed", response.status, response.statusText);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Ghost Content API request failed", error);
    return null;
  }
};

const normalizeGhostTag = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^#/, "").replace(/[:\s]+/g, "-").toLowerCase();
};

export async function getGhostPosts(tag?: string | null): Promise<GhostPost[]> {
  const params = new URLSearchParams({
    include: "tags",
    limit: "all",
    order: "published_at desc",
    fields: [
      "id",
      "title",
      "slug",
      "excerpt",
      "feature_image",
      "feature_image_alt",
      "feature_image_caption",
      "published_at",
      "updated_at",
      "canonical_url"
    ].join(",")
  });
  const normalizedTag = normalizeGhostTag(tag);
  if (normalizedTag) {
    params.set("filter", `tag:${normalizedTag}`);
  }
  const data = await fetchGhost<GhostListResponse>("posts/", params);
  return data?.posts ?? [];
}

export async function getGhostPostBySlug(slug: string): Promise<GhostPost | null> {
  const params = new URLSearchParams({
    include: "tags",
    limit: "1",
    filter: `slug:${slug}`,
    fields: [
      "id",
      "title",
      "slug",
      "excerpt",
      "html",
      "feature_image",
      "feature_image_alt",
      "feature_image_caption",
      "published_at",
      "updated_at",
      "canonical_url",
      "meta_title",
      "meta_description",
      "og_title",
      "og_description",
      "twitter_title",
      "twitter_description",
      "reading_time"
    ].join(",")
  });
  const data = await fetchGhost<GhostSingleResponse>("posts/", params);
  return data?.posts?.[0] ?? null;
}
