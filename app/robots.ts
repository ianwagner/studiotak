import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-tak.example";
  const disallow = process.env.ROBOTS_DISALLOW
    ? process.env.ROBOTS_DISALLOW.split(",").map((path) => path.trim()).filter(Boolean)
    : undefined;
  const crawlDelay = process.env.ROBOTS_CRAWL_DELAY ? Number(process.env.ROBOTS_CRAWL_DELAY) : undefined;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
        crawlDelay
      }
    ],
    sitemap: [`${siteBase}/sitemap.xml`]
  };
}
