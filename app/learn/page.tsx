import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LearnLibrary } from "@/components/LearnLibrary";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlug } from "@/lib/pageContent";
import { getGhostPosts } from "@/lib/ghost";
import { getCanonicalUrl, getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 120;
export const dynamic = "force-static";

const FALLBACK_TITLE = "Learn — Guides & Reference";
const FALLBACK_DESCRIPTION =
  "Search guides and Reference articles, organized by topic from Ghost tags.";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPageBySlug("/learn");
  const canonical = getCanonicalUrl("/learn", page?.canonicalUrl);
  if (!page) {
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      alternates: { canonical },
      openGraph: {
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        url: canonical,
        siteName: "Studio Tak",
        type: "website"
      },
      twitter: {
        card: "summary",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION
      }
    };
  }
  return {
    title: page.seoTitle || page.title,
    description: page.metaDescription || FALLBACK_DESCRIPTION,
    alternates: { canonical },
    robots: {
      index: !page.noindex,
      follow: !page.nofollow
    },
    openGraph: {
      title: page.ogTitle || page.seoTitle || page.title,
      description: page.ogDescription || page.metaDescription || FALLBACK_DESCRIPTION,
      url: canonical,
      siteName: "Studio Tak",
      type: "website",
      images: page.socialImage?.url ? [{ url: page.socialImage.url, alt: page.socialImage.alt }] : undefined
    },
    twitter: {
      card: page.socialImage?.url ? "summary_large_image" : "summary",
      title: page.twitterTitle || page.ogTitle || page.seoTitle || page.title,
      description: page.twitterDescription || page.ogDescription || page.metaDescription || FALLBACK_DESCRIPTION,
      images: page.socialImage?.url ? [page.socialImage.url] : undefined
    }
  };
}

export default async function LearnPage() {
  const [navItems, pageData, posts] = await Promise.all([
    getNavigationItems(),
    getPublishedPageBySlug("/learn"),
    getGhostPosts()
  ]);
  if (!pageData) return notFound();

  const siteBase = getSiteUrl();
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: pageData.seoTitle || pageData.title || FALLBACK_TITLE,
    description: pageData.metaDescription || FALLBACK_DESCRIPTION,
    url: new URL("/learn", siteBase).toString(),
    publisher: {
      "@type": "Organization",
      name: "Studio Tak",
      url: siteBase
    },
    ...(posts.length > 0
      ? {
          blogPost: posts.slice(0, 10).map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            url: new URL(`/learn/${post.slug}`, siteBase).toString(),
            ...(post.published_at ? { datePublished: post.published_at } : {}),
            ...(post.updated_at ? { dateModified: post.updated_at } : {}),
            ...(post.feature_image ? { image: post.feature_image } : {}),
            ...(post.excerpt ? { description: post.excerpt } : {})
          }))
        }
      : {})
  };

  return (
    <main>
      <SiteHeader navItems={navItems} />
      <LearnLibrary posts={posts} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <SiteFooter navItems={navItems} />
    </main>
  );
}
