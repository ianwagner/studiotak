import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
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

const formatDate = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

const ArticleFeaturedBlockSection = ({ block }: { block: ArticleFeaturedBlock }) => {
  const post = block.posts?.[0];
  if (!post) return null;
  const published = formatDate(post.published_at);
  return (
    <section className="container learn-shell learn-featured-section" style={{ display: "grid", gap: 24 }}>
      <Link href={`/learn/${post.slug}`} className="learn-featured-link">
        <div className="learn-featured">
          <div className="learn-featured-content">
            <div className="learn-featured-meta">
              {published ? <span className="learn-date">{published}</span> : null}
            </div>
            <h2 className="learn-featured-title">{post.title}</h2>
            {post.excerpt ? <p style={{ color: "var(--muted)", margin: 0 }}>{post.excerpt}</p> : null}
            <span className="btn learn-featured-cta">Read more</span>
          </div>
          <div className="learn-featured-media">
            {post.feature_image ? (
              <img src={post.feature_image} alt={post.feature_image_alt ?? post.title} />
            ) : (
              <div className="learn-media-placeholder">Studio Tak</div>
            )}
          </div>
        </div>
      </Link>
    </section>
  );
};

const ArticleGridBlockSection = ({ block }: { block: ArticleGridBlock }) => {
  const posts = block.posts ?? [];
  if (!posts.length) return null;
  const recentPosts = posts.slice(0, 3);
  const gridPosts = posts.slice(3);
  return (
    <section className="container learn-shell" style={{ display: "grid", gap: 24 }}>
      {recentPosts.length ? (
        <div className="learn-recent">
          <div className="learn-recent-grid">
            {recentPosts.map((post) => {
              const published = formatDate(post.published_at);
              return (
                <Link key={post.id} href={`/learn/${post.slug}`} className="learn-recent-link">
                  <article className="learn-recent-card">
                    <div className="learn-media-link">
                      {post.feature_image ? (
                        <img src={post.feature_image} alt={post.feature_image_alt ?? post.title} />
                      ) : (
                        <div className="learn-media-placeholder">Studio Tak</div>
                      )}
                    </div>
                    <div className="learn-card-body">
                      {published ? <span className="learn-date">{published}</span> : null}
                      <h4 className="learn-card-title">{post.title}</h4>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      {gridPosts.length ? (
        <div className="grid learn-posts-grid">
          {gridPosts.map((post) => {
            const published = formatDate(post.published_at);
            return (
              <article key={post.id} className="card learn-post-card">
                <Link href={`/learn/${post.slug}`} className="learn-media-link">
                  {post.feature_image ? (
                    <img src={post.feature_image} alt={post.feature_image_alt ?? post.title} />
                  ) : (
                    <div className="learn-media-placeholder">Studio Tak</div>
                  )}
                </Link>
                <div className="learn-card-body">
                  <h4 className="learn-card-title">
                    <Link href={`/learn/${post.slug}`} className="learn-card-link">
                      {post.title}
                    </Link>
                  </h4>
                  {post.excerpt ? <p className="learn-card-excerpt">{post.excerpt}</p> : null}
                  <div className="learn-card-meta">
                    {published ? <span className="learn-date">{published}</span> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

const LearnArticleBlocks = ({ blocks }: { blocks: BlockRecord[] }) => (
  <>
    {blocks.filter(isArticleBlock).map((block) =>
      block.type === "article_featured" ? (
        <ArticleFeaturedBlockSection key={block.id} block={block} />
      ) : (
        <ArticleGridBlockSection key={block.id} block={block} />
      )
    )}
  </>
);

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
      {blocks.length ? <LearnArticleBlocks blocks={blocks} /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <SiteFooter navItems={navItems} />
    </main>
  );
}
