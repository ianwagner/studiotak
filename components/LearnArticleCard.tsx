import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { getReadingTimeMinutes, type GhostPost } from "@/lib/ghost";
import { getGhostImageSrcSet, getOptimizedGhostImageUrl } from "@/lib/ghostImage";
import { getLearnDisplayTitle } from "@/lib/learnTaxonomy";

type LearnArticleCardProps = {
  post: GhostPost;
  sizes?: string;
};

/** Shared card used for Learn topic grids and related-article sections. */
export function LearnArticleCard({
  post,
  sizes = "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
}: LearnArticleCardProps) {
  const imageUrl = post.feature_image ? getOptimizedGhostImageUrl(post.feature_image, 720) : null;
  const readingTimeMinutes = getReadingTimeMinutes(post);

  return (
    <Link href={`/learn/${post.slug}`} className={`learn-article-card${imageUrl ? " has-feature-artwork" : ""}`}>
      {imageUrl ? (
        <span className="learn-article-card-media">
          <img
            src={imageUrl}
            srcSet={getGhostImageSrcSet(post.feature_image!)}
            sizes={sizes}
            alt={post.feature_image_alt ?? post.title}
            loading="lazy"
            decoding="async"
          />
        </span>
      ) : null}
      <span className="learn-article-card-title">{getLearnDisplayTitle(post)}</span>
      {post.excerpt ? <span className="learn-article-card-excerpt">{post.excerpt}</span> : null}
      <span className="learn-article-card-footer">
        <span className="learn-article-card-action">
          Read guide <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
        </span>
        {readingTimeMinutes ? (
          <span className="learn-article-card-reading-time">
            <Clock aria-hidden="true" size={15} strokeWidth={1.8} />
            {readingTimeMinutes} min read
          </span>
        ) : null}
      </span>
    </Link>
  );
}
