import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Image from "next/image";
import Link from "next/link";

import { portableTextComponents } from "@/components/portableText/components";
import { buildSanityImage } from "@/lib/sanity/images";
import type { DisplayBlockView } from "@/lib/sanity/pageViews";
import type { BlockDensity, BlockTheme, BlockThemeSettings, SanityBlock } from "@/lib/sanity/types";
import { getButtonClassName } from "@/styles/buttons";
import { gmColors, gmRadius } from "@/styles/designTokens";

import { CustomCodeEmbed } from "./CustomCodeEmbed";
import { DisplayBlock } from "./DisplayBlock";
import { resolveSpacingToken, resolveTypographyToken } from "./tokenUtils";

type PortableTextValue = PortableTextBlock[];

function normalizePortableTextValue(value: unknown): PortableTextValue | null {
  if (!Array.isArray(value)) return null;
  const filtered = value.filter(
    (item): item is PortableTextBlock =>
      Boolean(item) && typeof item === "object" && "_type" in item && typeof (item as { _type: unknown })._type === "string",
  );
  return filtered.length > 0 ? filtered : null;
}

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

type SplitCustomMedia = {
  code?: string | null;
};

type SplitBlockCta = {
  label?: string;
  href?: string;
};

type SplitMediaMode = "media" | "custom" | "display";

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
  customMedia?: SplitCustomMedia | null;
  display?: DisplayBlockView | null;
  mediaMode?: SplitMediaMode | null;
  cta?: SplitBlockCta | null;
  density?: BlockDensity;
  theme?: BlockTheme | BlockThemeSettings;
  backgroundTheme?: BlockTheme;
};

const MEDIA_WRAPPER_CLASS = [
  "relative",
  "aspect-square",
  "w-full",
  "max-h-full",
  "max-w-full",
  "min-h-[16rem]",
  "min-w-[16rem]",
  gmRadius["gm-radius-lg"],
  "overflow-hidden",
].join(" ");

const MEDIA_PLACEHOLDER_CLASS = [
  "flex",
  "aspect-square",
  "w-full",
  "max-h-full",
  "max-w-full",
  "min-h-[16rem]",
  "min-w-[16rem]",
  "items-center",
  "justify-center",
  gmRadius["gm-radius-lg"],
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
    typeof block.headingStyle === "string" ? block.headingStyle : undefined,
    "gm-typography-section-heading",
    "SplitBlock.heading",
  );
  const bodyClass = resolveTypographyToken(
    typeof block.bodyStyle === "string" ? block.bodyStyle : undefined,
    "gm-typography-body-base",
    "SplitBlock.body",
  );
  const eyebrowClass = resolveTypographyToken(
    "gm-typography-label-xs",
    "gm-typography-label-xs",
    "SplitBlock.eyebrow",
  );

  const textStackToken = typeof block.textStackToken === "string" ? block.textStackToken : undefined;
  const textStack = resolveSpacingToken(textStackToken, "gm-spacing-relaxed-stack", density, "SplitBlock.text");
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
  const columnGap = density === "compact" ? "lg:gap-x-12" : "lg:gap-x-16";
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
  const bodyValue = normalizePortableTextValue(block.body);
  const cta = block.cta && typeof block.cta === "object" ? block.cta : null;
  const ctaLabel = typeof cta?.label === "string" ? cta.label.trim() : "";
  const ctaHref = typeof cta?.href === "string" ? cta.href : "";
  const hasCta = ctaLabel.length > 0 && ctaHref.length > 0;
  const ctaClassName = getButtonClassName("primary", ["self-start"]);

  const rootClasses = [
    "grid",
    "w-full",
    "gap-y-10",
    gridGap,
    columnGap,
    "items-start",
    "lg:grid-cols-2",
    "lg:items-stretch",
  ].join(" ");
  const textColumnClasses = [
    textStack,
    "flex",
    "h-full",
    "w-full",
    "flex-col",
    "justify-center",
    isMediaLeft ? "lg:order-2" : "lg:order-1",
  ].join(" ");
  const mediaColumnClasses = [
    "flex",
    "h-full",
    "w-full",
    "items-center",
    "justify-center",
    "overflow-hidden",
    isMediaLeft ? "lg:order-1" : "lg:order-2",
  ].join(" ");

  return (
    <div className={rootClasses}>
      <div className={textColumnClasses}>
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
        {hasCta ? (
          <Link href={ctaHref} className={ctaClassName}>
            {ctaLabel}
          </Link>
        ) : null}
      </div>
      <div className={mediaColumnClasses}>
        <SplitMediaContent
          media={block.media}
          customMedia={block.customMedia}
          display={block.display}
          mediaMode={block.mediaMode ?? null}
          altFallback={block.headline}
        />
      </div>
    </div>
  );
}

type SplitMediaContentProps = {
  media?: SplitMedia | null;
  customMedia?: SplitCustomMedia | null;
  display?: DisplayBlockView | null;
  mediaMode?: SplitMediaMode | null;
  altFallback?: string;
};

export function SplitMediaContent({ media, customMedia, display, mediaMode, altFallback }: SplitMediaContentProps) {
  const customCode = typeof customMedia?.code === "string" ? customMedia.code.trim() : "";
  const mode: SplitMediaMode =
    mediaMode ?? (display ? "display" : customCode ? "custom" : "media");

  if (mode === "custom") {
    if (customCode.length === 0) {
      return <div className={MEDIA_PLACEHOLDER_CLASS}>Add custom embed markup</div>;
    }

    return (
      <div className={MEDIA_WRAPPER_CLASS}>
        <CustomCodeEmbed code={customCode} />
      </div>
    );
  }

  if (mode === "display") {
    if (!display) {
      return <div className={MEDIA_PLACEHOLDER_CLASS}>Select a display set</div>;
    }

    return (
      <div className="w-full">
        <DisplayBlock block={display} variant="media" />
      </div>
    );
  }

  if (!media) {
    return <div className={MEDIA_PLACEHOLDER_CLASS}>Add media or custom embed</div>;
  }

  const image =
    buildSanityImage(media, {
      quality: 80,
      fit: "fillmax",
    }) ?? (media.imageUrl ? { url: media.imageUrl } : null);

  if (!image?.url) {
    return (
      <div className={MEDIA_PLACEHOLDER_CLASS}>
        {altFallback ?? media.alt ?? "Add media or custom embed"}
      </div>
    );
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
