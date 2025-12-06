import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Link from "next/link";

import { portableTextComponents } from "@/components/portableText/components";
import { getButtonClassName } from "@/styles/buttons";
import { gmColors } from "@/styles/designTokens";
import type { BlockDensity, SanityBlock } from "@/lib/sanity/types";

import type { SplitBlockData } from "./SplitBlock";
import { SplitMediaContent } from "./SplitBlock";
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

type ThirdsPoint = {
  _key?: string;
  title?: string;
  body?: string;
};

export type ThirdsBlockData = (SanityBlock & Omit<SplitBlockData, "_type" | "_key">) & {
  _type: "thirdsBlock";
};

export type ThirdsBlockProps = {
  block: ThirdsBlockData;
};

export function ThirdsBlock({ block }: ThirdsBlockProps) {
  const density = block.density ?? "default";
  const layoutVariant = block.layoutVariant ?? "mediaRight";
  const isMediaLeft = layoutVariant === "mediaLeft";

  const headlineClass = resolveTypographyToken(
    typeof block.headingStyle === "string" ? block.headingStyle : undefined,
    "gm-typography-section-heading",
    "ThirdsBlock.heading",
  );
  const bodyClass = resolveTypographyToken(
    typeof block.bodyStyle === "string" ? block.bodyStyle : undefined,
    "gm-typography-body-base",
    "ThirdsBlock.body",
  );
  const eyebrowClass = resolveTypographyToken(
    "gm-typography-label-xs",
    "gm-typography-label-xs",
    "ThirdsBlock.eyebrow",
  );

  const textStackToken = typeof block.textStackToken === "string" ? block.textStackToken : undefined;
  const safeDensity: BlockDensity = density && typeof density === "string" ? density : "default";
  const textStack = resolveSpacingToken(textStackToken, "gm-spacing-relaxed-stack", safeDensity, "ThirdsBlock.text");
  const bodyStack = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "ThirdsBlock.bodyStack",
  );
  const pointStack = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "ThirdsBlock.pointStack",
  );
  const pointContentStack = resolveSpacingToken(
    "gm-spacing-tight-stack",
    "gm-spacing-tight-stack",
    density,
    "ThirdsBlock.pointContent",
  );
  const gridGap = resolveSpacingToken(
    "gm-spacing-grid-relaxed",
    "gm-spacing-grid-relaxed",
    density,
    "ThirdsBlock.grid",
  );
  const columnGap = density === "compact" ? "lg:gap-x-12" : "lg:gap-x-16";
  const borderAccent = resolveSpacingToken(
    "gm-spacing-border-accent",
    "gm-spacing-border-accent",
    density,
    "ThirdsBlock.border",
  );
  const indentSpacing = resolveSpacingToken(
    "gm-spacing-indent",
    "gm-spacing-indent",
    density,
    "ThirdsBlock.indent",
  );

  const points = Array.isArray(block.points)
    ? (block.points as ThirdsPoint[]).filter((point) => point?.title || point?.body)
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
    "items-start",
    "gap-y-10",
    gridGap,
    columnGap,
    "lg:grid-cols-3",
    "lg:items-stretch",
  ].join(" ");
  const textColumnClasses = [
    textStack,
    "flex",
    "h-full",
    "w-full",
    "flex-col",
    "justify-center",
    "lg:col-span-2",
    isMediaLeft ? "lg:order-2" : "lg:order-1",
  ].join(" ");
  const mediaColumnClasses = [
    "hidden",
    "h-full",
    "w-full",
    "items-center",
    "justify-center",
    "overflow-hidden",
    "lg:col-span-1",
    "lg:flex",
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
                  <h3
                    className={resolveTypographyToken(
                      "gm-typography-subheading",
                      "gm-typography-subheading",
                      "ThirdsBlock.pointHeading",
                    )}
                  >
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
          altFallback={block.headline}
        />
      </div>
    </div>
  );
}
