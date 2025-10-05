import { gmColors, gmTypography } from "./designTokens";

type HeadingScale = {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
};

type BodyScale = {
  lead: string;
  base: string;
  small: string;
  xsmall: string;
};

type TypographyMap = {
  headings: HeadingScale;
  body: BodyScale;
  caption: string;
  flow: {
    relaxed: string;
  };
  emphasis: {
    strong: string;
    italic: string;
  };
  link: {
    inline: string;
    unresolved: string;
  };
};

export const typographyMap: TypographyMap = {
  headings: {
    h1: gmTypography["gm-typography-hero-heading"],
    h2: gmTypography["gm-typography-section-heading"],
    h3: gmTypography["gm-typography-subheading"],
    h4: gmTypography["gm-typography-block-heading"],
    h5: [
      gmTypography["gm-typography-body-lg"],
      gmTypography["gm-typography-strong"],
    ].join(" "),
    h6: gmTypography["gm-typography-label-xs"],
  },
  body: {
    lead: gmTypography["gm-typography-body-lg"],
    base: gmTypography["gm-typography-body-base"],
    small: gmTypography["gm-typography-body-sm"],
    xsmall: gmTypography["gm-typography-body-xs"],
  },
  caption: gmTypography["gm-typography-label-xs"],
  flow: {
    relaxed: gmTypography["gm-typography-leading-relaxed"],
  },
  emphasis: {
    strong: gmTypography["gm-typography-strong"],
    italic: gmTypography["gm-typography-italic"],
  },
  link: {
    inline: [
      gmTypography["gm-typography-underline"],
      gmTypography["gm-typography-underline-offset"],
      gmColors["gm-color-decoration-muted"],
      "transition-colors",
      gmColors["gm-color-hover-decoration-strong"],
    ].join(" "),
    unresolved: [
      gmTypography["gm-typography-underline"],
      "decoration-dashed",
    ].join(" "),
  },
};

export type { TypographyMap };
