export type GhostTag = {
  id: string;
  name: string;
  slug: string;
  visibility?: "public" | "internal";
};

export type GhostPost = {
  id: string;
  slug: string;
  title: string;
  featured?: boolean;
  html?: string | null;
  excerpt?: string | null;
  feature_image?: string | null;
  feature_image_alt?: string | null;
  published_at?: string | null;
  tags?: GhostTag[];
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  canonical_url?: string | null;
};

type GhostResponse<T> = {
  posts?: T[];
};

const REVALIDATE_SECONDS = 120;

const getGhostConfig = () => {
  const apiKey = process.env.GHOST_CONTENT_API_KEY;
  const baseUrl = process.env.GHOST_CONTENT_URL;
  if (!apiKey || !baseUrl) return null;
  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, "")
  };
};

const buildGhostUrl = (path: string, params: Record<string, string | undefined>) => {
  const config = getGhostConfig();
  if (!config) return null;
  const apiBase = `${config.baseUrl}/ghost/api/content/`;
  const url = new URL(path, apiBase);
  url.searchParams.set("key", config.apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const fetchGhost = async <T,>(path: string, params: Record<string, string | undefined>): Promise<T | null> => {
  const url = buildGhostUrl(path, params);
  if (!url) return null;
  try {
    const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) {
      console.error(`Ghost Content API error (${response.status}) for ${path}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Ghost Content API request failed", error);
    return null;
  }
};

export async function getGhostPosts(): Promise<GhostPost[]> {
  const data = await fetchGhost<GhostResponse<GhostPost>>("posts/", {
    include: "tags",
    limit: "all"
  });
  return data?.posts ?? [];
}

export async function getGhostPostBySlug(slug: string): Promise<GhostPost | null> {
  const data = await fetchGhost<GhostResponse<GhostPost>>(`posts/slug/${encodeURIComponent(slug)}/`, {
    include: "tags",
    limit: "1"
  });
  return data?.posts?.[0] ?? null;
}

export const collectGhostTags = (posts: GhostPost[]): GhostTag[] => {
  const tagMap = new Map<string, GhostTag>();
  posts.forEach((post) => {
    post.tags?.forEach((tag) => {
      if (tag.visibility && tag.visibility !== "public") return;
      if (!tagMap.has(tag.slug)) {
        tagMap.set(tag.slug, tag);
      }
    });
  });
  return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const filterGhostPostsByTag = (posts: GhostPost[], tag?: string | null): GhostPost[] => {
  const normalized = tag?.trim();
  if (!normalized) return posts;
  const lower = normalized.toLowerCase();
  return posts.filter((post) =>
    (post.tags ?? []).some(
      (item) => item.slug.toLowerCase() === lower || item.name.toLowerCase() === lower
    )
  );
};
