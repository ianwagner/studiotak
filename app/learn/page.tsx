import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlocksRenderer } from "@/components/sections/BlocksRenderer";
import type { ArticleFeaturedBlock, ArticleGridBlock, BlockRecord } from "@/lib/admin/pages";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlug } from "@/lib/pageContent";

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

export async function generateMetadata(): Promise<Metadata> {
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";
  const page = await getPublishedPageBySlug("/learn");
  const canonical = page?.canonicalUrl?.trim() || new URL("/learn", siteBase).toString();
  if (!page) {
    return {
      title: "Learn | Studio Tak",
      description: "Insights, case studies, and notes from Studio Tak.",
      alternates: { canonical }
    };
  }
  return {
    title: page.seoTitle || page.title,
    description: page.metaDescription,
    alternates: { canonical },
    robots: {
      index: !page.noindex,
      follow: !page.nofollow
    },
    openGraph: {
      title: page.ogTitle || page.seoTitle || page.title,
      description: page.ogDescription || page.metaDescription || undefined,
      url: canonical,
      images: page.socialImage?.url ? [{ url: page.socialImage.url, alt: page.socialImage.alt }] : undefined
    },
    twitter: {
      card: page.socialImage?.url ? "summary_large_image" : "summary",
      title: page.twitterTitle || page.ogTitle || page.seoTitle || page.title,
      description: page.twitterDescription || page.ogDescription || page.metaDescription || undefined,
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
  const posts = collectArticlePosts(blocks);
  const formattedTag = tagFilter?.trim();

  const tags = new Map<string, string>();
  posts.forEach((post) => {
    (post.tags ?? [])
      .filter((tag) => tag.visibility !== "internal")
      .forEach((tag) => {
        if (!tags.has(tag.slug)) {
          tags.set(tag.slug, tag.name);
        }
      });
  });

  const tagList = Array.from(tags.entries()).map(([slug, name]) => ({ slug, name }));

  return (
    <main>
      <SiteHeader navItems={navItems} />
      {formattedTag || tagList.length ? (
        <section className="container learn-filter-bar learn-shell">
          {formattedTag ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span className="learn-tag">Filtered: {formattedTag}</span>
              <Link href="/learn" className="learn-tag">
                Clear filter
              </Link>
            </div>
          ) : null}
          {tagList.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tagList.map((tag) => (
                <Link key={tag.slug} href={`/learn?tag=${encodeURIComponent(tag.slug)}`} className="learn-tag">
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      {blocks.length ? <BlocksRenderer blocks={blocks} /> : null}
      <SiteFooter navItems={navItems} />
    </main>
  );
}
