import { PortableText } from "@portabletext/react";
import Link from "next/link";

import { portableTextComponents } from "@/components/portableText/components";
import type { BlockDensity, BlockTheme, SanityBlock } from "@/lib/sanity/types";
import { gmColors } from "@/styles/designTokens";
import { getButtonClassName } from "@/styles/buttons";

import { resolveSpacingToken, resolveTypographyToken } from "./tokenUtils";

type HeroBlockAction = {
  _key?: string;
  label?: string;
  href?: string;
  isPrimary?: boolean;
};

export type HeroBlockData = SanityBlock & {
  _type: "heroBlock";
  headline?: string;
  tagline?: string;
  body?: SanityBlock[];
  actions?: HeroBlockAction[];
  headingStyle?: string;
  bodyStyle?: string;
  contentSpacing?: string;
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

  return (
    <div className={contentStack}>
      <header className={headerStack}>
        <h1 className={headingClass}>{block.headline}</h1>
        {block.tagline ? (
          <p className={[bodyClass, gmColors["gm-color-text-muted"]].join(" ")}>
            {block.tagline}
          </p>
        ) : null}
      </header>
      {Array.isArray(block.body) && block.body.length > 0 ? (
        <div className={[bodyStack, bodyClass, gmColors["gm-color-text-secondary"]].join(" ")}>
          <PortableText value={block.body} components={portableTextComponents} />
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div className={["flex flex-wrap items-center", actionsGap].join(" ")}>
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
  );
}
