export type SanityBlock = {
  _key: string;
  _type: string;
  [key: string]: unknown;
};

export type BlockTheme = "light" | "dark" | "brand" | "system";

export type BlockThemeSettings = {
  background?: BlockTheme | null;
  content?: BlockTheme | null;
};

export type BlockDensity = "default" | "compact";


export type BlockLayoutSettings = {
  container?: string;
  maxWidth?: string;
  inlinePadding?: string;
  blockPadding?: string;
  stackSpacing?: string;
};
export interface BlocksDocument {
  title?: string;
  blocks: SanityBlock[];
  [key: string]: unknown;
}
