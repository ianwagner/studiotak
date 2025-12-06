import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import Image from "next/image";
import Link from "next/link";

import { buildSanityImage } from "@/lib/sanity/images";
import type { BlockDensity, BlockTheme, BlockThemeSettings, SanityBlock } from "@/lib/sanity/types";
import { getButtonClassName } from "@/styles/buttons";
import { gmColors, gmRadius } from "@/styles/designTokens";

import { resolveSpacingToken, resolveTypographyToken } from "./tokenUtils";

type FooterCta = {
  label?: string;
  href?: string;
};

type FooterSocialLink = {
  _key?: string;
  label?: string;
  href?: string;
  icon?: (SanityImageSource & { alt?: string | null }) | null;
};

type FooterColumnLink = {
  _key?: string;
  label?: string;
  href?: string;
};

type FooterColumn = {
  _key?: string;
  title?: string;
  links?: FooterColumnLink[];
};

export type FooterBlockData = SanityBlock & {
  _type: "footerBlock";
  headline?: string;
  cta?: FooterCta | null;
  logo?: (SanityImageSource & { alt?: string | null }) | null;
  socialLinks?: FooterSocialLink[];
  columns?: FooterColumn[];
  backgroundImage?: (SanityImageSource & { alt?: string | null }) | null;
  headingStyle?: string;
  bodyStyle?: string;
  contentStackToken?: string;
  gridSpacingToken?: string;
  density?: BlockDensity;
  theme?: BlockTheme | BlockThemeSettings;
  backgroundTheme?: BlockTheme;
};

export type FooterBlockProps = {
  block: FooterBlockData;
};

type NormalizedLink = {
  key: string;
  label: string;
  href: string;
};

type NormalizedColumn = {
  key: string;
  title: string;
  links: NormalizedLink[];
};

type NormalizedSocialLink = {
  key: string;
  label: string;
  href: string;
  icon: ReturnType<typeof buildSanityImage>;
  alt: string;
};

function normalizeColumns(columns: FooterColumn[] | undefined): NormalizedColumn[] {
  if (!Array.isArray(columns)) {
    return [];
  }

  return columns
    .map<NormalizedColumn | null>((column, columnIndex) => {
      const title = typeof column?.title === "string" ? column.title.trim() : "";
      const linksSource = Array.isArray(column?.links) ? column.links : [];
      const links = linksSource
        .map<NormalizedLink | null>((link, linkIndex) => {
          const label = typeof link?.label === "string" ? link.label.trim() : "";
          const href = typeof link?.href === "string" ? link.href.trim() : "";

          if (!label || !href) {
            return null;
          }

          return {
            key: link?._key ?? `${column?._key ?? `column-${columnIndex}`}-link-${linkIndex}`,
            label,
            href,
          };
        })
        .filter((link): link is NormalizedLink => Boolean(link));

      if (!title || links.length === 0) {
        return null;
      }

      return {
        key: column?._key ?? `column-${columnIndex}`,
        title,
        links,
      };
    })
    .filter((column): column is NormalizedColumn => Boolean(column));
}

function normalizeSocialLinks(links: FooterSocialLink[] | undefined): NormalizedSocialLink[] {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .map<NormalizedSocialLink | null>((link, index) => {
      const label = typeof link?.label === "string" ? link.label.trim() : "";
      const href = typeof link?.href === "string" ? link.href.trim() : "";

      if (!label || !href) {
        return null;
      }

      const iconImage = buildSanityImage(link?.icon ?? null, { width: 96, height: 96, fit: "max" });
      const iconAlt =
        link?.icon && typeof link.icon === "object" && "alt" in link.icon && typeof link.icon.alt === "string"
          ? link.icon.alt.trim()
          : "";

      return {
        key: link?._key ?? `social-${index}`,
        label,
        href,
        icon: iconImage,
        alt: iconAlt,
      };
    })
    .filter((link): link is NormalizedSocialLink => Boolean(link));
}

export function FooterBlock({ block }: FooterBlockProps) {
  const density: BlockDensity = block.density ?? "default";
  const headingClass = resolveTypographyToken(
    typeof block.headingStyle === "string" ? block.headingStyle : undefined,
    "gm-typography-section-heading",
    "FooterBlock.heading",
  );
  const bodyClass = resolveTypographyToken(
    typeof block.bodyStyle === "string" ? block.bodyStyle : undefined,
    "gm-typography-body-base",
    "FooterBlock.body",
  );
  const columnHeadingClass = resolveTypographyToken(
    "gm-typography-label-xs",
    "gm-typography-label-xs",
    "FooterBlock.columnHeading",
  );

  const contentStackToken = typeof block.contentStackToken === "string" ? block.contentStackToken : undefined;
  const contentStack = resolveSpacingToken(contentStackToken, "gm-spacing-shell-stack", density, "FooterBlock.contentStack");
  const gridSpacingToken = typeof block.gridSpacingToken === "string" ? block.gridSpacingToken : undefined;
  const navigationGridGap = resolveSpacingToken(gridSpacingToken, "gm-spacing-grid", density, "FooterBlock.navigationGrid");
  const baseCardPadding = resolveSpacingToken(
    "gm-spacing-card-lg",
    "gm-spacing-card-lg",
    density,
    "FooterBlock.cardPadding",
  );
  const columnStack = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "FooterBlock.columnStack",
  );
  const linkStack = resolveSpacingToken(
    "gm-spacing-tight-stack",
    "gm-spacing-tight-stack",
    density,
    "FooterBlock.linkStack",
  );

  const columns = normalizeColumns(block.columns);
  const socialLinks = normalizeSocialLinks(block.socialLinks);
  const logoImage = buildSanityImage(block.logo ?? null, { width: 320, height: 160, fit: "max" });
  const backgroundImage = buildSanityImage(block.backgroundImage ?? null, {
    width: 2000,
    height: 1200,
    fit: "crop",
  });

  const cta = block.cta && typeof block.cta === "object" ? block.cta : null;
  const ctaLabel = typeof cta?.label === "string" ? cta.label.trim() : "";
  const ctaHref = typeof cta?.href === "string" ? cta.href.trim() : "";
  const hasCta = ctaLabel.length > 0 && ctaHref.length > 0;

  if (!block.headline && columns.length === 0) {
    return null;
  }

  const cardWrapperClass = [
    "relative",
    "isolate",
    "overflow-hidden",
    gmRadius["gm-radius-3xl"],
    "border",
    gmColors["gm-color-border-subtle"],
    gmColors["gm-color-surface-raised"],
  ].join(" ");
  const cardInnerClass = ["relative", "z-10", contentStack, "space-y-8", "md:space-y-12", "lg:space-y-16"].join(" ");
  const cardPadding = [baseCardPadding, "sm:p-10", "lg:p-12"].join(" ");
  const introStackClass = resolveSpacingToken(
    "gm-spacing-compact-stack",
    "gm-spacing-compact-stack",
    density,
    "FooterBlock.introStack",
  );
  const socialRowClass = ["flex", "flex-wrap", "items-center", "gap-3", "sm:gap-4"].join(" ");
  const socialLinkClass = [
    "focus-ring-token",
    "inline-flex",
    "items-center",
    "gap-4",
    "px-1",
    "py-1",
    "transition",
    "hover:underline",
    gmColors["gm-color-text-accent"],
  ].join(" ");
  const columnTitleClass = [columnHeadingClass, gmColors["gm-color-text-subtle"], "uppercase"].join(" ");
  const navGridClass = ["grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-4", navigationGridGap].join(" ");
  const linkClass = [
    "focus-ring-token",
    "inline-flex",
    "items-center",
    "justify-start",
    "px-1",
    "py-1",
    "transition",
    "hover:underline",
    gmColors["gm-color-text-secondary"],
    bodyClass,
  ].join(" ");
  const logoRowClass = ["flex", "flex-col", "items-start", "gap-4", "sm:flex-row", "sm:items-center", "sm:justify-between"].join(
    " ",
  );

  return (
    <div className={cardWrapperClass}>
      {backgroundImage ? (
        <Image
          src={backgroundImage.url}
          alt={
            block.backgroundImage && typeof block.backgroundImage === "object" && "alt" in block.backgroundImage
              ? ((block.backgroundImage as { alt?: string | null }).alt ?? "")
              : ""
          }
          fill
          className="absolute inset-0 object-cover"
          sizes="(min-width: 1280px) 1200px, (min-width: 768px) 90vw, 140vw"
          priority={false}
        />
      ) : (
        <div className="absolute inset-0 bg-content/40" aria-hidden />
      )}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" aria-hidden />
      <div className={[cardInnerClass, cardPadding].join(" ")}>
        <div className={[introStackClass, "max-w-3xl"].join(" ")}>
          {block.headline ? <h2 className={headingClass}>{block.headline}</h2> : null}
          {hasCta ? (
            <Link href={ctaHref} className={[getButtonClassName("primary", ["self-start"]), "focus-ring-token"].join(" ")}>
              {ctaLabel}
            </Link>
          ) : null}
        </div>
        {logoImage || socialLinks.length > 0 ? (
          <div className={logoRowClass}>
            {logoImage ? (
              <div className="flex items-center">
                <Image
                  src={logoImage.url}
                  alt={
                    block.logo && typeof block.logo === "object" && "alt" in block.logo && typeof block.logo.alt === "string"
                      ? block.logo.alt
                      : block.headline ?? "Footer logo"
                  }
                  width={logoImage.width ?? 320}
                  height={logoImage.height ?? 160}
                  className="h-12 w-auto object-contain sm:h-14"
                  sizes="(min-width: 1280px) 200px, 140px"
                />
              </div>
            ) : null}
            {socialLinks.length > 0 ? (
              <div className={socialRowClass}>
                {socialLinks.map((link) => {
                  const hasIcon = Boolean(link.icon);

                  return (
                    <Link
                      key={link.key}
                      href={link.href}
                      className={socialLinkClass}
                      aria-label={hasIcon ? link.label : undefined}
                    >
                      {hasIcon ? (
                        <span className="relative flex h-10 w-10 items-center justify-center" aria-hidden={link.alt ? undefined : true}>
                          <Image
                            src={link.icon!.url}
                            alt={link.alt}
                            width={link.icon!.width ?? 80}
                            height={link.icon!.height ?? 80}
                            className="h-8 w-8 object-contain"
                            sizes="40px"
                            loading="lazy"
                          />
                        </span>
                      ) : null}
                      {!hasIcon ? <span className={bodyClass}>{link.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
        {columns.length > 0 ? (
          <div className={navGridClass}>
            {columns.map((column) => (
              <div key={column.key} className={[columnStack, "flex", "flex-col"].join(" ")}>
                <p className={columnTitleClass}>{column.title}</p>
                <ul className={[linkStack, "flex", "flex-col"].join(" ")}>
                  {column.links.map((link) => (
                    <li key={link.key}>
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
