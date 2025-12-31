import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigationItems } from "@/lib/navigation";
import { getGhostPosts } from "@/lib/ghost";

export const revalidate = 120;
export const dynamic = "force-static";

type LearnPageProps = {
  searchParams?: { tag?: string | string[] };
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

const getTagParam = (value?: string | string[]): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
};

export async function generateMetadata(): Promise<Metadata> {
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";
  const canonical = new URL("/learn", siteBase).toString();
  return {
    title: "Learn | Studio Tak",
    description: "Insights, case studies, and notes from Studio Tak.",
    alternates: { canonical }
  };
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const navItems = await getNavigationItems();
  const tagFilter = getTagParam(searchParams?.tag);
  const posts = await getGhostPosts(tagFilter);
  const formattedTag = tagFilter?.trim();
  const featuredPost =
    posts.find((post) => (post.tags ?? []).some((tag) => tag.slug === "featured" && tag.visibility !== "internal")) ??
    posts[0] ??
    null;
  const listPosts = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : posts;
  const recentPosts = listPosts.slice(0, 3);
  const gridPosts = listPosts.slice(3);

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
      {featuredPost ? (
        <section className="container learn-shell" style={{ padding: "24px 0 48px" }}>
          <Link href={`/learn/${featuredPost.slug}`} className="learn-featured-link">
            <div className="learn-featured">
              <div className="learn-featured-content">
                <div className="learn-featured-meta">
                  {formatDate(featuredPost.published_at) ? (
                    <span className="learn-date">{formatDate(featuredPost.published_at)}</span>
                  ) : null}
                </div>
                <h2 className="learn-featured-title">{featuredPost.title}</h2>
                {featuredPost.excerpt ? (
                  <p style={{ color: "var(--muted)", margin: 0 }}>{featuredPost.excerpt}</p>
                ) : null}
                {(featuredPost.tags ?? []).filter((tag) => tag.visibility !== "internal").length ? (
                  <div className="learn-tags-row">
                    {(featuredPost.tags ?? [])
                      .filter((tag) => tag.visibility !== "internal")
                      .map((tag) => (
                        <span key={tag.slug} className="learn-tag">
                          {tag.name}
                        </span>
                      ))}
                  </div>
                ) : null}
                <span className="btn learn-featured-cta">Read more</span>
              </div>
              <div className="learn-featured-media">
                {featuredPost.feature_image ? (
                  <img
                    src={featuredPost.feature_image}
                    alt={featuredPost.feature_image_alt ?? featuredPost.title}
                  />
                ) : (
                  <div className="learn-media-placeholder">Studio Tak</div>
                )}
              </div>
            </div>
          </Link>
        </section>
      ) : null}
      <section className="container learn-shell" style={{ padding: "0 0 120px" }}>
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
              const tagsForPost = (post.tags ?? []).filter((tag) => tag.visibility !== "internal");
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
                      {tagsForPost.length
                        ? tagsForPost.map((tag) => (
                            <Link
                              key={tag.slug}
                              href={`/learn?tag=${encodeURIComponent(tag.slug)}`}
                              className="learn-tag"
                            >
                              {tag.name}
                            </Link>
                          ))
                        : null}
                    </div>
                  </div>
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
