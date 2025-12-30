import type { MetadataRoute } from "next";
import { getGhostPosts } from "@/lib/ghostContent";
import { getPublishedPages, normalizeSlugPath } from "@/lib/pageContent";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";
  const pages = await getPublishedPages();
  const posts = await getGhostPosts();

  const pageEntries = pages
    .filter((page) => !page.noindex && !page.sitemapExclude)
    .map((page) => {
      const slug = normalizeSlugPath(page.slug);
      const url = new URL(slug === "/" ? "/" : slug, siteBase).toString();
      return {
        url,
        lastModified: page.updatedAt ?? new Date().toISOString()
      };
    });

  const postEntries = posts.map((post) => ({
    url: new URL(`/learn/${post.slug}`, siteBase).toString(),
    lastModified: post.published_at ?? new Date().toISOString()
  }));

  return [...pageEntries, ...postEntries];
}
