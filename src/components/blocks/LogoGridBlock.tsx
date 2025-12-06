import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import Image from "next/image";
import Link from "next/link";

import { portableTextComponents } from "@/components/portableText/components";
import type { BlockDensity, BlockTheme, BlockThemeSettings, SanityBlock } from "@/lib/sanity/types";
import { buildSanityImage } from "@/lib/sanity/images";
import { gmColors, gmRadius } from "@/styles/designTokens";

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

type LogoGridItem = {
  _key?: string;
  image?: (SanityImageSource & { alt?: string | null }) | null;
  href?: string | null;
};

export type LogoGridBlockData = SanityBlock & {
  _type: "logoGridBlock";
  eyebrow?: string;
  headline?: string;
  intro?: PortableTextValue;
  headingStyle?: string;
  bodyStyle?: string;
  gridSpacingToken?: string;
  logos?: LogoGridItem[];
  density?: BlockDensity;
  theme?: BlockTheme | BlockThemeSettings;
  backgroundTheme?: BlockTheme;
};

export type LogoGridBlockProps = {
  block: LogoGridBlockData;
};

const GRID_COLUMN_CLASSES = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8";

export function LogoGridBlock({ block }: LogoGridBlockProps) {
  const density: BlockDensity = block.density ?? "default";
  const tileTheme: BlockTheme = (() => {
    if (!block.theme) {
      return "light";
    }
    if (typeof block.theme === "string") {
      return block.theme;
    }
    const candidate = block.theme.content ?? block.theme.background;
    return (candidate ?? "light") as BlockTheme;
  })();
  const tileBackgroundClass =
    tileTheme === "light"
      ? "bg-white"
      : tileTheme === "dark"
      ? "bg-white/10"
      : tileTheme === "brand"
      ? "bg-white/70"
      : gmColors["gm-color-surface-muted"];

  const sectionStack = resolveSpacingToken(
    "gm-spacing-shell-stack",
    "gm-spacing-shell-stack",
    density,
    "LogoGrid.section",
  );
  const headerStack = resolveSpacingToken(
    "gm-spacing-relaxed-stack",
    "gm-spacing-relaxed-stack",
    density,
    "LogoGrid.header",
  );
  const introStack = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "LogoGrid.intro",
  );
  const gridGap = resolveSpacingToken(
    block.gridSpacingToken,
    "gm-spacing-grid-tight",
    density,
    "LogoGrid.grid",
  );
  const tilePadding = resolveSpacingToken(
    "gm-spacing-card",
    "gm-spacing-card",
    density,
    "LogoGrid.tilePadding",
  );

  const headingClass = resolveTypographyToken(
    block.headingStyle,
    "gm-typography-section-heading",
    "LogoGrid.heading",
  );
  const bodyClass = resolveTypographyToken(
    block.bodyStyle,
    "gm-typography-body-base",
    "LogoGrid.body",
  );
  const eyebrowClass = resolveTypographyToken(
    "gm-typography-label-xs",
    "gm-typography-label-xs",
    "LogoGrid.eyebrow",
  );

  const introValue = normalizePortableTextValue(block.intro);
  const logos = Array.isArray(block.logos)
    ? block.logos.filter((logo): logo is LogoGridItem => Boolean(logo?.image))
    : [];

  if (logos.length === 0) {
    return null;
  }

  const hasHeaderContent = Boolean(block.eyebrow || block.headline || introValue);

  return (
    <div className={sectionStack}>
      {hasHeaderContent ? (
        <header className={[headerStack, "text-center"].join(" ")}>
          {block.eyebrow ? (
            <p className={[eyebrowClass, gmColors["gm-color-text-subtle"], "uppercase"].join(" ")}>
              {block.eyebrow}
            </p>
          ) : null}
          {block.headline ? <h2 className={headingClass}>{block.headline}</h2> : null}
          {introValue ? (
            <div className={[introStack, bodyClass, gmColors["gm-color-text-muted"]].join(" ")}>
              <PortableText value={introValue} components={portableTextComponents} />
            </div>
          ) : null}
        </header>
      ) : null}
      <div className={["grid", GRID_COLUMN_CLASSES, gridGap].join(" ")}>
        {logos.map((logo, index) => {
          const logoKey = logo._key ?? `logo-${index}`;
          const image = buildSanityImage(logo.image ?? null, { width: 320, fit: "max" });
          const explicitAlt =
            logo.image && typeof logo.image === "object" && "alt" in logo.image
              ? (logo.image as { alt?: string | null }).alt ?? undefined
              : undefined;
          const altText = explicitAlt ?? block.headline ?? "Logo";

          const content = (
            <div
              className={[
                tilePadding,
                gmRadius["gm-radius-md"],
                tileBackgroundClass,
                "flex items-center justify-center",
                "transition-colors",
                logo?.href ? gmColors["gm-color-hover-surface-tint"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {image ? (
                <Image
                  src={image.url}
                  alt={altText}
                  width={image.width ?? 320}
                  height={image.height ?? Math.round((image.width ?? 320) / (image.aspectRatio ?? 2))}
                  className="h-8 w-auto max-w-full object-contain sm:h-10 lg:h-12"
                />
              ) : null}
            </div>
          );

          if (logo?.href) {
            return (
              <Link key={logoKey} href={logo.href} className="block focus-ring-token">
                {content}
              </Link>
            );
          }

          return (
            <div key={logoKey} className="block">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
