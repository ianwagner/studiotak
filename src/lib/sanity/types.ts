export type SanityBlock = {
  _key: string;
  _type: string;
  [key: string]: unknown;
};

export type BlockTheme = "light" | "dark" | "brand";

export interface BlocksDocument {
  title?: string;
  blocks: SanityBlock[];
  [key: string]: unknown;
}
