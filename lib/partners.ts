import type { GhostPost } from "@/lib/ghost";

export const isPartnerPost = (post: GhostPost): boolean =>
  post.tags?.some((tag) => {
    const name = tag.name.trim().toLowerCase();
    const slug = tag.slug.trim().toLowerCase();
    return name === "partners" || slug === "partners";
  }) ?? false;

export const excludePartnerPosts = (posts: GhostPost[]): GhostPost[] =>
  posts.filter((post) => !isPartnerPost(post));
