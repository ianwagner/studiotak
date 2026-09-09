import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const siteBase = getSiteUrl();
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
