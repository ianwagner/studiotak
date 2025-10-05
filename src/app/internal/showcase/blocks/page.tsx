import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/blocks";
import { Section } from "@/components/Section";
import { isShowcaseEnabled } from "@/lib/showcase/config";
import { getBlockShowcaseFixtures } from "@/lib/showcase/fixtures";
import { gmColors, gmSpacing, gmTypography } from "@/styles/designTokens";

export const revalidate = 0;

export default function BlocksShowcasePage() {
  if (!isShowcaseEnabled()) {
    notFound();
  }

  const blocks = getBlockShowcaseFixtures();

  return (
    <main
      className={[
        gmSpacing["gm-spacing-page-stack"],
        gmSpacing["gm-spacing-page-bottom-lg"],
      ].join(" ")}
    >
      <Section className={gmSpacing["gm-spacing-compact-stack"]}>
        <p
          className={[
            gmTypography["gm-typography-label-xs"],
            gmColors["gm-color-text-faint"],
          ].join(" ")}
        >
          Internal only
        </p>
        <h1 className={gmTypography["gm-typography-hero-heading-static"]}>Blocks Showcase</h1>
        <p
          className={[
            gmTypography["gm-typography-body-base"],
            gmColors["gm-color-text-muted"],
          ].join(" ")}
        >
          Quick sweep of typographic rhythm, spacing, and block-level consistency using fixture data.
        </p>
      </Section>
      <BlockRenderer blocks={blocks} />
    </main>
  );
}
