import type { BlockDensity } from "@/lib/sanity/types";
import { gmSpacing, gmTypography } from "@/styles/designTokens";

const COMPACT_SPACING_OVERRIDES: Partial<Record<keyof typeof gmSpacing, keyof typeof gmSpacing>> = {
  "gm-spacing-shell-stack": "gm-spacing-compact-stack",
  "gm-spacing-section-stack": "gm-spacing-compact-stack",
  "gm-spacing-page-stack": "gm-spacing-relaxed-stack",
  "gm-spacing-relaxed-stack": "gm-spacing-compact-stack",
  "gm-spacing-shell-inline": "gm-spacing-shell-inline",
  "gm-spacing-block-inline": "gm-spacing-shell-inline",
  "gm-spacing-shell-block": "gm-spacing-shell-block",
  "gm-spacing-grid-relaxed": "gm-spacing-grid",
  "gm-spacing-grid": "gm-spacing-grid-tight",
  "gm-spacing-card-lg": "gm-spacing-card",
  "gm-spacing-card": "gm-spacing-card",
  "gm-spacing-pill": "gm-spacing-pill",
  "gm-spacing-compact-stack": "gm-spacing-tight-stack",
  "gm-spacing-tight-stack": "gm-spacing-tight-stack",
};

const DEFAULT_DENSITY: BlockDensity = "default";

const spacingWarnings = new Set<string>();
const typographyWarnings = new Set<string>();

type SpacingToken = keyof typeof gmSpacing;
type TypographyToken = keyof typeof gmTypography;

const isSpacingToken = (token: string | undefined | null): token is SpacingToken =>
  Boolean(token && token in gmSpacing);

const isTypographyToken = (token: string | undefined | null): token is TypographyToken =>
  Boolean(token && token in gmTypography);

function describeContext(context?: string) {
  return context ? ` in ${context}` : "";
}

function warnOnce(collection: Set<string>, message: string) {
  if (process.env.NODE_ENV === "production" || collection.has(message)) {
    return;
  }

  collection.add(message);
  console.warn(`[design-tokens] ${message}`);
}

export function resolveSpacingToken(
  token: string | undefined | null,
  fallback: SpacingToken,
  density: BlockDensity = DEFAULT_DENSITY,
  context?: string,
): string {
  const hasToken = Boolean(token);

  const baseToken: SpacingToken | null = hasToken && isSpacingToken(token)
    ? (token as SpacingToken)
    : isSpacingToken(fallback)
    ? fallback
    : null;

  if (hasToken && !isSpacingToken(token)) {
    warnOnce(
      spacingWarnings,
      `Unknown spacing token "${token}"${describeContext(context)}. Falling back to "${fallback}".`,
    );
  }

  if (baseToken === null) {
    warnOnce(
      spacingWarnings,
      `Invalid spacing fallback "${fallback}"${describeContext(context)}. Returning empty string.`,
    );
    return "";
  }

  let resolvedToken: SpacingToken = baseToken;

  if (density === "compact") {
    const override = COMPACT_SPACING_OVERRIDES[baseToken];
    if (override) {
      resolvedToken = override;
    }
  }

  const className = gmSpacing[resolvedToken];

  if (!className) {
    warnOnce(
      spacingWarnings,
      `Spacing token "${resolvedToken}" has no mapped class${describeContext(context)}.`,
    );
    return "";
  }

  return className;
}

export function resolveTypographyToken(
  token: string | undefined | null,
  fallback: TypographyToken,
  context?: string,
): string {
  const hasToken = Boolean(token);
  const selected: TypographyToken | null = hasToken && isTypographyToken(token)
    ? (token as TypographyToken)
    : isTypographyToken(fallback)
    ? fallback
    : null;

  if (hasToken && !isTypographyToken(token)) {
    warnOnce(
      typographyWarnings,
      `Unknown typography token "${token}"${describeContext(context)}. Falling back to "${fallback}".`,
    );
  }

  if (selected === null) {
    warnOnce(
      typographyWarnings,
      `Invalid typography fallback "${fallback}"${describeContext(context)}. Returning empty string.`,
    );
    return "";
  }

  const className = gmTypography[selected];

  if (!className) {
    warnOnce(
      typographyWarnings,
      `Typography token "${selected}" has no mapped class${describeContext(context)}.`,
    );
    return "";
  }

  return className;
}
