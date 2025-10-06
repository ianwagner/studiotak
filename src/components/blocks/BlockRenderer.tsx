import { PortableText } from "@portabletext/react";
import type { ReactNode } from "react";

import { Section } from "@/components/Section";
import { portableTextComponents } from "@/components/portableText/components";
import type { SetBlockView } from "@/lib/sanity/pageViews";
import type { BlockLayoutSettings, BlockTheme, SanityBlock } from "@/lib/sanity/types";
import { gmColors, gmRadius, gmSpacing, gmTypography } from "@/styles/designTokens";

import { FeaturesBlock } from "./FeaturesBlock";
import type { FeaturesBlockData } from "./FeaturesBlock";
import { HeroBlock } from "./HeroBlock";
import type { HeroBlockData } from "./HeroBlock";
import { SetBlock } from "./SetBlock";
import { SplitBlock } from "./SplitBlock";
import type { SplitBlockData } from "./SplitBlock";

type PortableTextValue = Array<Record<string, unknown>>;

type BlockComponentProps<T extends SanityBlock = SanityBlock> = {
  block: T;
};

type BlockComponent<T extends SanityBlock = SanityBlock> = (
  props: BlockComponentProps<T>,
) => ReactNode;

export type BlockRendererProps = {
  blocks?: SanityBlock[] | null;
  components?: Record<string, BlockComponent>;
};

const extractPortableTextValue = (block: SanityBlock): PortableTextValue | null => {
  const candidate =
    (block.content as PortableTextValue | undefined) ??
    (block.body as PortableTextValue | undefined) ??
    (block.value as PortableTextValue | undefined);

  if (!candidate || !Array.isArray(candidate)) {
    return null;
  }

  return candidate;
};

const PortableTextBlock: BlockComponent = ({ block }) => {
  const value = extractPortableTextValue(block);

  if (!value || value.length === 0) {
    return null;
  }

  return <PortableText value={value} components={portableTextComponents} />;
};

const SetBlockComponent: BlockComponent<SetBlockView> = ({ block }) => {
  return <SetBlock block={block} />;
};

const HeroBlockComponent: BlockComponent<HeroBlockData> = ({ block }) => {
  return <HeroBlock block={block} />;
};

const SplitBlockComponent: BlockComponent<SplitBlockData> = ({ block }) => {
  return <SplitBlock block={block} />;
};

const FeaturesBlockComponent: BlockComponent<FeaturesBlockData> = ({ block }) => {
  return <FeaturesBlock block={block} />;
};

const defaultComponents: Record<string, BlockComponent> = {
  portableText: PortableTextBlock,
  richText: PortableTextBlock,
  blockContent: PortableTextBlock,
  heroBlock: HeroBlockComponent,
  splitBlock: SplitBlockComponent,
  featuresBlock: FeaturesBlockComponent,
  setBlock: SetBlockComponent,
};

const FallbackBlock: BlockComponent = ({ block }) => (
  <div className={gmSpacing["gm-spacing-compact-stack"]}>
    <p
      className={[
        gmTypography["gm-typography-body-sm"],
        gmTypography["gm-typography-strong"],
        "uppercase tracking-wide",
        gmColors["gm-color-text-subtle"],
      ].join(" ")}
    >
      Unhandled block type: {block._type}
    </p>
    <pre
      className={[
        "overflow-x-auto",
        gmRadius["gm-radius-base"],
        "border",
        gmColors["gm-color-border-subtle"],
        gmColors["gm-color-surface-muted"],
        gmSpacing["gm-spacing-card"],
        gmTypography["gm-typography-body-xs"],
        gmColors["gm-color-text-muted"],
      ].join(" ")}
    >
      {JSON.stringify(block, null, 2)}
    </pre>
  </div>
);

export function BlockRenderer({
  blocks,
  components,
}: BlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <>
      {blocks.map((block, index) => {
        const Component =
          components?.[block._type] ??
          defaultComponents[block._type] ??
          FallbackBlock;

        const anchor =
          typeof block.anchor === "string"
            ? block.anchor
            : typeof block.slug === "string"
            ? block.slug
            : undefined;

        const theme: BlockTheme = (block as { theme?: BlockTheme }).theme ?? "light";
        const layout = (block as { layout?: BlockLayoutSettings | null }).layout ?? null;

        return (
          <Section
            key={block._key ?? `${block._type}-${index}`}
            id={anchor}
            theme={theme}
            layout={layout}
          >
            <Component block={block} />
          </Section>
        );
      })}
    </>
  );
}
