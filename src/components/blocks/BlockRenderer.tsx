import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { ReactNode } from "react";

import { Section } from "@/components/Section";
import { portableTextComponents } from "@/components/portableText/components";
import type { DisplayBlockView, SetBlockView } from "@/lib/sanity/pageViews";
import type { BlockLayoutSettings, BlockTheme, BlockThemeSettings, SanityBlock } from "@/lib/sanity/types";
import { gmColors, gmRadius, gmSpacing, gmTypography } from "@/styles/designTokens";

import { DisplayBlock } from "./DisplayBlock";
import { FeaturesBlock } from "./FeaturesBlock";
import type { FeaturesBlockData } from "./FeaturesBlock";
import { FooterBlock } from "./FooterBlock";
import type { FooterBlockData } from "./FooterBlock";
import { FormBlock } from "./FormBlock";
import type { FormBlockData } from "./FormBlock";
import { HeroBlock } from "./HeroBlock";
import type { HeroBlockData } from "./HeroBlock";
import { LogoGridBlock } from "./LogoGridBlock";
import type { LogoGridBlockData } from "./LogoGridBlock";
import { SetBlock } from "./SetBlock";
import { SplitBlock } from "./SplitBlock";
import type { SplitBlockData } from "./SplitBlock";
import { ThirdsBlock } from "./ThirdsBlock";
import type { ThirdsBlockData } from "./ThirdsBlock";

type PortableTextValue = PortableTextBlock[];

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

  const isValid = candidate.every(
    (item): item is PortableTextBlock =>
      Boolean(item) && typeof item === "object" && "_type" in item && typeof (item as { _type: unknown })._type === "string",
  );

  return isValid ? candidate : null;
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

const DisplayBlockComponent: BlockComponent<DisplayBlockView> = ({ block }) => {
  return <DisplayBlock block={block} />;
};

const HeroBlockComponent: BlockComponent<HeroBlockData> = ({ block }) => {
  return <HeroBlock block={block} />;
};

const SplitBlockComponent: BlockComponent<SplitBlockData> = ({ block }) => {
  return <SplitBlock block={block} />;
};

const ThirdsBlockComponent: BlockComponent<ThirdsBlockData> = ({ block }) => {
  return <ThirdsBlock block={block} />;
};

const FeaturesBlockComponent: BlockComponent<FeaturesBlockData> = ({ block }) => {
  return <FeaturesBlock block={block} />;
};

const FormBlockComponent: BlockComponent<FormBlockData> = ({ block }) => {
  return <FormBlock block={block} />;
};

const LogoGridBlockComponent: BlockComponent<LogoGridBlockData> = ({ block }) => {
  return <LogoGridBlock block={block} />;
};

const FooterBlockComponent: BlockComponent<FooterBlockData> = ({ block }) => {
  return <FooterBlock block={block} />;
};

const defaultComponents: Record<string, BlockComponent> = {
  portableText: PortableTextBlock,
  richText: PortableTextBlock,
  blockContent: PortableTextBlock,
  heroBlock: HeroBlockComponent,
  splitBlock: SplitBlockComponent,
  thirdsBlock: ThirdsBlockComponent,
  featuresBlock: FeaturesBlockComponent,
  formBlock: FormBlockComponent,
  logoGridBlock: LogoGridBlockComponent,
  footerBlock: FooterBlockComponent,
  setBlock: SetBlockComponent,
  displayBlock: DisplayBlockComponent,
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

function resolveBlockThemes(block: SanityBlock): { background: BlockTheme; content: BlockTheme } {
  const rawTheme = (block as { theme?: BlockTheme | BlockThemeSettings | null }).theme;

  if (!rawTheme) {
    return { background: "light", content: "light" };
  }

  if (typeof rawTheme === "string") {
    return { background: rawTheme, content: rawTheme };
  }

  const background = (rawTheme.background ?? rawTheme.content ?? "light") as BlockTheme;
  const content = (rawTheme.content ?? background ?? "light") as BlockTheme;

  return { background, content };
}

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

        const { background, content } = resolveBlockThemes(block);
        const backgroundTheme: BlockTheme =
          (block as { backgroundTheme?: BlockTheme }).backgroundTheme ?? background;
        const theme: BlockTheme = content;
        const layoutSettings = (block as { layout?: BlockLayoutSettings | null }).layout ?? null;

        const isHeroBlock = block._type === "heroBlock";
        const isFormBlock = block._type === "formBlock";

        let sectionLayout: BlockLayoutSettings | null = layoutSettings;

        if (isHeroBlock) {
          const shouldOverrideInline =
            !layoutSettings?.inlinePadding ||
            layoutSettings.inlinePadding === "gm-spacing-shell-inline" ||
            layoutSettings.inlinePadding === "gm-spacing-inline-none";
          const shouldOverrideContainer =
            !layoutSettings?.container || layoutSettings.container === "gm-layout-shell";
          const shouldOverrideMaxWidth =
            !layoutSettings?.maxWidth || layoutSettings.maxWidth === "gm-layout-shell-max";
          const shouldOverrideBlockPadding =
            !layoutSettings?.blockPadding ||
            layoutSettings.blockPadding === "gm-spacing-shell-block" ||
            layoutSettings.blockPadding === "gm-spacing-block-none";

          if (
            shouldOverrideInline ||
            shouldOverrideContainer ||
            shouldOverrideMaxWidth ||
            shouldOverrideBlockPadding
          ) {
            sectionLayout = {
              ...(layoutSettings ?? {}),
              ...(shouldOverrideInline ? { inlinePadding: "gm-spacing-hero-frame-inline" } : {}),
              ...(shouldOverrideContainer ? { container: "gm-layout-shell" } : {}),
              ...(shouldOverrideMaxWidth ? { maxWidth: "gm-layout-hero-max" } : {}),
              ...(shouldOverrideBlockPadding ? { blockPadding: "gm-spacing-hero-frame-block" } : {}),
            };
          }
        } else if (isFormBlock) {
          const shouldOverrideInline =
            !layoutSettings?.inlinePadding ||
            layoutSettings.inlinePadding === "gm-spacing-shell-inline" ||
            layoutSettings.inlinePadding === "gm-spacing-block-inline";
          const shouldOverrideContainer =
            !layoutSettings?.container || layoutSettings.container === "gm-layout-block";
          const shouldOverrideMaxWidth =
            !layoutSettings?.maxWidth || layoutSettings.maxWidth === "gm-layout-block-max";
          const shouldOverrideBlockPadding =
            !layoutSettings?.blockPadding ||
            layoutSettings.blockPadding === "gm-spacing-shell-block" ||
            layoutSettings.blockPadding === "gm-spacing-hero-frame-block";

          if (
            shouldOverrideInline ||
            shouldOverrideContainer ||
            shouldOverrideMaxWidth ||
            shouldOverrideBlockPadding
          ) {
            sectionLayout = {
              ...(layoutSettings ?? {}),
              ...(shouldOverrideInline ? { inlinePadding: "gm-spacing-inline-none" } : {}),
              ...(shouldOverrideContainer ? { container: "gm-layout-shell" } : {}),
              ...(shouldOverrideMaxWidth ? { maxWidth: "gm-layout-shell-max" } : {}),
              ...(shouldOverrideBlockPadding ? { blockPadding: "gm-spacing-block-none" } : {}),
            };
          }
        } else if (block._type === "displayBlock") {
          sectionLayout = {
            ...(layoutSettings ?? {}),
            blockPadding: "gm-spacing-block-none",
          };
        } else {
          const shouldAdjustInlinePadding =
            !layoutSettings?.inlinePadding || layoutSettings.inlinePadding === "gm-spacing-shell-inline";

          const shouldAdjustContainer =
            !layoutSettings?.container || layoutSettings.container === "gm-layout-shell";

          const shouldAdjustMaxWidth =
            !layoutSettings?.maxWidth || layoutSettings.maxWidth === "gm-layout-shell-max";

          const needsLayoutOverride = shouldAdjustInlinePadding || shouldAdjustContainer || shouldAdjustMaxWidth;

          if (needsLayoutOverride) {
            sectionLayout = {
              ...(layoutSettings ?? {}),
              ...(shouldAdjustInlinePadding ? { inlinePadding: "gm-spacing-block-inline" } : {}),
              ...(shouldAdjustContainer ? { container: "gm-layout-block" } : {}),
              ...(shouldAdjustMaxWidth ? { maxWidth: "gm-layout-block-max" } : {}),
            };
          }
        }

        return (
          <Section
            key={block._key ?? `${block._type}-${index}`}
            id={anchor}
            theme={theme}
            backgroundTheme={backgroundTheme}
            layout={sectionLayout}
          >
            <Component block={block} />
          </Section>
        );
      })}
    </>
  );
}
