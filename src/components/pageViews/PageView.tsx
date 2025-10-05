import { PortableText } from "@portabletext/react";

import { BlockRenderer } from "@/components/blocks";
import { Section } from "@/components/Section";
import { portableTextComponents } from "@/components/portableText/components";
import type { HeroContent, PageViewData } from "@/lib/sanity/pageViews";
import { gmColors, gmRadius, gmSpacing } from "@/styles/designTokens";
import { typographyMap } from "@/styles/typography";

type PageViewProps = {
  data: PageViewData;
};

export function PageView({ data }: PageViewProps) {
  return (
    <main
      className={[
        gmSpacing["gm-spacing-page-stack"],
        gmSpacing["gm-spacing-page-bottom"],
      ].join(" ")}
    >
      <HeroSection hero={data.hero} context={data.context} />
      {data.blocks.length > 0 ? (
        <BlockRenderer blocks={data.blocks} />
      ) : (
        <Section>
          <div
            className={[
              gmRadius["gm-radius-base"],
              "border",
              gmColors["gm-color-border-subtle"],
              gmColors["gm-color-surface-muted"],
              gmSpacing["gm-spacing-card-lg"],
              typographyMap.body.small,
              gmColors["gm-color-text-muted"],
            ].join(" ")}
          >
            No content has been tagged for this view yet.
          </div>
        </Section>
      )}
    </main>
  );
}

type HeroSectionProps = {
  hero: HeroContent;
  context: PageViewData["context"];
};

function HeroSection({ hero, context }: HeroSectionProps) {
  return (
    <Section as="header" className={gmSpacing["gm-spacing-shell-stack"]}>
      <div
        className={[
          "flex flex-wrap items-center",
          gmSpacing["gm-spacing-grid"],
          typographyMap.caption,
          gmColors["gm-color-text-subtle"],
        ].join(" ")}
      >
        <span>{context.source === "generated" ? "Auto-generated view" : "Curated view"}</span>
        {context.industry && <span>Industry: {context.industry.label}</span>}
        {context.persona && <span>Persona: {context.persona.label}</span>}
      </div>
      <div className={gmSpacing["gm-spacing-relaxed-stack"]}>
        <h1 className={typographyMap.headings.h1}>{hero.headline}</h1>
        {hero.tagline && (
          <p
            className={[
              typographyMap.body.lead,
              gmColors["gm-color-text-muted"],
            ].join(" ")}
          >
            {hero.tagline}
          </p>
        )}
        {hero.body && hero.body.length > 0 ? (
          <div
            className={[
              gmSpacing["gm-spacing-compact-stack"],
              typographyMap.body.base,
              gmColors["gm-color-text-secondary"],
            ].join(" ")}
          >
            <PortableText value={hero.body} components={portableTextComponents} />
          </div>
        ) : null}
      </div>
    </Section>
  );
}
