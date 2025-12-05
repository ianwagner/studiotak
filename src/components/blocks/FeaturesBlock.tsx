import { PortableText } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import Image from "next/image";
import Link from "next/link";

import { portableTextComponents } from "@/components/portableText/components";
import type { BlockDensity, BlockTheme, BlockThemeSettings, SanityBlock } from "@/lib/sanity/types";
import { buildSanityImage } from "@/lib/sanity/images";
import { gmColors, gmRadius } from "@/styles/designTokens";

import { resolveSpacingToken, resolveTypographyToken } from "./tokenUtils";

type PortableTextValue = Array<Record<string, unknown>>;

type FeatureLink = {
  label?: string;
  href?: string;
};

type FeatureMedia = (SanityImageSource & { alt?: string | null }) | null;

type FeatureItem = {
  _key?: string;
  title?: string;
  body?: string;
  icon?: string;
  mediaDisplay?: "image" | "icon";
  link?: FeatureLink | null;
  media?: FeatureMedia;
};

export type FeaturesBlockData = SanityBlock & {
  _type: "featuresBlock";
  eyebrow?: string;
  headline?: string;
  intro?: PortableTextValue;
  headingStyle?: string;
  bodyStyle?: string;
  headerStackToken?: string;
  cardSpacingToken?: string;
  gridSpacingToken?: string;
  features?: FeatureItem[];
  density?: BlockDensity;
  theme?: BlockTheme | BlockThemeSettings;
  backgroundTheme?: BlockTheme;
};

const GRID_COLUMN_CLASSES = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

export type FeaturesBlockProps = {
  block: FeaturesBlockData;
};

export function FeaturesBlock({ block }: FeaturesBlockProps) {
  const density: BlockDensity = block.density ?? "default";

  const headingClass = resolveTypographyToken(
    block.headingStyle,
    "gm-typography-section-heading",
    "FeaturesBlock.heading",
  );
  const bodyClass = resolveTypographyToken(
    block.bodyStyle,
    "gm-typography-body-base",
    "FeaturesBlock.body",
  );
  const eyebrowClass = resolveTypographyToken(
    "gm-typography-label-xs",
    "gm-typography-label-xs",
    "FeaturesBlock.eyebrow",
  );

  const sectionStack = resolveSpacingToken(
    "gm-spacing-shell-stack",
    "gm-spacing-shell-stack",
    density,
    "FeaturesBlock.section",
  );
  const headerStack = resolveSpacingToken(
    block.headerStackToken,
    "gm-spacing-relaxed-stack",
    density,
    "FeaturesBlock.header",
  );
  const introStack = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "FeaturesBlock.intro",
  );
  const gridGap = resolveSpacingToken(
    block.gridSpacingToken,
    "gm-spacing-grid",
    density,
    "FeaturesBlock.grid",
  );
  const cardStack = resolveSpacingToken(
    block.cardSpacingToken,
    "gm-spacing-compact-stack",
    density,
    "FeaturesBlock.cardStack",
  );
  const cardPadding = resolveSpacingToken(
    "gm-spacing-card",
    "gm-spacing-card",
    density,
    "FeaturesBlock.cardPadding",
  );
  const pillSpacing = resolveSpacingToken(
    "gm-spacing-pill",
    "gm-spacing-pill",
    density,
    "FeaturesBlock.ctaSpacing",
  );

  const introValue = Array.isArray(block.intro) && block.intro.length > 0 ? (block.intro as PortableTextValue) : null;
  const features = Array.isArray(block.features) ? block.features.filter((feature) => feature?.title) : [];

  if (!block.headline && features.length === 0) {
    return null;
  }

  return (
    <div className={sectionStack}>
      <header className={headerStack}>
        {block.eyebrow ? (
          <p className={[eyebrowClass, gmColors["gm-color-text-subtle"], "uppercase"].join(" ")}>
            {block.eyebrow}
          </p>
        ) : null}
        {block.headline ? <h2 className={headingClass}>{block.headline}</h2> : null}
        {introValue ? (
          <div className={[introStack, bodyClass, gmColors["gm-color-text-secondary"]].join(" ")}>
            <PortableText value={introValue} components={portableTextComponents} />
          </div>
        ) : null}
      </header>
      {features.length > 0 ? (
        <div className={["grid", GRID_COLUMN_CLASSES, gridGap].join(" ")}>
          {features.map((feature) => {
            const mediaDisplay = feature.mediaDisplay === "icon" ? "icon" : "image";
            const isIconFeature = mediaDisplay === "icon";
            const featureHeadingClass = resolveTypographyToken(
              "gm-typography-block-heading",
              "gm-typography-block-heading",
              "FeaturesBlock.featureHeading",
            );
            const featureLabelClass = resolveTypographyToken(
              "gm-typography-label-xs",
              "gm-typography-label-xs",
              "FeaturesBlock.featureLabel",
            );

            const cardPaddingClass = isIconFeature ? "px-4 py-2 sm:py-3" : cardPadding;
            const textContentClasses = isIconFeature ? "px-4 text-center" : "";

            const cardClassName = [
              gmRadius["gm-radius-lg"],
              "border",
              gmColors["gm-color-border-subtle"],
              mediaDisplay === "icon"
                ? gmColors["gm-color-surface-raised"]
                : gmColors["gm-color-surface-muted"],
              cardPaddingClass,
              cardStack,
            ].join(" ");

            const featureMedia = feature.media
              ? buildSanityImage(feature.media, { width: mediaDisplay === "icon" ? 400 : 800 })
              : null;
            const featureMediaAlt = feature.media?.alt ?? feature.title ?? "";
            const featureMediaWidth = featureMedia?.width ?? (mediaDisplay === "icon" ? 400 : 1600);
            const featureMediaHeight = featureMedia?.height ?? (mediaDisplay === "icon" ? 400 : 900);

            const mediaWrapperClasses = [
              mediaDisplay === "icon" ? "flex items-center justify-center" : "overflow-hidden",
              mediaDisplay === "icon" ? null : gmRadius["gm-radius-md"],
            ]
              .filter(Boolean)
              .join(" ");

            const mediaImageStyle =
              mediaDisplay === "icon"
                ? {
                    width: "100%",
                    height: "auto",
                    maxWidth: "192px",
                    objectFit: "contain",
                  }
                : {
                    width: "100%",
                    height: "auto",
                  };

            return (
              <article key={feature._key ?? feature.title} className={cardClassName}>
                {featureMedia ? (
                  <div className={mediaWrapperClasses}>
                    <Image
                      src={featureMedia.url}
                      alt={featureMediaAlt}
                      width={featureMediaWidth}
                      height={featureMediaHeight}
                      sizes="(min-width: 1024px) 300px, (min-width: 768px) 45vw, 90vw"
                      style={mediaImageStyle}
                    />
                  </div>
                ) : null}
                {feature.icon ? (
                  <span
                    className={[gmColors["gm-color-text-accent"], featureLabelClass, textContentClasses]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {feature.icon}
                  </span>
                ) : null}
                {feature.title ? (
                  <h3 className={[featureHeadingClass, textContentClasses].filter(Boolean).join(" ")}>
                    {feature.title}
                  </h3>
                ) : null}
                {feature.body ? (
                  <p
                    className={[bodyClass, gmColors["gm-color-text-muted"], textContentClasses]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {feature.body}
                  </p>
                ) : null}
                {feature.link?.label && feature.link.href ? (
                  <Link
                    href={feature.link.href}
                    className={[
                      featureLabelClass,
                      gmColors["gm-color-text-accent"],
                      gmColors["gm-color-hover-surface-accent-soft"],
                      gmRadius["gm-radius-pill"],
                      pillSpacing,
                      "inline-flex",
                      "items-center",
                      "transition",
                      textContentClasses,
                      isIconFeature ? "justify-center" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {feature.link.label}
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
