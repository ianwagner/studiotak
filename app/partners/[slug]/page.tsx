import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GhostArticleContent } from "@/components/GhostArticleContent";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getGhostPostBySlug, getGhostPosts } from "@/lib/ghost";
import { getGhostImageSrcSet, getOptimizedGhostImageUrl } from "@/lib/ghostImage";
import { getNavigationItems } from "@/lib/navigation";
import { isPartnerPost } from "@/lib/partners";
import { getCanonicalUrl, getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 120;
export const dynamic = "force-static";

type PageParams = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const posts = await getGhostPosts("partners");
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const post = await getGhostPostBySlug(params.slug);
  if (!post || !isPartnerPost(post)) return {};

  const canonical = getCanonicalUrl(`/partners/${post.slug}`);
  const title = post.meta_title || `${post.title} | Studio Tak Partner`;
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
      images: post.feature_image
        ? [{ url: post.feature_image, alt: post.feature_image_alt ?? post.title }]
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

export default async function PartnerProfilePage({ params }: PageParams) {
  const [navItems, post] = await Promise.all([
    getNavigationItems(),
    getGhostPostBySlug(params.slug)
  ]);

  if (!post || !isPartnerPost(post)) return notFound();

  const siteBase = getSiteUrl();
  const profileUrl = new URL(`/partners/${post.slug}`, siteBase).toString();
  const partnerJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${post.title} — Studio Tak Partner`,
    description: post.excerpt || undefined,
    url: profileUrl,
    mainEntity: {
      "@type": "Organization",
      name: post.title,
      ...(post.feature_image ? { logo: post.feature_image } : {})
    }
  };

  return (
    <>
      <SiteHeader navItems={navItems} />
      <main id="main-content" tabIndex={-1}>
        <article className="partner-profile" data-partner-slug={post.slug}>
          <div className="container partner-profile-shell" data-keep-centered>
            <Link href="/partners" className="partner-profile-back">
              <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.8} />
              All partners
            </Link>

            <header className="partner-profile-hero">
              <div className="partner-profile-logo">
                {post.feature_image ? (
                  <img
                    src={getOptimizedGhostImageUrl(post.feature_image, 900)}
                    srcSet={getGhostImageSrcSet(post.feature_image)}
                    sizes="(max-width: 760px) 100vw, 360px"
                    alt={post.feature_image_alt ?? `${post.title} logo`}
                    fetchPriority="high"
                    decoding="async"
                  />
                ) : (
                  <span aria-hidden="true">{post.title.slice(0, 1)}</span>
                )}
              </div>
              <div className="partner-profile-intro">
                <p className="partners-eyebrow">Studio Tak Partner</p>
                <h1>{post.title}</h1>
                {post.excerpt ? <p>{post.excerpt}</p> : null}
              </div>
            </header>

            {post.html ? (
              <div className="partner-profile-body">
                <GhostArticleContent html={post.html} />
              </div>
            ) : null}

            <div className="partner-profile-footer">
              <Link href="/partners" className="partner-profile-all-link">
                Explore all partners
                <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
              </Link>
            </div>
          </div>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(partnerJsonLd) }}
          />
        </article>
      </main>
      <SiteFooter navItems={navItems} showTopBorder />
    </>
  );
}

