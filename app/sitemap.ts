import type { MetadataRoute } from "next";
import { getPublishedPages, normalizeSlugPath } from "@/lib/pageContent";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-tak.example";
  const pages = await getPublishedPages();

  return pages
    .filter((page) => !page.noindex && !page.sitemapExclude)
    .map((page) => {
      const slug = normalizeSlugPath(page.slug);
      const url = new URL(slug === "/" ? "/" : slug, siteBase).toString();
      return {
        url,
        lastModified: page.updatedAt ?? new Date().toISOString()
      };
    });
}
