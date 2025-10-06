import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import type { BlockLayoutSettings, BlockTheme } from "@/lib/sanity/types";
import { blockThemeVariables, gmLayout, gmSpacing } from "@/styles/designTokens";

type SectionElement = keyof Pick<JSX.IntrinsicElements, "section" | "div" | "article" | "aside">;

type SectionProps = HTMLAttributes<HTMLElement> & {
  as?: SectionElement;
  children: ReactNode;
  layout?: BlockLayoutSettings | null;
  theme?: BlockTheme;
};

const DEFAULT_LAYOUT_TOKENS: Required<BlockLayoutSettings> = {
  container: "gm-layout-shell",
  maxWidth: "gm-layout-shell-max",
  inlinePadding: "gm-spacing-shell-inline",
  blockPadding: "gm-spacing-shell-block",
  stackSpacing: "gm-spacing-shell-stack",
};

function resolveToken<T extends Record<string, string>>(map: T, token: string | undefined, fallback: keyof T) {
  if (token && token in map) {
    return map[token as keyof T];
  }

  return map[fallback];
}

export function Section({
  as: Component = "section",
  className,
  layout,
  theme = "light",
  style,
  children,
  ...rest
}: SectionProps) {
  const resolvedLayout = {
    ...DEFAULT_LAYOUT_TOKENS,
    ...(layout ?? {}),
  } satisfies BlockLayoutSettings;

  const classSegments = [
    resolveToken(gmLayout, resolvedLayout.container, "gm-layout-shell"),
    resolveToken(gmLayout, resolvedLayout.maxWidth, "gm-layout-shell-max"),
    resolveToken(gmSpacing, resolvedLayout.inlinePadding, "gm-spacing-shell-inline"),
    resolveToken(gmSpacing, resolvedLayout.blockPadding, "gm-spacing-shell-block"),
    resolveToken(gmSpacing, resolvedLayout.stackSpacing, "gm-spacing-shell-stack"),
    "bg-background",
    "text-foreground",
  ];

  const baseClassName = classSegments.join(" ");
  const composedClassName = className ? `${baseClassName} ${className}` : baseClassName;
  const themeStyle: CSSProperties = {
    ...blockThemeVariables[theme],
    ...(style ?? {}),
  };

  return (
    <Component className={composedClassName} style={themeStyle} {...rest}>
      {children}
    </Component>
  );
}
