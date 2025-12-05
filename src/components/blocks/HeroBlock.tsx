import { PortableText } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import Image from "next/image";
import Link from "next/link";

import { portableTextComponents } from "@/components/portableText/components";
import { buildSanityImage } from "@/lib/sanity/images";
import type { BlockDensity, BlockTheme, SanityBlock } from "@/lib/sanity/types";
import { gmColors, gmRadius } from "@/styles/designTokens";
import { getButtonClassName } from "@/styles/buttons";

import { resolveSpacingToken, resolveTypographyToken } from "./tokenUtils";

type HeroBlockAction = {
  _key?: string;
  label?: string;
  href?: string;
  isPrimary?: boolean;
};

type HeroBackgroundMedia = (SanityImageSource & { alt?: string | null; imageUrl?: string | null }) | null;

export type HeroBlockData = SanityBlock & {
  _type: "heroBlock";
  eyebrow?: string;
  headline?: string;
  headlineLineOne?: string | null;
  headlineLineTwo?: string | null;
  tagline?: string;
  body?: SanityBlock[];
  actions?: HeroBlockAction[];
  headingStyle?: string;
  bodyStyle?: string;
  contentSpacing?: string;
  backgroundMedia?: HeroBackgroundMedia;
  centerpieceMedia?: HeroBackgroundMedia;
  density?: BlockDensity;
  theme?: BlockTheme;
};

export type HeroBlockProps = {
  block: HeroBlockData;
};

export function HeroBlock({ block }: HeroBlockProps) {
  const density: BlockDensity = block.density ?? "default";

  const headingClass = resolveTypographyToken(
    block.headingStyle,
    "gm-typography-hero-heading",
    "HeroBlock.heading",
  );
  const bodyClass = resolveTypographyToken(
    block.bodyStyle,
    "gm-typography-body-base",
    "HeroBlock.body",
  );
  const eyebrowClass = resolveTypographyToken(
    "gm-typography-label-xs",
    "gm-typography-label-xs",
    "HeroBlock.eyebrow",
  );
  const contentStack = resolveSpacingToken(
    block.contentSpacing,
    "gm-spacing-relaxed-stack",
    density,
    "HeroBlock.content",
  );
  const headerStack = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "HeroBlock.header",
  );
  const bodyStack = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "HeroBlock.bodyStack",
  );
  const actionsGap = resolveSpacingToken(
    "gm-spacing-grid",
    "gm-spacing-grid",
    density,
    "HeroBlock.actions",
  );

  const actions = Array.isArray(block.actions)
    ? block.actions.filter((action) => action?.label && action?.href)
    : [];

  const primaryCtaClass = getButtonClassName("primary");
  const secondaryCtaClass = getButtonClassName("secondary");

  const backgroundMedia = block.backgroundMedia ?? null;
  const builtBackground = backgroundMedia
    ? buildSanityImage(backgroundMedia, {
        width: 2400,
        quality: 80,
      })
    : null;
  const backgroundUrlCandidate =
    builtBackground?.url ??
    (backgroundMedia && typeof backgroundMedia === "object" && "imageUrl" in backgroundMedia
      ? (backgroundMedia.imageUrl as string | undefined)
      : undefined);
  const backgroundUrl =
    typeof backgroundUrlCandidate === "string" && backgroundUrlCandidate.length > 0
      ? backgroundUrlCandidate
      : null;
  const shouldRenderBackground = Boolean(backgroundUrl);

  const centerpieceMedia = block.centerpieceMedia ?? null;
  const builtCenterpiece = centerpieceMedia
    ? buildSanityImage(centerpieceMedia, {
        width: 1024,
        quality: 90,
      })
    : null;
  const centerpieceUrlCandidate =
    builtCenterpiece?.url ??
    (centerpieceMedia && typeof centerpieceMedia === "object" && "imageUrl" in centerpieceMedia
      ? (centerpieceMedia.imageUrl as string | undefined)
      : undefined);
  const centerpieceUrl =
    typeof centerpieceUrlCandidate === "string" && centerpieceUrlCandidate.length > 0
      ? centerpieceUrlCandidate
      : null;
  const shouldRenderCenterpiece = Boolean(centerpieceUrl);
  const centerpieceAlt = (centerpieceMedia?.alt ?? "").trim();
  const isCenterpieceDecorative = centerpieceAlt.length === 0;
  const centerpieceWidth = builtCenterpiece?.width ?? 512;
  const centerpieceHeight = builtCenterpiece?.height ?? 512;
  const rawHeadline = block.headline ?? "";
  const headlineSegments = rawHeadline
    ? rawHeadline
        .split(/\r?\n+/)
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0)
    : [];
  const fallbackLineOne = headlineSegments[0] ?? rawHeadline.trim();
  const headlineLineOne = (block.headlineLineOne ?? "").trim() || fallbackLineOne;
  const headlineLineTwo =
    (block.headlineLineTwo ?? "").trim() ||
    (headlineSegments.length > 1 ? headlineSegments.slice(1).join("\n") : "");
  const hasHeadlineLineOne = headlineLineOne.length > 0;
  const hasHeadlineLineTwo = headlineLineTwo.length > 0;
  const shouldRenderStylizedHeadline = shouldRenderCenterpiece && hasHeadlineLineOne && hasHeadlineLineTwo;
  const plainHeadline =
    rawHeadline ||
    [headlineLineOne, headlineLineTwo]
      .filter((line) => line && line.length > 0)
      .join("\n");

  const cardPadding = resolveSpacingToken(
    "gm-spacing-hero-card",
    "gm-spacing-hero-card",
    density,
    "HeroBlock.cardPadding",
  );

  const cardBackgroundClass = shouldRenderBackground ? "bg-background" : gmColors["gm-color-surface-tint"];

  return (
    <div
      className={[
        "relative isolate w-full",
        gmRadius["gm-radius-xl"],
        "overflow-hidden",
        cardBackgroundClass,
      ].join(" ")}
    >
      {shouldRenderBackground ? (
        <>
          <div className="absolute inset-0 z-0">
            <Image
              src={backgroundUrl!}
              alt={backgroundMedia?.alt ?? ""}
              fill
              className="h-full w-full object-cover"
              sizes="(min-width: 1280px) 1152px, (min-width: 768px) 90vw, 100vw"
            />
          </div>
          <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm" aria-hidden="true" />
        </>
      ) : null}
      <div
        className={[
          contentStack,
          cardPadding,
          "relative z-20 mx-auto flex w-full max-w-6xl flex-col items-center text-center",
        ].join(" ")}
      >
        <header className={[headerStack, "w-full"].join(" ")}>
          {block.eyebrow ? (
            <p className={[eyebrowClass, gmColors["gm-color-text-subtle"], "uppercase"].join(" ")}>
              {block.eyebrow}
            </p>
          ) : null}
          {shouldRenderStylizedHeadline ? (
            <h1
              className={[
                headingClass,
                "relative flex min-h-[11rem] flex-col items-center text-center sm:min-h-[13rem] lg:min-h-[16rem]",
              ].join(" ")}
            >
              <span className="relative z-0 block leading-none -mb-10 sm:-mb-12 lg:-mb-16">{headlineLineOne}</span>
              <span
                className={[
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "flex items-center justify-center",
                  "h-44 w-44 sm:h-52 sm:w-52 lg:h-64 lg:w-64",
                  "z-10",
                  isCenterpieceDecorative ? "pointer-events-none" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden={isCenterpieceDecorative ? true : undefined}
              >
                <Image
                  src={centerpieceUrl!}
                  alt={centerpieceAlt}
                  aria-hidden={isCenterpieceDecorative ? true : undefined}
                  width={centerpieceWidth}
                  height={centerpieceHeight}
                  className="h-full w-full object-contain"
                  sizes="(min-width: 1280px) 16rem, (min-width: 768px) 13rem, 11rem"
                />
              </span>
              <span className="relative z-20 block -mt-10 sm:-mt-12 lg:-mt-16 leading-none whitespace-pre-line">
                {headlineLineTwo}
              </span>
            </h1>
          ) : (
            <h1 className={[headingClass, "whitespace-pre-line"].join(" ")}>{plainHeadline}</h1>
          )}
          {block.tagline ? (
            <p className={[bodyClass, gmColors["gm-color-text-muted"], "mx-auto max-w-3xl"].join(" ")}>
              {block.tagline}
            </p>
          ) : null}
        </header>
        {Array.isArray(block.body) && block.body.length > 0 ? (
          <div
            className={[
              bodyStack,
              bodyClass,
              gmColors["gm-color-text-secondary"],
              "mx-auto max-w-3xl",
            ].join(" ")}
          >
            <PortableText value={block.body} components={portableTextComponents} />
          </div>
        ) : null}
        {actions.length > 0 ? (
          <div className={["flex flex-wrap items-center justify-center", actionsGap].join(" ")}>
            {actions.map((action) => {
              const className = (action.isPrimary ?? true) ? primaryCtaClass : secondaryCtaClass;

              return (
                <Link key={action._key ?? action.label} href={action.href ?? "#"} className={className}>
                  {action.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
