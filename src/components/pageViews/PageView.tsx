import { BlockRenderer } from "@/components/blocks";
import { Section } from "@/components/Section";
import type { PageViewData } from "@/lib/sanity/pageViews";
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
