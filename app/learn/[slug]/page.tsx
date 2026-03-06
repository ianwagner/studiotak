import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigationItems } from "@/lib/navigation";
import { getGhostPostBySlug } from "@/lib/ghost";

export const revalidate = 120;
export const dynamic = "force-static";

type PageParams = {
  params: { slug: string };
};

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
  const navItems = await getNavigationItems();
  const post = await getGhostPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const published = formatDate(post.published_at);

  return (
    <main>
      <SiteHeader navItems={navItems} />
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
