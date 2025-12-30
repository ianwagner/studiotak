import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getNavigationItems } from "@/lib/navigation";
import { getGhostPostBySlug } from "@/lib/ghostContent";

export const revalidate = 120;

type LearnPostPageProps = {
  params: { slug: string };
};

const loadPost = cache(async (slug: string) => getGhostPostBySlug(slug));

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

export async function generateMetadata({ params }: LearnPostPageProps): Promise<Metadata> {
  const post = await loadPost(params.slug);
  if (!post) return {};

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-tak.example";
  const canonical = post.canonical_url?.trim() || new URL(`/learn/${post.slug}`, siteBase).toString();
  const description = post.meta_description || post.excerpt || undefined;
  const ogTitle = post.og_title || post.meta_title || post.title;
  const ogDescription = post.og_description || description;

  return {
    title: post.meta_title || post.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      images: post.feature_image
        ? [{ url: post.feature_image, alt: post.feature_image_alt ?? post.title }]
        : undefined
    },
    twitter: {
      card: post.feature_image ? "summary_large_image" : "summary",
      title: post.twitter_title || ogTitle,
      description: post.twitter_description || ogDescription,
      images: post.feature_image ? [post.feature_image] : undefined
    }
  };
}

export default async function LearnPostPage({ params }: LearnPostPageProps) {
  const post = await loadPost(params.slug);
  if (!post) return notFound();

  const navItems = await getNavigationItems();
  const published = formatDate(post.published_at ?? undefined);
  const visibleTags = (post.tags ?? []).filter((tag) => tag.visibility !== "internal");

  return (
    <main>
      <SiteHeader navItems={navItems} />
      <article className="container learn-shell learn-post">
        <div className="learn-hero">
          {published ? <span className="learn-date">{published}</span> : null}
          <h1>{post.title}</h1>
          {post.excerpt ? <p style={{ margin: 0, color: "var(--muted)", maxWidth: 720 }}>{post.excerpt}</p> : null}
          {visibleTags.length ? (
            <div className="learn-tags">
              {visibleTags.map((tag) => (
                <span key={tag.id} className="chip muted">
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {post.feature_image ? (
          <img
            src={post.feature_image}
            alt={post.feature_image_alt ?? post.title}
            className="learn-hero-image"
          />
        ) : null}

        {post.html ? (
          <div className="learn-content" dangerouslySetInnerHTML={{ __html: post.html }} />
        ) : (
          <p style={{ margin: 0, color: "var(--muted)" }}>No content available for this post.</p>
        )}
      </article>
      <SiteFooter navItems={navItems} />
    </main>
  );
}
