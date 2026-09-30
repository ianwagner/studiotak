import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { GhostPost } from "@/lib/ghost";
import { getGhostImageSrcSet, getOptimizedGhostImageUrl } from "@/lib/ghostImage";

type PartnerCardProps = {
  post: GhostPost;
};

export function PartnerCard({ post }: PartnerCardProps) {
  const imageUrl = post.feature_image ? getOptimizedGhostImageUrl(post.feature_image, 720) : null;

  return (
    <Link href={`/partners/${post.slug}`} className="partner-card">
      <span className="partner-card-media">
        {imageUrl ? (
          <img
            src={imageUrl}
            srcSet={getGhostImageSrcSet(post.feature_image!)}
            sizes="(max-width: 720px) 100vw, 33vw"
            alt={post.feature_image_alt ?? `${post.title} logo`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="partner-card-monogram" aria-hidden="true">
            {post.title.slice(0, 1)}
          </span>
        )}
      </span>
      <span className="partner-card-copy">
        <span className="partner-card-title">{post.title}</span>
        {post.excerpt ? <span className="partner-card-excerpt">{post.excerpt}</span> : null}
        <span className="partner-card-action">
          Meet our partner <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
        </span>
      </span>
    </Link>
  );
}

