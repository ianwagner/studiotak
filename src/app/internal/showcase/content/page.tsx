import { notFound } from "next/navigation";

import { ContentItemCard } from "@/components/content";
import { Section } from "@/components/Section";
import { isShowcaseEnabled } from "@/lib/showcase/config";
import { getContentTypeShowcaseEntries } from "@/lib/showcase/fixtures";
import {
  gmBreakpoints,
  gmColors,
  gmSpacing,
  gmTypography,
} from "@/styles/designTokens";

export const revalidate = 0;

export default function ContentShowcasePage() {
  if (!isShowcaseEnabled()) {
    notFound();
  }

  const entries = getContentTypeShowcaseEntries();

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
        <h1 className={gmTypography["gm-typography-hero-heading-static"]}>
          Content Type Presets
        </h1>
        <p
          className={[
            gmTypography["gm-typography-body-base"],
            gmColors["gm-color-text-muted"],
          ].join(" ")}
        >
          Preview how each content type renders within cards. Styling comes from the
          shared presets registry used by the runtime renderer.
        </p>
      </Section>
      <Section>
        <div
          className={[
            "grid",
            gmSpacing["gm-spacing-grid-relaxed"],
            gmBreakpoints["gm-breakpoint-grid-two-column"],
          ].join(" ")}
        >
          {entries.map(({ preset, item }) => (
            <div
              key={preset.key}
              className={gmSpacing["gm-spacing-tight-stack"]}
            >
              <div className={gmSpacing["gm-spacing-compact-stack"]}>
                <p
                  className={[
                    gmTypography["gm-typography-label-xs"],
                    gmColors["gm-color-text-subtle"],
                  ].join(" ")}
                >
                  {preset.key}
                </p>
                <h2 className={gmTypography["gm-typography-subheading"]}>
                  {preset.label}
                </h2>
                <p
                  className={[
                    gmTypography["gm-typography-body-sm"],
                    gmColors["gm-color-text-muted"],
                  ].join(" ")}
                >
                  {preset.description}
                </p>
              </div>
              <ContentItemCard
                item={item}
                overrideContentTypeLabel={
                  item.contentType?.label ? undefined : preset.label
                }
              />
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
