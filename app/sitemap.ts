import type { MetadataRoute } from "next";
import { getGhostPosts } from "@/lib/ghost";
import { getPublishedPages, normalizeSlugPath } from "@/lib/pageContent";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";
  const [pages, posts] = await Promise.all([getPublishedPages(), getGhostPosts()]);
  const learnUrl = new URL("/learn", siteBase).toString();

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
    lastModified: post.updated_at ?? post.published_at ?? new Date().toISOString()
  }));

  return [{ url: learnUrl, lastModified: new Date().toISOString() }, ...pageEntries, ...postEntries];
}
