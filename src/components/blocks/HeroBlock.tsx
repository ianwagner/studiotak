import { PortableText } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { portableTextComponents } from "@/components/portableText/components";
import { buildSanityFileUrl } from "@/lib/sanity/files";
import { buildSanityImage } from "@/lib/sanity/images";
import type { HeroMedia } from "@/lib/sanity/pageViews";
import type { BlockDensity, BlockTheme, BlockThemeSettings, SanityBlock } from "@/lib/sanity/types";
import { blockThemeVariables, gmColors, gmRadius } from "@/styles/designTokens";
import { getButtonClassName } from "@/styles/buttons";

import { resolveSpacingToken, resolveTypographyToken } from "./tokenUtils";

type HeroBlockAction = {
  _key?: string;
  label?: string;
  href?: string;
  isPrimary?: boolean;
  buttonTheme?: BlockTheme | "inherit" | null;
};

function normalizeHexColor(input?: string | null): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const match = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) {
    return null;
  }

  let hex = match[1];
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  return `#${hex.toLowerCase()}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex);
  if (!normalized) {
    return "";
  }

  const value = normalized.slice(1);
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const clampedAlpha = Math.min(Math.max(alpha, 0), 1);

  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function resolveBlockContentTheme(theme?: BlockTheme | BlockThemeSettings | null): BlockTheme {
  if (!theme) {
    return "light";
  }

  if (typeof theme === "string") {
    return theme;
  }

  return (theme.content ?? theme.background ?? "light") as BlockTheme;
}

function resolveActionButtonTheme(
  override: BlockTheme | "inherit" | null | undefined,
  fallback: BlockTheme,
): BlockTheme {
  if (!override || override === "inherit") {
    return fallback;
  }

  if (override === "light" || override === "dark" || override === "brand" || override === "system") {
    return override;
  }

  return fallback;
}

type NormalizedHeroImageMedia = {
  kind: "image";
  image: (SanityImageSource & { alt?: string | null; imageUrl?: string | null }) | null;
  alt: string;
};

type NormalizedHeroVideoMedia = {
  kind: "video";
  video: {
    asset?: { _ref?: string; url?: string | null } | string | null;
    _ref?: string;
    url?: string | null;
    alt?: string | null;
  } | null;
  posterImage: (SanityImageSource & { alt?: string | null }) | null;
  alt: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  playsInline: boolean;
};

type NormalizedHeroMedia = NormalizedHeroImageMedia | NormalizedHeroVideoMedia;

function extractAlt(input: unknown): string {
  if (!input || typeof input !== "object") {
    return "";
  }

  const alt = (input as { alt?: unknown }).alt;
  return typeof alt === "string" ? alt.trim() : "";
}

function normalizeHeroMedia(
  raw:
    | HeroMedia
    | (SanityImageSource & { alt?: string | null; imageUrl?: string | null })
    | null
    | undefined,
): NormalizedHeroMedia | null {
  if (!raw) {
    return null;
  }

  if (typeof raw === "object" && raw !== null && "kind" in raw) {
    const kind = raw.kind === "video" ? "video" : "image";

    if (kind === "video") {
      const autoplay = typeof raw.autoplay === "boolean" ? raw.autoplay : true;
      const muted = typeof raw.muted === "boolean" ? raw.muted : true;
      const loop = typeof raw.loop === "boolean" ? raw.loop : true;
      const playsInline = typeof raw.playsInline === "boolean" ? raw.playsInline : true;
      const video = raw.video ?? null;
      const alt = extractAlt(raw) || extractAlt(video);

      return {
        kind: "video",
        video,
        posterImage: raw.posterImage ?? null,
        alt,
        autoplay,
        muted,
        loop,
        playsInline,
      };
    }

    const image = (raw.image ??
      null) as (SanityImageSource & { alt?: string | null; imageUrl?: string | null }) | null;
    const alt = extractAlt(image) || extractAlt(raw);

    return {
      kind: "image",
      image,
      alt,
    };
  }

  if (typeof raw === "object" && raw !== null && "asset" in raw) {
    const image = raw as SanityImageSource & { alt?: string | null; imageUrl?: string | null };

    return {
      kind: "image",
      image,
      alt: extractAlt(image),
    };
  }

  return null;
}

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
  backgroundMedia?:
    | HeroMedia
    | (SanityImageSource & { alt?: string | null; imageUrl?: string | null })
    | null;
  centerpieceMedia?:
    | HeroMedia
    | (SanityImageSource & { alt?: string | null; imageUrl?: string | null })
    | null;
  backgroundColor?: string | null;
  backgroundImageOpacity?: number | null;
  backgroundImageBlur?: number | null;
  density?: BlockDensity;
  theme?: BlockTheme | BlockThemeSettings;
  backgroundTheme?: BlockTheme;
};

export type HeroBlockProps = {
  block: HeroBlockData;
};

export function HeroBlock({ block }: HeroBlockProps) {
  const density: BlockDensity = block.density ?? "default";
  const contentTheme = resolveBlockContentTheme(block.theme);

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

  const normalizedBackgroundMedia = normalizeHeroMedia(block.backgroundMedia);
  const isBackgroundVideo = normalizedBackgroundMedia?.kind === "video";
  const backgroundImage =
    normalizedBackgroundMedia?.kind === "image" ? normalizedBackgroundMedia.image : null;
  const builtBackgroundImage = backgroundImage
    ? buildSanityImage(backgroundImage, {
        width: 2400,
        quality: 80,
      })
    : null;
  const backgroundImageUrlCandidate =
    builtBackgroundImage?.url ??
    (backgroundImage && typeof backgroundImage === "object" && "imageUrl" in backgroundImage
      ? (backgroundImage.imageUrl as string | undefined)
      : undefined);
  const backgroundVideoUrl =
    isBackgroundVideo && normalizedBackgroundMedia?.video
      ? buildSanityFileUrl(normalizedBackgroundMedia.video)
      : null;
  const backgroundPosterImage =
    isBackgroundVideo && normalizedBackgroundMedia?.posterImage
      ? buildSanityImage(normalizedBackgroundMedia.posterImage, {
          width: 2400,
          quality: 70,
        })
      : null;
  const backgroundImageUrl =
    typeof backgroundImageUrlCandidate === "string" && backgroundImageUrlCandidate.length > 0
      ? backgroundImageUrlCandidate
      : null;
  const shouldRenderBackground = isBackgroundVideo
    ? Boolean(backgroundVideoUrl)
    : Boolean(backgroundImageUrl);
  const backgroundAlt =
    normalizedBackgroundMedia?.kind === "image" ? normalizedBackgroundMedia.alt ?? "" : "";
  const backgroundVideoMedia =
    normalizedBackgroundMedia?.kind === "video" ? normalizedBackgroundMedia : null;

  const centerpieceMedia = normalizeHeroMedia(block.centerpieceMedia);
  const isCenterpieceVideo = centerpieceMedia?.kind === "video";
  const centerpieceImage = centerpieceMedia?.kind === "image" ? centerpieceMedia.image : null;
  const builtCenterpieceImage = centerpieceImage
    ? buildSanityImage(centerpieceImage, {
        width: 1024,
        quality: 90,
      })
    : null;
  const centerpieceImageUrlCandidate =
    builtCenterpieceImage?.url ??
    (centerpieceImage && typeof centerpieceImage === "object" && "imageUrl" in centerpieceImage
      ? (centerpieceImage.imageUrl as string | undefined)
      : undefined);
  const centerpieceVideoUrl =
    isCenterpieceVideo && centerpieceMedia?.video ? buildSanityFileUrl(centerpieceMedia.video) : null;
  const centerpiecePosterImage =
    isCenterpieceVideo && centerpieceMedia?.posterImage
      ? buildSanityImage(centerpieceMedia.posterImage, {
          width: 1024,
          quality: 85,
        })
      : null;
  const centerpieceImageUrl =
    typeof centerpieceImageUrlCandidate === "string" && centerpieceImageUrlCandidate.length > 0
      ? centerpieceImageUrlCandidate
      : null;
  const shouldRenderCenterpiece = isCenterpieceVideo
    ? Boolean(centerpieceVideoUrl)
    : Boolean(centerpieceImageUrl);
  const centerpieceAlt = (centerpieceMedia?.alt ?? "").trim();
  const isCenterpieceDecorative = centerpieceAlt.length === 0;
  const centerpieceWidth = builtCenterpieceImage?.width ?? centerpiecePosterImage?.width ?? 512;
  const centerpieceHeight = builtCenterpieceImage?.height ?? centerpiecePosterImage?.height ?? 512;
  const centerpieceVideoMedia = centerpieceMedia?.kind === "video" ? centerpieceMedia : null;
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
  const normalizedLineOneLength = headlineLineOne.replace(/\s+/g, "").length;
  const isLineOneLong = normalizedLineOneLength > 14;
  const shouldRenderStylizedHeadline = shouldRenderCenterpiece && hasHeadlineLineOne;
  const iconTopPercent = hasHeadlineLineTwo
    ? isLineOneLong
      ? 44
      : 46
    : isLineOneLong
      ? 60
      : 56;
  const headlineMinHeightClass = hasHeadlineLineTwo
    ? "min-h-[13rem] sm:min-h-[17rem] lg:min-h-[21rem]"
    : "min-h-[10rem] sm:min-h-[13rem] lg:min-h-[17rem]";
  const lineOneShiftClass = hasHeadlineLineTwo
    ? isLineOneLong
      ? "-translate-y-8 sm:-translate-y-10 lg:-translate-y-12"
      : "-translate-y-7 sm:-translate-y-9 lg:-translate-y-11"
    : isLineOneLong
      ? "-translate-y-6 sm:-translate-y-8 lg:-translate-y-10"
      : "-translate-y-4 sm:-translate-y-6 lg:-translate-y-8";
  const lineTwoShiftClass = hasHeadlineLineTwo
    ? isLineOneLong
      ? "translate-y-4 sm:translate-y-6 lg:translate-y-8"
      : "translate-y-3 sm:translate-y-5 lg:translate-y-7"
    : "";
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

  const normalizedBackgroundColor = normalizeHexColor(block.backgroundColor) || undefined;
  const hasCustomBackgroundColor = Boolean(normalizedBackgroundColor);

  const rawOpacity = typeof block.backgroundImageOpacity === "number" ? block.backgroundImageOpacity : null;
  const normalizedOpacity = rawOpacity !== null ? clampNumber(rawOpacity, 0, 100) / 100 : 1;

  const rawBlur = typeof block.backgroundImageBlur === "number" ? block.backgroundImageBlur : null;
  const normalizedBlur = rawBlur !== null ? clampNumber(rawBlur, 0, 40) : 0;

  const containerStyle: CSSProperties | undefined = hasCustomBackgroundColor
    ? { backgroundColor: normalizedBackgroundColor! }
    : undefined;

  const imageStyle: CSSProperties = {
    opacity: normalizedOpacity,
  };

  if (normalizedBlur > 0) {
    imageStyle.filter = `blur(${normalizedBlur}px)`;
    imageStyle.transform = "scale(1.05)";
    imageStyle.transformOrigin = "center";
  }

  let overlayStyle: CSSProperties | undefined;
  let shouldRenderOverlay = false;

  if (normalizedBlur > 0) {
    overlayStyle = {
      backdropFilter: `blur(${normalizedBlur}px)`,
      WebkitBackdropFilter: `blur(${normalizedBlur}px)`,
    };
    shouldRenderOverlay = true;
  }

  if (normalizedBackgroundColor) {
    const overlayAlpha = clampNumber(1 - normalizedOpacity, 0, 0.85);
    if (overlayAlpha > 0) {
      overlayStyle = {
        ...(overlayStyle ?? {}),
        backgroundColor: hexToRgba(normalizedBackgroundColor, overlayAlpha),
      };
      shouldRenderOverlay = true;
    }
  }

  if (shouldRenderOverlay && !overlayStyle) {
    overlayStyle = {};
  }

  const cardBackgroundClass =
    shouldRenderBackground || hasCustomBackgroundColor ? "" : gmColors["gm-color-surface-tint"];

  return (
    <div
      className={[
        "relative isolate w-full",
        gmRadius["gm-radius-xl"],
        "overflow-hidden",
        cardBackgroundClass,
      ].join(" ")}
      style={containerStyle}
    >
      {shouldRenderBackground ? (
        <>
          <div className="absolute inset-0 z-0">
            {isBackgroundVideo && backgroundVideoUrl ? (
              <video
                className="h-full w-full object-cover"
                src={backgroundVideoUrl}
                poster={backgroundPosterImage?.url}
                autoPlay={backgroundVideoMedia?.autoplay ?? true}
                muted={backgroundVideoMedia?.muted ?? true}
                loop={backgroundVideoMedia?.loop ?? true}
                playsInline={backgroundVideoMedia?.playsInline ?? true}
                style={imageStyle}
                aria-hidden="true"
              />
            ) : backgroundImageUrl ? (
              <Image
                src={backgroundImageUrl}
                alt={backgroundAlt}
                fill
                className="h-full w-full object-cover"
                style={imageStyle}
                sizes="(min-width: 1280px) 1152px, (min-width: 768px) 90vw, 100vw"
              />
            ) : null}
          </div>
          {shouldRenderOverlay ? (
            <div className="absolute inset-0 z-10" aria-hidden="true" style={overlayStyle} />
          ) : null}
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
                "relative grid place-items-center text-center",
                headlineMinHeightClass,
              ].join(" ")}
            >
              <span
                className={["relative z-0 block leading-none transform", lineOneShiftClass].join(" ")}
              >
                {headlineLineOne}
              </span>
              <span
                className={[
                  "absolute left-1/2 -translate-x-1/2 -translate-y-1/2",
                  "flex items-center justify-center",
                  "h-44 w-44 sm:h-52 sm:w-52 lg:h-64 lg:w-64",
                  "z-10",
                  isCenterpieceDecorative ? "pointer-events-none" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  top: `${iconTopPercent}%`,
                }}
                aria-hidden={isCenterpieceDecorative ? true : undefined}
              >
                {isCenterpieceVideo && centerpieceVideoUrl ? (
                  <video
                    className="h-full w-full object-contain"
                    src={centerpieceVideoUrl}
                    poster={centerpiecePosterImage?.url}
                    autoPlay={centerpieceVideoMedia?.autoplay ?? true}
                    muted={centerpieceVideoMedia?.muted ?? true}
                    loop={centerpieceVideoMedia?.loop ?? true}
                    playsInline={centerpieceVideoMedia?.playsInline ?? true}
                    aria-hidden={isCenterpieceDecorative ? true : undefined}
                    aria-label={isCenterpieceDecorative ? undefined : centerpieceAlt}
                  />
                ) : centerpieceImageUrl ? (
                  <Image
                    src={centerpieceImageUrl}
                    alt={centerpieceAlt}
                    aria-hidden={isCenterpieceDecorative ? true : undefined}
                    width={centerpieceWidth}
                    height={centerpieceHeight}
                    className="h-full w-full object-contain"
                    sizes="(min-width: 1280px) 16rem, (min-width: 768px) 13rem, 11rem"
                  />
                ) : null}
              </span>
              {hasHeadlineLineTwo ? (
                <span
                  className={[
                    "relative z-20 block leading-none whitespace-pre-line transform",
                    lineTwoShiftClass,
                  ].join(" ")}
                >
                  {headlineLineTwo}
                </span>
              ) : null}
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
              const buttonTheme = resolveActionButtonTheme(action.buttonTheme, contentTheme);
              const themeVariables = blockThemeVariables[buttonTheme];
              const buttonStyle: CSSProperties = {
                "--foreground": themeVariables["--foreground"],
                "--color-foreground": themeVariables["--foreground"],
                "--background": themeVariables["--background"],
                "--color-background": themeVariables["--background"],
              } as CSSProperties;

              return (
                <Link
                  key={action._key ?? action.label}
                  href={action.href ?? "#"}
                  className={className}
                  style={buttonStyle}
                >
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
