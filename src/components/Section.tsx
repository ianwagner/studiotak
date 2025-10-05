import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import type { BlockTheme } from "@/lib/sanity/types";
import { blockThemeVariables, gmLayout, gmSpacing } from "@/styles/designTokens";

type SectionElement = keyof Pick<JSX.IntrinsicElements, "section" | "div" | "article" | "aside">;

type SectionProps = HTMLAttributes<HTMLElement> & {
  as?: SectionElement;
  children: ReactNode;
  theme?: BlockTheme;
};

const baseClassName = [
  gmLayout["gm-layout-shell"],
  gmLayout["gm-layout-shell-max"],
  gmSpacing["gm-spacing-shell-inline"],
  gmSpacing["gm-spacing-shell-block"],
  gmSpacing["gm-spacing-shell-stack"],
  "bg-background",
  "text-foreground",
].join(" ");

export function Section({
  as: Component = "section",
  className,
  theme = "light",
  style,
  children,
  ...rest
}: SectionProps) {
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
