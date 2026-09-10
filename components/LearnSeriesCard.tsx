import Link from "next/link";
import { ArrowRight, ListOrdered } from "lucide-react";
import type { ResolvedLearnSeries } from "@/lib/learnSeries";
import { getGhostImageSrcSet, getOptimizedGhostImageUrl } from "@/lib/ghostImage";

type LearnSeriesCardProps = {
  series: ResolvedLearnSeries;
};

export function LearnSeriesCard({ series }: LearnSeriesCardProps) {
  const featurePost = series.steps.find((step) => step.post.feature_image)?.post;
  const visualImage = series.iconSrc ?? featurePost?.feature_image;

  return (
    <Link
      href={`/learn/series/${series.slug}`}
      className="learn-topic-card learn-series-card has-visual"
    >
      <span className={`learn-topic-card-visual learn-series-card-media${series.iconSrc ? " is-icon" : ""}`} aria-hidden="true">
        {visualImage ? (
          <img
            src={series.iconSrc ? series.iconSrc : getOptimizedGhostImageUrl(featurePost!.feature_image!, 720)}
            srcSet={series.iconSrc ? undefined : getGhostImageSrcSet(featurePost!.feature_image!)}
            sizes="(max-width: 560px) 100vw, 33vw"
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <ListOrdered size={34} strokeWidth={1.4} />
        )}
      </span>
      <span className="learn-topic-card-title learn-series-card-title">{series.title}</span>
      <span className="learn-topic-card-action learn-series-card-action">
        View steps <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
      </span>
    </Link>
  );
}
