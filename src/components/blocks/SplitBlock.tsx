import Image from "next/image";
import { PortableText } from "@portabletext/react";

import { portableTextComponents } from "@/components/portableText/components";
import { buildSanityImage } from "@/lib/sanity/images";
import type { BlockDensity, BlockTheme, SanityBlock } from "@/lib/sanity/types";
import { gmColors, gmRadius } from "@/styles/designTokens";

import { resolveSpacingToken, resolveTypographyToken } from "./tokenUtils";

type PortableTextValue = Array<Record<string, unknown>>;

type SplitPoint = {
  _key?: string;
  title?: string;
  body?: string;
};

type SplitMediaAsset = {
  _ref?: string;
  _id?: string;
  url?: string;
};

type SplitMedia = {
  alt?: string;
  asset?: SplitMediaAsset | string;
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  imageUrl?: string;
};

export type SplitBlockData = SanityBlock & {
  _type: "splitBlock";
  layoutVariant?: "mediaRight" | "mediaLeft";
  eyebrow?: string;
  headline?: string;
  body?: PortableTextValue;
  headingStyle?: string;
  bodyStyle?: string;
  textStackToken?: string;
  points?: SplitPoint[];
  media?: SplitMedia | null;
  density?: BlockDensity;
  theme?: BlockTheme;
};

const MEDIA_WRAPPER_CLASS = [
  "relative",
  gmRadius["gm-radius-lg"],
  "overflow-hidden",
  "border",
  gmColors["gm-color-border-subtle"],
  gmColors["gm-color-surface-muted"],
  "aspect-video",
].join(" ");

const MEDIA_PLACEHOLDER_CLASS = [
  gmRadius["gm-radius-lg"],
  gmColors["gm-color-surface-muted"],
  gmColors["gm-color-border-subtle"],
  "border",
  "aspect-video",
  "flex",
  "items-center",
  "justify-center",
  gmColors["gm-color-text-muted"],
].join(" ");

const SPLIT_IMAGE_SIZES = "(min-width: 1280px) 40vw, (min-width: 768px) 60vw, 100vw";

export type SplitBlockProps = {
  block: SplitBlockData;
};

export function SplitBlock({ block }: SplitBlockProps) {
  const density: BlockDensity = block.density ?? "default";
  const layoutVariant = block.layoutVariant ?? "mediaRight";
  const isMediaLeft = layoutVariant === "mediaLeft";

  const headlineClass = resolveTypographyToken(
    block.headingStyle,
    "gm-typography-section-heading",
    "SplitBlock.heading",
  );
  const bodyClass = resolveTypographyToken(
    block.bodyStyle,
    "gm-typography-body-base",
    "SplitBlock.body",
  );
  const eyebrowClass = resolveTypographyToken(
    "gm-typography-label-xs",
    "gm-typography-label-xs",
    "SplitBlock.eyebrow",
  );

  const textStack = resolveSpacingToken(
    block.textStackToken,
    "gm-spacing-relaxed-stack",
    density,
    "SplitBlock.text",
  );
  const bodyStack = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "SplitBlock.bodyStack",
  );
  const pointStack = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "SplitBlock.pointStack",
  );
  const pointContentStack = resolveSpacingToken(
    "gm-spacing-tight-stack",
    "gm-spacing-tight-stack",
    density,
    "SplitBlock.pointContent",
  );
  const gridGap = resolveSpacingToken(
    "gm-spacing-grid-relaxed",
    "gm-spacing-grid-relaxed",
    density,
    "SplitBlock.grid",
  );
  const borderAccent = resolveSpacingToken(
    "gm-spacing-border-accent",
    "gm-spacing-border-accent",
    density,
    "SplitBlock.border",
  );
  const indentSpacing = resolveSpacingToken(
    "gm-spacing-indent",
    "gm-spacing-indent",
    density,
    "SplitBlock.indent",
  );

  const points = Array.isArray(block.points)
    ? block.points.filter((point) => point?.title || point?.body)
    : [];
  const bodyValue = Array.isArray(block.body) && block.body.length > 0 ? (block.body as PortableTextValue) : null;

  return (
    <div className={["grid", "items-center", "gap-y-10", gridGap, "md:grid-cols-2"].join(" ")}>
      <div
        className={[
          textStack,
          isMediaLeft ? "md:order-2" : "md:order-1",
        ].join(" ")}
      >
        {block.eyebrow ? (
          <p className={[eyebrowClass, gmColors["gm-color-text-subtle"], "uppercase"].join(" ")}>
            {block.eyebrow}
          </p>
        ) : null}
        {block.headline ? <h2 className={headlineClass}>{block.headline}</h2> : null}
        {bodyValue ? (
          <div className={[bodyStack, bodyClass, gmColors["gm-color-text-secondary"]].join(" ")}>
            <PortableText value={bodyValue} components={portableTextComponents} />
          </div>
        ) : null}
        {points.length > 0 ? (
          <div className={pointStack}>
            {points.map((point) => (
              <div
                key={point._key ?? point.title}
                className={[
                  pointContentStack,
                  gmColors["gm-color-text-primary"],
                  borderAccent,
                  gmColors["gm-color-border-accent"],
                  indentSpacing,
                ].join(" ")}
              >
                {point.title ? (
                  <h3 className={resolveTypographyToken(
                    "gm-typography-subheading",
                    "gm-typography-subheading",
                    "SplitBlock.pointHeading",
                  )}>
                    {point.title}
                  </h3>
                ) : null}
                {point.body ? (
                  <p className={[bodyClass, gmColors["gm-color-text-muted"]].join(" ")}>
                    {point.body}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className={isMediaLeft ? "md:order-1" : "md:order-2"}>
        <SplitMediaContent media={block.media} altFallback={block.headline} />
      </div>
    </div>
  );
}

type SplitMediaContentProps = {
  media?: SplitMedia | null;
  altFallback?: string;
};

function SplitMediaContent({ media, altFallback }: SplitMediaContentProps) {
  if (!media) {
    return <div className={MEDIA_PLACEHOLDER_CLASS}>Add media</div>;
  }

  const image =
    buildSanityImage(media, {
      quality: 80,
      fit: "fillmax",
    }) ?? (media.imageUrl ? { url: media.imageUrl } : null);

  if (!image?.url) {
    return <div className={MEDIA_PLACEHOLDER_CLASS}>{altFallback ?? media.alt ?? "Add media"}</div>;
  }

  const altText = media.alt || altFallback || "Illustration";

  return (
    <div className={MEDIA_WRAPPER_CLASS}>
      <Image
        src={image.url}
        alt={altText}
        fill
        className="h-full w-full object-cover"
        sizes={SPLIT_IMAGE_SIZES}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
