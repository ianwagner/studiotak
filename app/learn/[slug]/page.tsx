import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigationItems } from "@/lib/navigation";
import { getGhostPostBySlug, getGhostPosts, type GhostPost } from "@/lib/ghost";

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
  growth: "/campfire/growth",
  "growth-marketing": "/campfire/growth",
  brands: "/campfire/brands",
  brand: "/campfire/brands",
  agencies: "/campfire/agencies",
  agency: "/campfire/agencies"
};

const CAMPFIRE_AUDIENCE_TAGS = new Set([
  "fashion",
  "ecommerce",
  "saas",
  "fintech",
  "healthcare",
  "beauty",
  "food",
  "travel",
  "fitness",
  "retail",
  "tech",
  "luxury",
  "cpg",
  "b2b",
  "dtc"
]);

const getCampfireLink = (tags: Array<{ slug: string }> | undefined): { href: string; label: string } | null => {
  if (!tags?.length) return null;
  const slugs = tags.map((t) => t.slug);
  const pageSlug = slugs.find((s) => CAMPFIRE_PAGE_TAGS[s]);
  const audienceSlug = slugs.find((s) => CAMPFIRE_AUDIENCE_TAGS.has(s));

  const basePath = pageSlug ? CAMPFIRE_PAGE_TAGS[pageSlug] : "/campfire";
  const href = audienceSlug ? `${basePath}?audience=${audienceSlug}` : basePath;

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

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";
  const canonical = post.canonical_url?.trim() || new URL(`/learn/${post.slug}`, siteBase).toString();
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

  const published = formatDate(post.published_at);
  const relatedPosts = getRelatedPosts(post, allPosts);
  const campfireLink = getCampfireLink(post.tags);

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    url: new URL(`/learn/${post.slug}`, siteBase).toString(),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    ...(post.excerpt ? { description: post.excerpt } : {}),
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
      <article
        className="container learn-article learn-shell"
        data-article-slug={post.slug}
        data-article-title={post.title}
      >
        <div className="learn-post-header">
          <div className="learn-post-meta">
            {published ? <span className="learn-date">{published}</span> : null}
          </div>
          <h1>{post.title}</h1>
          {post.excerpt ? <p className="learn-post-excerpt">{post.excerpt}</p> : null}
        </div>
        {post.feature_image ? (
          <figure className="learn-hero-media">
            <img
              src={post.feature_image}
              alt={post.feature_image_alt ?? post.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </figure>
        ) : null}
        {post.html ? (
          <div className="ghost-content" dangerouslySetInnerHTML={{ __html: post.html }} />
        ) : null}
      </article>
      {(relatedPosts.length > 0 || campfireLink) ? (
        <section className="container learn-shell learn-read-more">
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
              <div className="learn-recent-grid">
                {relatedPosts.map((related) => {
                  const relPublished = formatDate(related.published_at);
                  return (
                    <Link key={related.id} href={`/learn/${related.slug}`} className="learn-recent-link">
                      <article className="learn-recent-card">
                        <div className="learn-media-link">
                          {related.feature_image ? (
                            <img src={related.feature_image} alt={related.feature_image_alt ?? related.title} />
                          ) : (
                            <div className="learn-media-placeholder">Studio Tak</div>
                          )}
                        </div>
                        <div className="learn-card-body">
                          {relPublished ? <span className="learn-date">{relPublished}</span> : null}
                          <h4 className="learn-card-title">{related.title}</h4>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
      <Script id="ghost-toggle-fallback" strategy="afterInteractive">
        {`document.addEventListener("click", (event) => {
  const heading = event.target.closest(".kg-toggle-heading");
  if (!heading) return;
  if (heading.tagName.toLowerCase() === "summary") return;
  const toggle = heading.closest(".kg-toggle-card");
  if (!toggle) return;
  if (toggle.hasAttribute("open")) {
    toggle.removeAttribute("open");
  } else {
    toggle.setAttribute("open", "");
  }
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

  const onSubmit = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) return;
    if (!content.contains(target)) return;
    sendEvent("newsletter_signup", {
      form_id: target.id || "",
      form_action: target.getAttribute("action") || ""
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  document.addEventListener("click", onClick);
  document.addEventListener("submit", onSubmit, true);
  onScroll();
})();`}
      </Script>
      <SiteFooter navItems={navItems} />
    </main>
  );
}
