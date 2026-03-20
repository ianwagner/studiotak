import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlocksRenderer } from "@/components/sections/BlocksRenderer";
import type { ArticleFeaturedBlock, ArticleGridBlock, BlockRecord } from "@/lib/admin/pages";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlug } from "@/lib/pageContent";
import { getGhostPosts } from "@/lib/ghost";

export const revalidate = 120;
export const dynamic = "force-static";

type LearnPageProps = {
  searchParams?: { tag?: string | string[] };
};

const getTagParam = (value?: string | string[]): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
};

const isArticleBlock = (block: BlockRecord): block is ArticleFeaturedBlock | ArticleGridBlock =>
  block.type === "article_featured" || block.type === "article_grid";

const collectArticlePosts = (blocks: BlockRecord[]) =>
  blocks.filter(isArticleBlock).flatMap((block) => block.posts ?? []);

const FALLBACK_TITLE = "Learn — Insights & Resources | Studio Tak";
const FALLBACK_DESCRIPTION =
  "Explore design strategy insights, case studies, and practical resources from Studio Tak — helping brands build stronger digital experiences.";

export async function generateMetadata(): Promise<Metadata> {
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";
  const page = await getPublishedPageBySlug("/learn");
  const canonical = page?.canonicalUrl?.trim() || new URL("/learn", siteBase).toString();
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

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const navItems = await getNavigationItems();
  const tagFilter = getTagParam(searchParams?.tag);
  const pageData = await getPublishedPageBySlug("/learn", { tagFilter });
  if (!pageData) return notFound();
  const blocks = pageData.blocks ?? [];

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";
  const posts = await getGhostPosts(tagFilter);
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
      {blocks.length ? <BlocksRenderer blocks={blocks} /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <SiteFooter navItems={navItems} />
    </main>
  );
}
