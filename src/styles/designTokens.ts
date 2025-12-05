import type { BlockTheme } from "@/lib/sanity/types";

const shellInlinePadding = "px-3 sm:px-4 lg:px-5 xl:px-6 2xl:px-8";
const shellBlockPadding = "py-12 sm:py-16";
const blockInlinePadding = "px-6 sm:px-8 lg:px-12";
const inlinePaddingNone = "px-0";
const heroFrameInlinePadding = "px-4 sm:px-6";
const shellStackSpacing = "space-y-6";
const shellContainerBase = "mx-auto w-full";
const shellContainerMax = "max-w-[110rem]";
const blockContainerBase = "mx-auto w-[90%]";
const blockContainerMax = "max-w-[75rem]";
const heroMaxWidth = "max-w-none";
const heroCardPadding = "px-10 py-12 sm:px-20 sm:py-20";
const heroFrameBlockPadding = "py-6 sm:py-8";

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
  "gm-color-surface-raised": "bg-content/80",
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
  "gm-spacing-grid-spacious": "gap-y-10 gap-x-16",
  "gm-spacing-shell-inline": shellInlinePadding,
  "gm-spacing-section-inline": shellInlinePadding,
  "gm-spacing-block-inline": blockInlinePadding,
  "gm-spacing-inline-none": inlinePaddingNone,
  "gm-spacing-hero-frame-inline": heroFrameInlinePadding,
  "gm-spacing-shell-block": shellBlockPadding,
  "gm-spacing-section-block": shellBlockPadding,
  "gm-spacing-block-none": "py-0",
  "gm-spacing-hero-frame-block": heroFrameBlockPadding,
  "gm-spacing-hero-card": heroCardPadding,
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
  "gm-typography-hero-heading": "text-6xl font-bold tracking-tight sm:text-7xl",
  "gm-typography-hero-heading-static": "text-6xl font-bold tracking-tight",
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
  "gm-layout-block": blockContainerBase,
  "gm-layout-block-max": blockContainerMax,
  "gm-layout-hero-max": heroMaxWidth,
} as const;

export const gmBreakpoints = {
  "gm-breakpoint-content-max": shellContainerMax,
  "gm-breakpoint-grid-two-column": "md:grid-cols-2 lg:grid-cols-3",
  "gm-breakpoint-pagination-layout": "sm:flex-row sm:items-center sm:justify-between",
} as const;

export const gmEffects = {
  "gm-effect-opacity-subdued": "opacity-40",
} as const;

const LIGHT_BACKGROUND = "#ffffff";
const LIGHT_FOREGROUND = "#171717";
const SYSTEM_BACKGROUND = "var(--surface-default)";
const SYSTEM_FOREGROUND = "var(--text-default)";
const DARK_BACKGROUND = "#0a0a0a";
const DARK_FOREGROUND = "#ededed";
const BRAND_BACKGROUND = "#f7dac6";
const BRAND_FOREGROUND = "#ff700b";
const BRAND_ACCENT = "#ff700b";
const BRAND_ACCENT_FOREGROUND = "#ffffff";

type ThemeVariableMap = {
  "--background": string;
  "--foreground": string;
  "--accent"?: string;
  "--accent-foreground"?: string;
};

export const blockThemeVariables: Record<BlockTheme, ThemeVariableMap> = {
  light: {
    "--background": LIGHT_BACKGROUND,
    "--foreground": LIGHT_FOREGROUND,
  },
  dark: {
    "--background": DARK_BACKGROUND,
    "--foreground": DARK_FOREGROUND,
  },
  brand: {
    "--background": BRAND_BACKGROUND,
    "--foreground": BRAND_FOREGROUND,
    "--accent": BRAND_ACCENT,
    "--accent-foreground": BRAND_ACCENT_FOREGROUND,
  },
  system: {
    "--background": SYSTEM_BACKGROUND,
    "--foreground": SYSTEM_FOREGROUND,
  },
} as const;
