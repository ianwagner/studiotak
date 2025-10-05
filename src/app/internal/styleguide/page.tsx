import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { Section } from "@/components/Section";
import { isShowcaseEnabled } from "@/lib/showcase/config";
import {
  gmColors,
  gmSpacing,
  gmTypography,
} from "@/styles/designTokens";

export const revalidate = 0;

type ColorTokenKey = keyof typeof gmColors;
type SpacingTokenKey = keyof typeof gmSpacing;

const sampleText = "The quick brown fox jumps over the lazy dog.";

const stackSpacingTokens: SpacingTokenKey[] = [
  "gm-spacing-page-stack",
  "gm-spacing-section-stack",
  "gm-spacing-shell-stack",
  "gm-spacing-compact-stack",
  "gm-spacing-tight-stack",
  "gm-spacing-relaxed-stack",
];

const paddingSpacingTokens: SpacingTokenKey[] = [
  "gm-spacing-shell-inline",
  "gm-spacing-shell-block",
  "gm-spacing-card",
  "gm-spacing-card-lg",
  "gm-spacing-pill",
  "gm-spacing-chip",
];

const gridSpacingTokens: SpacingTokenKey[] = [
  "gm-spacing-grid-tight",
  "gm-spacing-grid",
  "gm-spacing-grid-relaxed",
];

const utilitySpacingTokens: SpacingTokenKey[] = [
  "gm-spacing-page-bottom",
  "gm-spacing-page-bottom-lg",
  "gm-spacing-section-inline",
  "gm-spacing-section-block",
  "gm-spacing-indent",
  "gm-spacing-border-accent",
];

const buttonVariants = [
  {
    label: "Primary",
    description: "Foreground on background with pill spacing and strong text.",
    className: joinClassNames(
      "inline-flex items-center justify-center gap-2 rounded-full text-background",
      gmSpacing["gm-spacing-pill"],
      gmTypography["gm-typography-body-sm"],
      gmTypography["gm-typography-strong"],
      "bg-foreground hover:bg-foreground/90 transition"
    ),
  },
  {
    label: "Secondary",
    description: "Tinted surface with border reinforcement for quieter CTAs.",
    className: joinClassNames(
      "inline-flex items-center justify-center gap-2 rounded-full",
      gmSpacing["gm-spacing-pill"],
      gmTypography["gm-typography-body-sm"],
      gmTypography["gm-typography-strong"],
      "border",
      gmColors["gm-color-border-strong"],
      gmColors["gm-color-surface-tint"],
      gmColors["gm-color-hover-surface-tint"],
    ),
  },
  {
    label: "Ghost",
    description: "Bare button with hover underline for minimal emphasis.",
    className: joinClassNames(
      "inline-flex items-center justify-center gap-2 rounded-full",
      gmSpacing["gm-spacing-pill"],
      gmTypography["gm-typography-body-sm"],
      gmTypography["gm-typography-strong"],
      gmColors["gm-color-text-primary"],
      "hover:bg-foreground/5",
    ),
  },
];

export default function StyleGuidePage() {
  if (!isShowcaseEnabled()) {
    notFound();
  }

  return (
    <main
      className={joinClassNames(
        gmSpacing["gm-spacing-page-stack"],
        gmSpacing["gm-spacing-page-bottom-lg"],
      )}
    >
      <Section className={gmSpacing["gm-spacing-compact-stack"]}>
        <p
          className={joinClassNames(
            gmTypography["gm-typography-label-xs"],
            gmColors["gm-color-text-faint"],
          )}
        >
          Internal only
        </p>
        <h1 className={gmTypography["gm-typography-hero-heading-static"]}>Visual Style Guide</h1>
        <p
          className={joinClassNames(
            gmTypography["gm-typography-body-base"],
            gmColors["gm-color-text-muted"],
          )}
        >
          Snapshot of core tokens, typography, and call-to-action spacing to verify visual tweaks quickly.
        </p>
      </Section>

      <Section className={gmSpacing["gm-spacing-shell-stack"]}>
        <header className={gmSpacing["gm-spacing-tight-stack"]}>
          <h2 className={gmTypography["gm-typography-subheading"]}>Color Tokens</h2>
          <p
            className={joinClassNames(
              gmTypography["gm-typography-body-sm"],
              gmColors["gm-color-text-subtle"],
            )}
          >
            Rendering text, surface, and border tokens. Hover interactions are noted where relevant.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(gmColors).map(([token, value]) => (
            <TokenCard
              key={token}
              token={token}
              value={value}
              sample={renderColorSample(token as ColorTokenKey)}
            />
          ))}
        </div>
      </Section>

      <Section className={gmSpacing["gm-spacing-shell-stack"]}>
        <header className={gmSpacing["gm-spacing-tight-stack"]}>
          <h2 className={gmTypography["gm-typography-subheading"]}>Typography</h2>
          <p
            className={joinClassNames(
              gmTypography["gm-typography-body-sm"],
              gmColors["gm-color-text-subtle"],
            )}
          >
            Sample copy showing scale, leading, and emphasis helpers.
          </p>
        </header>
        <div className={joinClassNames("grid gap-4", "md:grid-cols-2")}>
          {Object.entries(gmTypography).map(([token, value]) => (
            <TokenCard
              key={token}
              token={token}
              value={value}
              sample={
                <p className={joinClassNames(value, gmColors["gm-color-text-primary"])}>
                  {sampleText}
                </p>
              }
            />
          ))}
        </div>
      </Section>

      <Section className={gmSpacing["gm-spacing-shell-stack"]}>
        <header className={gmSpacing["gm-spacing-tight-stack"]}>
          <h2 className={gmTypography["gm-typography-subheading"]}>Buttons</h2>
          <p
            className={joinClassNames(
              gmTypography["gm-typography-body-sm"],
              gmColors["gm-color-text-subtle"],
            )}
          >
            Composed from tokens so primary CTA states stay consistent.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {buttonVariants.map((button) => (
            <div
              key={button.label}
              className={joinClassNames(
                "flex h-full flex-col justify-between",
                gmSpacing["gm-spacing-compact-stack"],
              )}
            >
              <div>
                <p className={gmTypography["gm-typography-body-sm"]}>{button.label}</p>
                <p
                  className={joinClassNames(
                    gmTypography["gm-typography-body-xs"],
                    gmColors["gm-color-text-subtle"],
                  )}
                >
                  {button.description}
                </p>
              </div>
              <button type="button" className={button.className}>
                Trigger Action
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section className={gmSpacing["gm-spacing-shell-stack"]}>
        <header className={gmSpacing["gm-spacing-tight-stack"]}>
          <h2 className={gmTypography["gm-typography-subheading"]}>Spacing Tokens</h2>
          <p
            className={joinClassNames(
              gmTypography["gm-typography-body-sm"],
              gmColors["gm-color-text-subtle"],
            )}
          >
            Stack, grid, and padding utilities rendered with high-contrast blocks for quick visual QA.
          </p>
        </header>
        <SpacingGroup
          title="Stacks"
          tokens={stackSpacingTokens}
          renderSample={(token) => (
            <div className={joinClassNames("flex flex-col", gmSpacing[token])}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`${token}-stack-${index}`}
                  className="h-8 rounded bg-foreground/10"
                />
              ))}
            </div>
          )}
        />
        <SpacingGroup
          title="Padding"
          tokens={paddingSpacingTokens}
          renderSample={(token) => (
            <div
              className={joinClassNames(
                "rounded border border-dashed border-foreground/20 bg-foreground/5",
                gmSpacing[token],
              )}
            >
              <p className={gmTypography["gm-typography-body-xs"]}>
                Padding token applied to this container.
              </p>
            </div>
          )}
        />
        <SpacingGroup
          title="Grid gaps"
          tokens={gridSpacingTokens}
          renderSample={(token) => (
            <div className={joinClassNames("grid grid-cols-2", gmSpacing[token])}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`${token}-grid-${index}`}
                  className="aspect-square rounded bg-foreground/10"
                />
              ))}
            </div>
          )}
        />
        <SpacingGroup
          title="Utility spacing"
          tokens={utilitySpacingTokens}
          renderSample={(token) => renderUtilitySpacingSample(token)}
        />
      </Section>

      <Section className={gmSpacing["gm-spacing-shell-stack"]}>
        <header className={gmSpacing["gm-spacing-tight-stack"]}>
          <h2 className={gmTypography["gm-typography-subheading"]}>Section Rhythm</h2>
          <p
            className={joinClassNames(
              gmTypography["gm-typography-body-sm"],
              gmColors["gm-color-text-subtle"],
            )}
          >
            Demonstrates the default shell layout and stacked sections using the provided utilities.
          </p>
        </header>
        <div
          className={joinClassNames(
            "rounded border border-dashed border-foreground/20 bg-foreground/5",
            gmSpacing["gm-spacing-page-stack"],
            gmSpacing["gm-spacing-page-bottom"],
          )}
        >
          <Section>
            <div className={gmSpacing["gm-spacing-tight-stack"]}>
              <h3 className={gmTypography["gm-typography-block-heading"]}>Section Heading</h3>
              <p
                className={joinClassNames(
                  gmTypography["gm-typography-body-base"],
                  gmColors["gm-color-text-muted"],
                )}
              >
                This section uses the default shell padding and stack spacing tokens.
              </p>
            </div>
            <button
              type="button"
              className={buttonVariants[0]?.className}
            >
              Primary CTA
            </button>
          </Section>
          <Section className={gmSpacing["gm-spacing-shell-stack"]}>
            <div className={gmSpacing["gm-spacing-tight-stack"]}>
              <p
                className={joinClassNames(
                  gmTypography["gm-typography-label-xs"],
                  gmColors["gm-color-text-faint"],
                )}
              >
                Secondary section
              </p>
              <p
                className={joinClassNames(
                  gmTypography["gm-typography-body-sm"],
                  gmColors["gm-color-text-subtle"],
                )}
              >
                Additional stack spacing applied via gm-spacing-shell-stack to show inter-section rhythm.
              </p>
            </div>
          </Section>
        </div>
      </Section>
    </main>
  );
}

function TokenCard({ token, value, sample }: { token: string; value: string; sample: ReactNode }) {
  return (
    <article
      className={joinClassNames(
        "rounded border shadow-sm",
        gmColors["gm-color-border-subtle"],
        gmColors["gm-color-surface-raised"],
        gmColors["gm-color-shadow-subtle"],
        gmSpacing["gm-spacing-card-lg"],
        gmSpacing["gm-spacing-compact-stack"],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={joinClassNames(
            gmTypography["gm-typography-body-sm"],
            gmTypography["gm-typography-strong"],
            gmColors["gm-color-text-subtle"],
          )}
        >
          {token}
        </span>
        <code className="text-xs font-mono text-foreground/70">{value}</code>
      </div>
      <div className="rounded bg-background/60 p-3">
        {sample}
      </div>
    </article>
  );
}

function SpacingGroup({
  title,
  tokens,
  renderSample,
}: {
  title: string;
  tokens: SpacingTokenKey[];
  renderSample: (token: SpacingTokenKey) => ReactNode;
}) {
  return (
    <section className={gmSpacing["gm-spacing-shell-stack"]}>
      <h3 className={gmTypography["gm-typography-block-heading"]}>{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {tokens.map((token) => (
          <TokenCard
            key={token}
            token={token}
            value={gmSpacing[token]}
            sample={renderSample(token)}
          />
        ))}
      </div>
    </section>
  );
}

function renderColorSample(token: ColorTokenKey) {
  if (token.includes("text")) {
    return (
      <p className={joinClassNames(gmColors[token], gmTypography["gm-typography-body-base"]) }>
        {sampleText}
      </p>
    );
  }

  if (token.includes("surface")) {
    return (
      <div className={joinClassNames("h-16 w-full rounded", gmColors[token])} />
    );
  }

  if (token.includes("border")) {
    return (
      <div className="rounded border bg-background">
        <div className={joinClassNames("h-16 w-full rounded", gmColors[token])} />
      </div>
    );
  }

  if (token.includes("shadow")) {
    return (
      <div className={joinClassNames("h-16 w-full rounded border border-foreground/10 bg-background", gmColors[token])} />
    );
  }

  if (token.includes("decoration")) {
    return (
      <p
        className={joinClassNames(
          gmTypography["gm-typography-body-base"],
          "underline underline-offset-4",
          gmColors[token],
        )}
      >
        Hover to check underline accent
      </p>
    );
  }

  if (token.includes("hover")) {
    return (
      <button
        type="button"
        className={joinClassNames(
          "rounded border border-foreground/20 px-4 py-2 transition",
          gmColors[token],
        )}
      >
        Hover me
      </button>
    );
  }

  return (
    <p className={gmTypography["gm-typography-body-sm"]}>Token preview not categorized.</p>
  );
}

function renderUtilitySpacingSample(token: SpacingTokenKey) {
  if (token.includes("indent")) {
    return (
      <p className={joinClassNames(gmSpacing[token], gmTypography["gm-typography-body-sm"]) }>
        Indented copy to demonstrate {token}.
      </p>
    );
  }

  if (token.includes("border")) {
    return (
      <div
        className={joinClassNames(
          "rounded border border-dashed border-foreground/20 bg-foreground/5",
          gmSpacing[token],
          gmSpacing["gm-spacing-card"],
        )}
      >
        <p className={gmTypography["gm-typography-body-xs"]}>Border accent utility applied.</p>
      </div>
    );
  }

  if (token.includes("page-bottom")) {
    return (
      <div className="rounded border border-dashed border-foreground/20 bg-foreground/5">
        <div className={joinClassNames(gmSpacing[token], "bg-foreground/10 p-4") }>
          <p className={gmTypography["gm-typography-body-xs"]}>
            Extra bottom padding from {token}.
          </p>
        </div>
      </div>
    );
  }

  if (token.includes("section")) {
    return (
      <div
        className={joinClassNames(
          "rounded border border-dashed border-foreground/20 bg-foreground/5",
          gmSpacing[token],
        )}
      >
        <p className={gmTypography["gm-typography-body-xs"]}>Section utility padding sample</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-dashed border-foreground/20 bg-foreground/5 p-4">
      <p className={gmTypography["gm-typography-body-xs"]}>
        Token applies generic spacing utility.
      </p>
    </div>
  );
}

function joinClassNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
