import { gmColors, gmRadius, gmSpacing, gmTypography } from "@/styles/designTokens";

type ButtonClassList = string[];

export const buttonClassList = {
  primary: [
    "inline-flex items-center justify-center gap-2 text-background",
    gmSpacing["gm-spacing-pill"],
    gmTypography["gm-typography-body-sm"],
    gmTypography["gm-typography-strong"],
    gmRadius["gm-radius-md"],
    "bg-foreground",
    "transition",
    "hover:bg-foreground/90",
  ] as ButtonClassList,
  secondary: [
    "inline-flex items-center justify-center gap-2",
    gmSpacing["gm-spacing-pill"],
    gmTypography["gm-typography-body-sm"],
    gmTypography["gm-typography-strong"],
    gmColors["gm-color-text-accent"],
    gmRadius["gm-radius-md"],
    gmColors["gm-color-surface-accent-soft"],
    gmColors["gm-color-hover-surface-accent-soft"],
    "transition",
  ] as ButtonClassList,
  ghost: [
    "inline-flex items-center justify-center gap-2",
    gmSpacing["gm-spacing-pill"],
    gmTypography["gm-typography-body-sm"],
    gmTypography["gm-typography-strong"],
    gmColors["gm-color-text-accent"],
    gmRadius["gm-radius-md"],
    gmColors["gm-color-hover-surface-accent-soft"],
    "transition",
  ] as ButtonClassList,
} as const;

export type ButtonVariant = keyof typeof buttonClassList;

export function getButtonClassName(variant: ButtonVariant, extras: string[] = []): string {
  return [...buttonClassList[variant], ...extras].join(" ");
}
