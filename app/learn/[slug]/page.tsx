import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LearnSidebar } from "@/components/LearnSidebar";
import { LearnTableOfContents } from "@/components/LearnTableOfContents";
import { LearnArticleCard } from "@/components/LearnArticleCard";
import { LearnArticleFeedback } from "@/components/LearnArticleFeedback";
import { GhostArticleContent } from "@/components/GhostArticleContent";
import { getLearnDisplayTitle, getLearnGroupForPost, getLearnTopicForPost, LEARN_GROUPS } from "@/lib/learnTaxonomy";
import { getLearnSeriesMembership } from "@/lib/learnSeries";
import { buildLearnTableOfContents } from "@/lib/learnTableOfContents";
import { getNavigationItems } from "@/lib/navigation";
import { getGhostPostBySlug, getGhostPosts, getReadingTimeMinutes, type GhostPost } from "@/lib/ghost";
import { getGhostImageSrcSet, getOptimizedGhostImageUrl } from "@/lib/ghostImage";
import { getCanonicalUrl, getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 120;
export const dynamic = "force-static";

type PageParams = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const posts = await getGhostPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

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

/**
 * Maps Ghost tag slugs to Campfire page paths.
 * "page" tags determine the Campfire route; "audience" tags become a query param.
 */
const CAMPFIRE_PAGE_TAGS: Record<string, string> = {
  "campfire-growth": "/campfire/growth",
  "campfire-growth-marketing": "/campfire/growth",
  "campfire-brands": "/campfire/brands",
  "campfire-brand": "/campfire/brands",
  "campfire-agencies": "/campfire/agencies",
  "campfire-agency": "/campfire/agencies"
};

const CAMPFIRE_AUDIENCE_TAGS = new Set([
  "campfire-fashion",
  "campfire-ecommerce",
  "campfire-saas",
  "campfire-fintech",
  "campfire-healthcare",
  "campfire-beauty",
  "campfire-food",
  "campfire-travel",
  "campfire-fitness",
  "campfire-retail",
  "campfire-tech",
  "campfire-luxury",
  "campfire-cpg",
  "campfire-b2b",
  "campfire-dtc"
]);

const getCampfireLink = (tags: Array<{ slug: string }> | undefined): { href: string; label: string } | null => {
  if (!tags?.length) return null;
  const slugs = tags.map((t) => t.slug);
  const pageSlug = slugs.find((s) => CAMPFIRE_PAGE_TAGS[s]);
  const audienceSlug = slugs.find((s) => CAMPFIRE_AUDIENCE_TAGS.has(s));

  const basePath = pageSlug ? CAMPFIRE_PAGE_TAGS[pageSlug] : "/campfire";
  const audienceParam = audienceSlug?.replace(/^campfire-/, "");
  const href = audienceParam ? `${basePath}?audience=${audienceParam}` : basePath;

  const pageLabel = pageSlug
    ? CAMPFIRE_PAGE_TAGS[pageSlug].split("/").pop()!
    : null;
  const label = pageLabel ? `See how Campfire helps ${pageLabel} teams` : "See what Campfire can do";

  return { href, label };
};

const getRelatedPosts = (current: GhostPost, allPosts: GhostPost[], limit = 3): GhostPost[] => {
  const others = allPosts.filter((p) => p.slug !== current.slug);
  if (!others.length) return [];

  const currentTagSlugs = new Set((current.tags ?? []).map((t) => t.slug));
  if (!currentTagSlugs.size) return others.slice(0, limit);

  const scored = others.map((p) => {
    const overlap = (p.tags ?? []).filter((t) => currentTagSlugs.has(t.slug)).length;
    return { post: p, score: overlap };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.post);
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const post = await getGhostPostBySlug(params.slug);
  if (!post) return {};

  const canonical = getCanonicalUrl(`/learn/${post.slug}`, post.canonical_url);
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.og_title || title,
      description: post.og_description || description,
      url: canonical,
      siteName: "Studio Tak",
      type: "article",
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      ...(post.updated_at ? { modifiedTime: post.updated_at } : {}),
      images: post.feature_image
        ? [
            {
              url: post.feature_image,
              alt: post.feature_image_alt ?? post.title
            }
          ]
        : undefined
    },
    twitter: {
      card: post.feature_image ? "summary_large_image" : "summary",
      title: post.twitter_title || post.og_title || title,
      description: post.twitter_description || post.og_description || description,
      images: post.feature_image ? [post.feature_image] : undefined
    }
  };
}

export default async function LearnPostPage({ params }: PageParams) {
  const [navItems, post, allPosts] = await Promise.all([
    getNavigationItems(),
    getGhostPostBySlug(params.slug),
    getGhostPosts()
  ]);

  if (!post) {
    return notFound();
  }

  const relatedPosts = getRelatedPosts(post, allPosts);
  const campfireLink = getCampfireLink(post.tags);
  const { content: articleHtml, items: tableOfContents } = buildLearnTableOfContents(post.html);
  const learnGroup = getLearnGroupForPost(post);
  const learnTopic = getLearnTopicForPost(post, learnGroup);
  const learnGroupTitle = LEARN_GROUPS.find((group) => group.key === learnGroup)?.title ?? "Learn";
  const topicHref = `/learn/topics/${learnGroup}/${encodeURIComponent(learnTopic)}`;
  const seriesMembership = getLearnSeriesMembership(post.slug, allPosts);
  const nextSeriesStep = seriesMembership?.series.steps[seriesMembership.stepIndex + 1];
  const readingTimeMinutes = getReadingTimeMinutes(post);

  const siteBase = getSiteUrl();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    url: new URL(`/learn/${post.slug}`, siteBase).toString(),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(readingTimeMinutes ? { timeRequired: `PT${readingTimeMinutes}M` } : {}),
    ...(post.feature_image
      ? { image: { "@type": "ImageObject", url: post.feature_image, ...(post.feature_image_alt ? { name: post.feature_image_alt } : {}) } }
      : {}),
    publisher: {
      "@type": "Organization",
      name: "Studio Tak",
      url: siteBase
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": new URL(`/learn/${post.slug}`, siteBase).toString()
    }
  };

  return (
    <main>
      <SiteHeader navItems={navItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="container learn-detail-shell">
        <LearnSidebar posts={allPosts} currentPostSlug={post.slug} />
        <div className="learn-detail-content">
          <div className={`learn-detail-reading-layout${tableOfContents.length ? " has-toc" : ""}`}>
            <article
              className="learn-article"
              data-article-slug={post.slug}
              data-article-title={post.title}
            >
              <div className="learn-article-topline">
                <nav className="learn-breadcrumb" aria-label="Breadcrumb">
                  <Link href="/learn">{learnGroupTitle}</Link>
                  <span aria-hidden="true">/</span>
                  <Link href={topicHref as any}>{learnTopic}</Link>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page">{getLearnDisplayTitle(post)}</span>
                </nav>
                {readingTimeMinutes ? (
                  <p className="learn-post-meta">
                    <Clock aria-hidden="true" size={15} strokeWidth={1.8} />
                    {readingTimeMinutes} min read
                  </p>
                ) : null}
              </div>
              {post.feature_image ? (
                <figure className="learn-hero-media">
                  <img
                    src={getOptimizedGhostImageUrl(post.feature_image, 1600)}
                    srcSet={getGhostImageSrcSet(post.feature_image)}
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    alt={post.feature_image_alt ?? post.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    fetchPriority="high"
                    decoding="async"
                  />
                </figure>
              ) : null}
              <div className="learn-post-header">
                <h1>{post.title}</h1>
                {post.excerpt ? <p className="learn-post-excerpt">{post.excerpt}</p> : null}
              </div>
              {articleHtml ? (
                <GhostArticleContent html={articleHtml} />
              ) : null}
              <LearnArticleFeedback articleSlug={post.slug} articleTitle={post.title} />
            </article>
            {tableOfContents.length ? (
              <div className="learn-table-of-contents-rail">
                <LearnTableOfContents items={tableOfContents} />
              </div>
            ) : null}
          </div>
          {(seriesMembership || relatedPosts.length > 0 || campfireLink) ? (
            <section className="learn-read-more">
              {seriesMembership ? (
                <section className="learn-series-progress" aria-labelledby="learn-series-progress-title">
                  <p>
                    Step {seriesMembership.stepIndex + 1} of {seriesMembership.series.steps.length}
                  </p>
                  <h2 id="learn-series-progress-title">{seriesMembership.series.title}</h2>
                  <span className="learn-series-progress-current">
                    You’re reading: {seriesMembership.series.steps[seriesMembership.stepIndex].title}
                  </span>
                  <div className="learn-series-progress-actions">
                    <Link href={`/learn/series/${seriesMembership.series.slug}`} className="learn-series-progress-link">
                      View all steps
                    </Link>
                    {nextSeriesStep ? (
                      <Link href={`/learn/${nextSeriesStep.postSlug}`} className="learn-series-progress-next">
                        Next: {nextSeriesStep.title}
                      </Link>
                    ) : (
                      <Link href={`/learn/series/${seriesMembership.series.slug}`} className="learn-series-progress-next">
                        Review steps
                      </Link>
                    )}
                  </div>
                </section>
              ) : null}
              {campfireLink ? (
                <div className="learn-campfire-cta">
                  <Link href={campfireLink.href as any} className="btn btn-primary">
                    {campfireLink.label}
                  </Link>
                </div>
              ) : null}
              {relatedPosts.length > 0 ? (
                <div className="learn-recent">
                  <div className="learn-recent-header">
                    <h3>Read more</h3>
                  </div>
                  <div className="learn-article-card-grid">
                    {relatedPosts.map((related) => (
                      <LearnArticleCard key={related.id} post={related} />
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
      <Script id="ghost-toggle-fallback" strategy="afterInteractive">
        {`document.addEventListener("click", (event) => {
  const heading = event.target.closest(".kg-toggle-heading");
  if (!heading) return;
  const toggle = heading.closest(".kg-toggle-card");
  if (!toggle) return;
  event.preventDefault();
  const isOpen = toggle.getAttribute("data-kg-toggle-state") === "open" || toggle.hasAttribute("open");
  const nextState = isOpen ? "close" : "open";
  toggle.setAttribute("data-kg-toggle-state", nextState);
  toggle.toggleAttribute("open", !isOpen);
  const button = heading.querySelector("button");
  if (button) button.setAttribute("aria-expanded", String(!isOpen));
});`}
      </Script>
      <Script id="ghost-analytics-events" strategy="afterInteractive">
        {`(() => {
  const article = document.querySelector("article.learn-article");
  const content = article?.querySelector(".ghost-content");
  if (!article || !content) return;

  const slug = article.getAttribute("data-article-slug") || "";
  const title = article.getAttribute("data-article-title") || "";
  const sendEvent = (name, params = {}) => {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, {
      article_slug: slug,
      article_title: title,
      ...params
    });
  };

  let sent50 = false;
  let sent90 = false;
  const onScroll = () => {
    const rect = content.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const contentHeight = content.scrollHeight || rect.height || 0;
    if (!contentHeight) return;
    const consumed = Math.max(0, Math.min(contentHeight, viewportHeight - rect.top));
    const progress = consumed / contentHeight;

    if (!sent50 && progress >= 0.5) {
      sent50 = true;
      sendEvent("article_read_50", { progress_percent: 50 });
    }
    if (!sent90 && progress >= 0.9) {
      sent90 = true;
      sendEvent("article_read_90", { progress_percent: 90 });
    }
  };

  const onClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a");
    if (!link || !content.contains(link)) return;
    sendEvent("article_cta_click", {
      link_url: link.getAttribute("href") || "",
      link_text: (link.textContent || "").trim().slice(0, 120)
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  document.addEventListener("click", onClick);
  onScroll();
})();`}
      </Script>
      <SiteFooter navItems={navItems} showTopBorder />
    </main>
  );
}
