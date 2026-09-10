import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LearnSidebar } from "@/components/LearnSidebar";
import { getGhostPosts, getReadingTimeMinutes } from "@/lib/ghost";
import { getGhostImageSrcSet, getOptimizedGhostImageUrl } from "@/lib/ghostImage";
import { findLearnSeriesBySlug, getAvailableLearnSeries } from "@/lib/learnSeries";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlug } from "@/lib/pageContent";
import { getCanonicalUrl, getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 120;
export const dynamic = "force-static";

type SeriesPageProps = {
  params: { slug: string };
};

const getSeriesPath = (slug: string) => `/learn/series/${slug}`;

export async function generateStaticParams() {
  const posts = await getGhostPosts();
  return getAvailableLearnSeries(posts).map((series) => ({ slug: series.slug }));
}

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const posts = await getGhostPosts();
  const series = findLearnSeriesBySlug(params.slug, posts);
  if (!series) return {};

  const path = getSeriesPath(series.slug);
  const canonical = getCanonicalUrl(path);
  const title = `${series.title} — Reference`;

  return {
    title,
    description: series.description,
    alternates: { canonical },
    openGraph: {
      title,
      description: series.description,
      url: canonical,
      siteName: "Studio Tak",
      type: "website"
    },
    twitter: {
      card: "summary",
      title,
      description: series.description
    }
  };
}

export default async function LearnSeriesPage({ params }: SeriesPageProps) {
  const [navItems, pageData, posts] = await Promise.all([
    getNavigationItems(),
    getPublishedPageBySlug("/learn"),
    getGhostPosts()
  ]);
  const series = findLearnSeriesBySlug(params.slug, posts);

  if (!pageData || !series) notFound();

  const path = getSeriesPath(series.slug);
  const siteBase = getSiteUrl();
  const seriesReadingTimeMinutes = series.steps.reduce((total, step) => total + (getReadingTimeMinutes(step.post) ?? 0), 0);
  const seriesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: series.title,
    description: series.description,
    url: new URL(path, siteBase).toString(),
    numberOfItems: series.steps.length,
    itemListElement: series.steps.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.title,
      url: new URL(`/learn/${step.postSlug}`, siteBase).toString()
    }))
  };

  return (
    <>
      <SiteHeader navItems={navItems} />
      <main id="main-content" tabIndex={-1}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seriesJsonLd) }}
        />
        <div className="container learn-detail-shell">
        <LearnSidebar posts={posts} currentSeriesSlug={series.slug} />
        <div className="learn-detail-content">
          <div className="learn-series-reading-layout">
            <section className="learn-series-detail" aria-labelledby="learn-series-detail-title">
              <Link className="learn-series-back" href="/learn">
                <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.8} />
                All guides
              </Link>
              <header className={`learn-series-detail-header${series.iconSrc ? " has-icon" : ""}`}>
                {series.iconSrc ? (
                  <span className="learn-series-detail-icon" aria-hidden="true">
                    <img src={series.iconSrc} alt="" />
                  </span>
                ) : null}
                <div className="learn-series-detail-copy">
                  <h1 id="learn-series-detail-title">{series.title}</h1>
                  <p>{series.description}</p>
                </div>
              </header>
              <ol className="learn-series-steps">
                {series.steps.map((step, index) => (
                  <li key={step.postSlug}>
                    <span className="learn-series-step-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Link
                      className={`learn-series-step-card${step.post.feature_image ? " has-feature-artwork" : ""}`}
                      href={`/learn/${step.postSlug}`}
                    >
                      <span className="learn-series-step-card-copy">
                        <span className="learn-series-step-label">Step {index + 1}</span>
                        <span className="learn-series-step-title">{step.title}</span>
                        {step.post.excerpt ? <span className="learn-series-step-excerpt">{step.post.excerpt}</span> : null}
                        <span className="learn-series-step-action">
                          Read guide <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
                        </span>
                      </span>
                      {step.post.feature_image ? (
                        <span className="learn-series-step-media">
                          <img
                            src={getOptimizedGhostImageUrl(step.post.feature_image, 720)}
                            srcSet={getGhostImageSrcSet(step.post.feature_image)}
                            sizes="(max-width: 560px) 100vw, 240px"
                            alt={step.post.feature_image_alt ?? step.post.title}
                            loading="lazy"
                            decoding="async"
                          />
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
            {seriesReadingTimeMinutes ? (
              <aside className="learn-series-duration-rail" aria-label="Series duration">
                <div className="learn-series-duration">
                  <div className="learn-series-duration-summary">
                    <Clock aria-hidden="true" size={18} strokeWidth={1.8} />
                    <div>
                      <strong>{seriesReadingTimeMinutes} min total</strong>
                      <span>{series.steps.length} guides</span>
                    </div>
                  </div>
                  <ol className="learn-series-duration-guides">
                    {series.steps.map((step) => {
                      const readingTimeMinutes = getReadingTimeMinutes(step.post);
                      return (
                        <li key={step.postSlug}>
                          <span className="learn-series-duration-guide-title">{step.title}</span>
                          {readingTimeMinutes ? (
                            <span className="learn-series-duration-guide-time">
                              <Clock aria-hidden="true" size={13} strokeWidth={1.8} />
                              {readingTimeMinutes} min
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
        </div>
      </main>
      <SiteFooter navItems={navItems} showTopBorder />
    </>
  );
}
