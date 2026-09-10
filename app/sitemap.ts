import type { MetadataRoute } from "next";
import { getGhostPosts } from "@/lib/ghost";
import { getAvailableLearnSeries } from "@/lib/learnSeries";
import { getPublishedPages, normalizeSlugPath } from "@/lib/pageContent";
import { getSiteUrl } from "@/lib/siteUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteBase = getSiteUrl();
  const [pages, posts] = await Promise.all([getPublishedPages(), getGhostPosts()]);
  const learnUrl = new URL("/learn", siteBase).toString();

  const hasLearnPage = pages.some((page) => normalizeSlugPath(page.slug) === "/learn");
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
  const seriesEntries = getAvailableLearnSeries(posts).map((series) => ({
    url: new URL(`/learn/series/${series.slug}`, siteBase).toString(),
    lastModified: new Date().toISOString()
  }));

  const learnEntry = hasLearnPage ? [] : [{ url: learnUrl, lastModified: new Date().toISOString() }];
  const founderEntry = { url: new URL("/founder", siteBase).toString(), lastModified: new Date().toISOString() };
  const legalEntries = [
    { url: new URL("/terms-of-service", siteBase).toString(), lastModified: new Date().toISOString() },
    { url: new URL("/privacy-policy", siteBase).toString(), lastModified: new Date().toISOString() }
  ];
  return [founderEntry, ...legalEntries, ...learnEntry, ...pageEntries, ...seriesEntries, ...postEntries];
}
