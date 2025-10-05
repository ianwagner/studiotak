import { notFound } from "next/navigation";

import { Section } from "@/components/Section";
import { SetBlock } from "@/components/blocks";
import { isShowcaseEnabled } from "@/lib/showcase/config";
import { getSetShowcaseSections } from "@/lib/showcase/fixtures";
import { gmColors, gmSpacing, gmTypography } from "@/styles/designTokens";

export const revalidate = 0;

export default function SetsShowcasePage() {
  if (!isShowcaseEnabled()) {
    notFound();
  }

  const sections = getSetShowcaseSections();

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
        <h1 className={gmTypography["gm-typography-hero-heading-static"]}>Sets Showcase</h1>
        <p
          className={[
            gmTypography["gm-typography-body-base"],
            gmColors["gm-color-text-muted"],
          ].join(" ")}
        >
          Reference layouts for common set filter combinations to confirm visual consistency.
        </p>
      </Section>
      {sections.map((section) => (
        <Section key={section.block._key} className={gmSpacing["gm-spacing-shell-stack"]}>
          <div className={gmSpacing["gm-spacing-tight-stack"]}>
            <h2 className={gmTypography["gm-typography-subheading"]}>{section.title}</h2>
            <p
              className={[
                gmTypography["gm-typography-body-sm"],
                gmColors["gm-color-text-subtle"],
              ].join(" ")}
            >
              {section.description}
            </p>
          </div>
          <SetBlock block={section.block} />
        </Section>
      ))}
    </main>
  );
}
