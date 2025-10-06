import type { BlockTheme } from "@/lib/sanity/types";

const shellInlinePadding = "px-6 sm:px-8 lg:px-12";
const shellBlockPadding = "py-12 sm:py-16";
const shellStackSpacing = "space-y-6";
const shellContainerBase = "mx-auto w-full";
const shellContainerMax = "max-w-6xl";

export const gmColors = {
  "gm-color-text-primary": "text-foreground",
  "gm-color-text-strong": "text-foreground/90",
  "gm-color-text-secondary": "text-foreground/80",
  "gm-color-text-muted": "text-foreground/70",
  "gm-color-text-subtle": "text-foreground/60",
  "gm-color-text-faint": "text-foreground/50",
  "gm-color-text-accent": "text-accent",
  "gm-color-text-on-accent": "text-accent-foreground",
  "gm-color-text-tag": "text-accent/80",
  "gm-color-text-chip": "text-accent",
  "gm-color-surface-muted": "bg-foreground/5",
  "gm-color-surface-tint": "bg-foreground/10",
  "gm-color-surface-accent": "bg-accent",
  "gm-color-surface-accent-soft": "bg-accent/10",
  "gm-color-surface-tag": "bg-accent/10",
  "gm-color-surface-chip": "bg-accent/10",
  "gm-color-surface-raised": "bg-background/80",
  "gm-color-border-subtle": "border-foreground/10",
  "gm-color-border-strong": "border-foreground/20",
  "gm-color-border-accent": "border-accent",
  "gm-color-shadow-subtle": "shadow-foreground/5",
  "gm-color-hover-surface-tint": "hover:bg-foreground/10",
  "gm-color-hover-surface-accent-soft": "hover:bg-accent/20",
  "gm-color-hover-surface-accent": "hover:bg-accent/80",
  "gm-color-decoration-muted": "decoration-foreground/40",
  "gm-color-decoration-strong": "decoration-foreground",
  "gm-color-decoration-accent": "decoration-accent",
  "gm-color-hover-decoration-strong": "hover:decoration-foreground",
} as const;

export const gmSpacing = {
  "gm-spacing-shell-stack": shellStackSpacing,
  "gm-spacing-section-stack": shellStackSpacing,
  "gm-spacing-page-stack": "space-y-12",
  "gm-spacing-compact-stack": "space-y-3",
  "gm-spacing-tight-stack": "space-y-2",
  "gm-spacing-relaxed-stack": "space-y-4",
  "gm-spacing-grid-tight": "gap-2",
  "gm-spacing-grid": "gap-3",
  "gm-spacing-grid-relaxed": "gap-4",
  "gm-spacing-shell-inline": shellInlinePadding,
  "gm-spacing-section-inline": shellInlinePadding,
  "gm-spacing-shell-block": shellBlockPadding,
  "gm-spacing-section-block": shellBlockPadding,
  "gm-spacing-page-bottom": "pb-12",
  "gm-spacing-page-bottom-lg": "pb-16",
  "gm-spacing-card": "p-4",
  "gm-spacing-card-lg": "p-6",
  "gm-spacing-pill": "px-4 py-2",
  "gm-spacing-chip": "px-2 py-1",
  "gm-spacing-indent": "pl-6",
  "gm-spacing-border-accent": "border-l-2",
} as const;

export const gmTypography = {
  "gm-typography-hero-heading": "text-4xl font-semibold tracking-tight sm:text-5xl",
  "gm-typography-hero-heading-static": "text-4xl font-semibold tracking-tight",
  "gm-typography-section-heading": "text-3xl font-semibold tracking-tight",
  "gm-typography-block-heading": "text-2xl font-semibold tracking-tight sm:text-3xl",
  "gm-typography-subheading": "text-2xl font-semibold tracking-tight",
  "gm-typography-body-lg": "text-lg",
  "gm-typography-body-base": "text-base",
  "gm-typography-body-sm": "text-sm",
  "gm-typography-body-xs": "text-xs",
  "gm-typography-label-xs": "text-xs uppercase tracking-wide",
  "gm-typography-leading-relaxed": "leading-relaxed",
  "gm-typography-italic": "italic",
  "gm-typography-strong": "font-semibold",
  "gm-typography-underline": "underline",
  "gm-typography-underline-offset": "underline-offset-4",
} as const;

export const gmRadius = {
  "gm-radius-none": "rounded-none",
  "gm-radius-sm": "rounded-sm",
  "gm-radius-base": "rounded",
  "gm-radius-md": "rounded-md",
  "gm-radius-lg": "rounded-lg",
  "gm-radius-xl": "rounded-xl",
  "gm-radius-2xl": "rounded-2xl",
  "gm-radius-3xl": "rounded-3xl",
  "gm-radius-pill": "rounded-full",
} as const;

export const gmLayout = {
  "gm-layout-shell": shellContainerBase,
  "gm-layout-shell-max": shellContainerMax,
} as const;

export const gmBreakpoints = {
  "gm-breakpoint-content-max": shellContainerMax,
  "gm-breakpoint-grid-two-column": "md:grid-cols-2 lg:grid-cols-3",
  "gm-breakpoint-pagination-layout": "sm:flex-row sm:items-center sm:justify-between",
} as const;

export const gmEffects = {
  "gm-effect-opacity-subdued": "opacity-40",
} as const;

type ThemeVariableMap = {
  "--background": string;
  "--foreground": string;
};

export const blockThemeVariables: Record<BlockTheme, ThemeVariableMap> = {
  light: {
    "--background": "#ffffff",
    "--foreground": "#171717",
  },
  dark: {
    "--background": "#0a0a0a",
    "--foreground": "#ededed",
  },
  brand: {
    "--background": "#f5f3ff",
    "--foreground": "#4c1d95",
  },
} as const;
