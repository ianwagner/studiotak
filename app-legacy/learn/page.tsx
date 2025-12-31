import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getNavigationItems } from "@/lib/navigation";
import {
  collectGhostTags,
  filterGhostPostsByTag,
  getGhostPosts,
  type GhostTag
} from "@/lib/ghostContent";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Learn | Studio Tak",
  description: "Insights, playbooks, and product stories from Studio Tak."
};

type LearnPageProps = {
  searchParams?: { tag?: string };
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

const tagParamForTag = (tag: GhostTag) => (tag.name.includes(":") ? tag.name : tag.slug);

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const navItems = await getNavigationItems();
  const posts = await getGhostPosts();
  const tags = collectGhostTags(posts);
  const activeTag = searchParams?.tag?.trim();
  const filteredPosts = filterGhostPostsByTag(posts, activeTag);
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
    return bTime - aTime;
  });
  const featuredCandidates = sortedPosts.filter((post) => post.featured);
  const featuredPost = (featuredCandidates[0] ?? sortedPosts[0]) ?? null;
  const featuredDate = featuredPost ? formatDate(featuredPost.published_at ?? undefined) : null;
  const remainingPosts = featuredPost
    ? sortedPosts.filter((post) => post.id !== featuredPost.id)
    : sortedPosts;
  const recentPosts = remainingPosts.slice(0, 3);
  const morePosts = remainingPosts.slice(3);

  return (
    <main>
      <SiteHeader navItems={navItems} />
      <section className="container learn-shell">
        {featuredPost ? (
          <Link
            className={`learn-featured ${featuredPost.feature_image ? "has-media" : "no-media"}`}
            href={`/learn/${featuredPost.slug}`}
          >
            <div className="learn-featured-copy">
              {featuredDate ? <span className="learn-date">{featuredDate}</span> : null}
              <h2 style={{ margin: 0 }}>{featuredPost.title}</h2>
              {featuredPost.excerpt ? (
                <p style={{ margin: 0, color: "var(--muted)" }}>{featuredPost.excerpt}</p>
              ) : null}
              <div className="learn-meta">
                {(featuredPost.tags ?? []).filter((tag) => tag.visibility !== "internal").length ? (
                  <div className="learn-tags">
                    {(featuredPost.tags ?? [])
                      .filter((tag) => tag.visibility !== "internal")
                      .map((tag) => (
                        <span key={tag.id} className="chip muted">
                          {tag.name}
                        </span>
                      ))}
                  </div>
                ) : null}
              </div>
              <span className="btn secondary">Read more</span>
            </div>
            {featuredPost.feature_image ? (
              <img
                src={featuredPost.feature_image}
                alt={featuredPost.feature_image_alt ?? featuredPost.title}
                className="learn-featured-image"
              />
            ) : null}
          </Link>
        ) : null}

        <div className="learn-grid">
          {recentPosts.length
            ? recentPosts.map((post) => {
                const published = formatDate(post.published_at ?? undefined);
                const visibleTags = (post.tags ?? []).filter((tag) => tag.visibility !== "internal");
                return (
                  <Link key={post.id} className="learn-row-item" href={`/learn/${post.slug}`}>
                    {post.feature_image ? (
                      <img
                        src={post.feature_image}
                        alt={post.feature_image_alt ?? post.title}
                        className="learn-card-image"
                        loading="lazy"
                      />
                    ) : null}
                    <div style={{ display: "grid", gap: 10 }}>
                      {published ? <span className="learn-date">{published}</span> : null}
                      <h3 style={{ margin: 0 }}>{post.title}</h3>
                      {post.excerpt ? <p style={{ margin: 0, color: "var(--muted)" }}>{post.excerpt}</p> : null}
                    </div>
                    {visibleTags.length ? (
                      <div className="learn-tags">
                        {visibleTags.map((tag) => (
                          <span key={tag.id} className="chip muted">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                );
              })
            : (
                Array.from({ length: 3 }).map((_, idx) => (
                  <article key={`recent-placeholder-${idx}`} className="learn-row-item" aria-hidden="true">
                    <div className="learn-card-image" />
                    <div style={{ display: "grid", gap: 10 }}>
                      <span className="learn-date">Date</span>
                      <h3 style={{ margin: 0 }}>Title</h3>
                      <p style={{ margin: 0, color: "var(--muted)" }}>Lorem ipsum for snippet</p>
                    </div>
                  </article>
                ))
              )}
        </div>

        {tags.length ? (
          <div className="chip-row">
            <Link className={`chip ${!activeTag ? "active" : ""}`} href="/learn">
              All
            </Link>
            {tags.map((tag) => {
              const value = tagParamForTag(tag);
              const isActive =
                activeTag?.toLowerCase() === tag.slug.toLowerCase() ||
                activeTag?.toLowerCase() === tag.name.toLowerCase();
              return (
                <Link
                  key={tag.id}
                  className={`chip ${isActive ? "active" : ""}`}
                  href={`/learn?tag=${encodeURIComponent(value)}`}
                >
                  {tag.name}
                </Link>
              );
            })}
          </div>
        ) : null}

        {morePosts.length ? (
          <div className="learn-grid">
            {morePosts.map((post) => {
              const published = formatDate(post.published_at ?? undefined);
              const visibleTags = (post.tags ?? []).filter((tag) => tag.visibility !== "internal");
              return (
                <article key={post.id} className="card learn-card">
                  {post.feature_image ? (
                    <img
                      src={post.feature_image}
                      alt={post.feature_image_alt ?? post.title}
                      className="learn-card-image"
                      loading="lazy"
                    />
                  ) : null}
                  <div style={{ display: "grid", gap: 10 }}>
                    <h3 style={{ margin: 0 }}>{post.title}</h3>
                    {post.excerpt ? <p style={{ margin: 0, color: "var(--muted)" }}>{post.excerpt}</p> : null}
                  </div>
                  <div className="learn-meta">
                    {published ? <span>{published}</span> : null}
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
                  <Link className="btn secondary" href={`/learn/${post.slug}`}>
                    Read article
                  </Link>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
      <SiteFooter navItems={navItems} />
    </main>
  );
}
