"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import type {
  AnimatedHeadlineBlock,
  BlockRecord,
  BlockSection,
  HeroBlock,
  ThirdsBlock,
  StoryBlock,
  FeaturesBlock,
  FeatureItem,
  ScrollGalleryBlock,
  ShowcaseBlock,
  SplitBlock
} from "@/lib/admin/pages";
import { AnimatedSection, SectionHeading, Pill } from "./AnimatedSection";
import { AnimatedHeadline } from "./AnimatedHeadline";
import { animationPresets, defaultAnimationPreset } from "./animationPresets";
import { useDarkModeShift } from "./useDarkModeShift";
import { getFirebaseApp } from "@/lib/firebaseClient";
import { collection, documentId, getDocs, getFirestore, limit, query, where, type QueryConstraint } from "firebase/firestore";
import { seedComponents, type ComponentRecord } from "@/lib/admin/components";

type BlocksRendererProps = {
  blocks: BlockRecord[];
};

function ThemeShiftRegion({ enabled, children }: { enabled?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { margin: "-15% 0px", amount: 0.2 });
  const [shouldActivate, setShouldActivate] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setShouldActivate(false);
      return;
    }
    if (inView) {
      setShouldActivate(true);
      return;
    }
    // Hold dark mode briefly when hovering near the edge of the viewport to avoid flicker.
    const timeout = window.setTimeout(() => setShouldActivate(false), 140);
    return () => window.clearTimeout(timeout);
  }, [enabled, inView]);

  useDarkModeShift(!!enabled, shouldActivate);
  return (
    <div ref={ref} style={{ width: "100%" }}>
      {children}
    </div>
  );
}

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const useComponentsMap = (componentIds: string[]) => {
  const [map, setMap] = useState<Record<string, ComponentRecord>>({});

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      if (!componentIds.length) {
        setMap({});
        return;
      }
      // Seed fallback when Firebase isn't configured.
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        const entries = seedComponents.filter((component) => componentIds.includes(component.id));
        if (!canceled) {
          setMap(Object.fromEntries(entries.map((component) => [component.id, component])));
        }
        return;
      }

      try {
        const db = getFirestore(getFirebaseApp());
        const ref = collection(db, "components");
        const chunks: string[][] = [];
        for (let i = 0; i < componentIds.length; i += 10) {
          chunks.push(componentIds.slice(i, i + 10));
        }
        const results: ComponentRecord[] = [];
        for (const chunk of chunks) {
          const q = query(ref, where(documentId(), "in", chunk));
          const snapshot = await getDocs(q);
          snapshot.docs.forEach((doc) =>
            results.push({
              id: doc.id,
              ...(doc.data() as Omit<ComponentRecord, "id">)
            })
          );
        }
        if (!canceled) {
          setMap(Object.fromEntries(results.map((component) => [component.id, component])));
        }
      } catch (error) {
        console.error("Failed to load components", error);
        if (!canceled) {
          const entries = seedComponents.filter((component) => componentIds.includes(component.id));
          setMap(Object.fromEntries(entries.map((component) => [component.id, component])));
        }
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [componentIds]);

  return map;
};

const renderMedia = (media?: HeroBlock["media"]) => {
  if (!media?.url) return null;
  const isVideo = media.type === "video" || /\.(mp4|mov|webm|ogg)$/i.test(media.url);
  const frameStyle: CSSProperties = {
    width: "100%",
    maxHeight: 350,
    borderRadius: 16,
    border: "none",
    objectFit: "contain",
    display: "block"
  };
  if (isVideo) {
    return (
      <video
        controls
        style={{ ...frameStyle, height: "auto", objectFit: "contain" }}
        src={media.url}
      >
        Your browser does not support the video tag.
      </video>
    );
  }
  return (
    <img
      src={media.url}
      alt={media.alt ?? ""}
      style={frameStyle}
    />
  );
};

const renderBlockSections = (sections?: BlockSection[]) => {
  if (!sections?.length) return null;
  return (
    <div className="grid" style={{ gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
      {sections.map((section, idx) => (
        <div key={`${section.title}-${idx}`} className="card" style={{ display: "grid", gap: 8 }}>
          <span className="tag">{`0${idx + 1}`}</span>
          <strong style={{ fontSize: 18 }}>{section.title}</strong>
          <p style={{ margin: 0, color: "var(--muted)" }}>{section.body}</p>
        </div>
      ))}
    </div>
  );
};

const mergeComponentFields = (item: FeatureItem, componentsMap: Record<string, ComponentRecord>): FeatureItem => {
  if (!item.componentId) return item;
  const component = componentsMap[item.componentId];
  if (!component) return item;
  return {
    ...item,
    title: component.title ?? item.title,
    body: component.body ?? item.body,
    icon: component.icon ?? item.icon,
    industry: component.industry ?? item.industry,
    type: component.type ?? item.type,
    badge: item.badge,
    mediaFit: component.mediaFit ?? item.mediaFit
  };
};

const FeatureCard = ({
  item,
  style,
  variant = "grid",
  className,
  ...rest
}: {
  item: FeatureItem;
  style?: CSSProperties;
  variant?: "grid" | "gallery";
  className?: string;
} & HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`card${className ? ` ${className}` : ""}`}
    style={{
      padding: variant === "gallery" ? 0 : 14,
      display: "grid",
      gap: variant === "gallery" ? 0 : 8,
      border: "1px solid var(--border-strong)",
      overflow: "hidden",
      background: undefined,
      boxShadow: "none",
      ...style
    }}
    {...rest}
  >
    {variant === "gallery" ? (
      <>
        {item.icon?.url ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            background: "linear-gradient(135deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))",
            overflow: "hidden"
          }}
        >
          <img
            src={item.icon.url}
            alt={item.icon.alt ?? ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: item.mediaFit === "contain" ? "contain" : "cover"
            }}
          />
        </div>
        ) : null}
        <div style={{ padding: "16px 16px 18px", display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 20 }}>{item.title}</strong>
        </div>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 15 }}>{item.body}</p>
        {item.href ? (
          <Link href={item.href as Route} className="nav-link" style={{ width: "fit-content" }}>
            Learn more
            </Link>
          ) : null}
        </div>
      </>
    ) : (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {item.icon?.url ? (
            <img
              src={item.icon.url}
              alt={item.icon.alt ?? ""}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--border)",
                objectFit: item.mediaFit === "contain" ? "contain" : "cover"
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.03)"
              }}
            />
          )}
          <strong style={{ fontSize: 18 }}>{item.title}</strong>
        </div>
        <p style={{ margin: 0, color: "var(--muted)" }}>{item.body}</p>
        {item.href ? (
          <Link href={item.href as Route} className="nav-link" style={{ width: "fit-content" }}>
            Learn more
          </Link>
        ) : null}
      </>
    )}
  </div>
);

const useHeaderHeight = () => {
  const [height, setHeight] = useState<number>(72);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;

    const update = () => setHeight(header.getBoundingClientRect().height || 72);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(header);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
};

const getFullBleedHeroStyle = (headerHeight: number, compact = false): CSSProperties => ({
  width: "calc(100vw - 30px)",
  maxWidth: "calc(100vw - 30px)",
  marginLeft: "calc(50% - 50vw + 15px)",
  marginRight: "calc(50% - 50vw + 15px)",
  marginTop: 15,
  marginBottom: 15,
  minHeight: compact ? "clamp(180px, 32vh, 360px)" : `calc(100vh - ${headerHeight}px - 30px)`,
  padding: compact ? "8px 0" : undefined,
  display: "flex",
  alignItems: "center"
});

const renderHeroBlock = (block: HeroBlock | ThirdsBlock, index: number, headerHeight: number) => {
  const hasMedia = Boolean(block.media?.url);
  const media = renderMedia(block.media);
  const hasBackground = Boolean(block.background?.url);
  const isCompact = block.type === "thirds";
  const fullBleedHeroStyle = getFullBleedHeroStyle(headerHeight, isCompact);
  const removeStroke = !!block.media?.url;
  const heroStyle: CSSProperties = hasBackground
    ? {
        ...fullBleedHeroStyle,
        position: "relative",
        borderColor: isCompact || removeStroke ? "transparent" : "var(--hero-overlay-border)",
        overflow: "hidden",
        padding: 0,
        background: "none",
        boxShadow: "none",
        border: isCompact || removeStroke ? "none" : undefined
      }
    : {
        ...fullBleedHeroStyle,
        boxShadow: "none",
        background: isCompact ? "transparent" : undefined,
        border: isCompact || removeStroke ? "none" : undefined,
        borderColor: isCompact || removeStroke ? "transparent" : undefined
      };
  if (isCompact) {
    heroStyle.background = "transparent";
    heroStyle.border = "none";
    heroStyle.boxShadow = "none";
    heroStyle.backdropFilter = "none";
  }
  const overlay = hasBackground ? (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(145deg, var(--hero-overlay-from), var(--hero-overlay-to)), url(${block.background?.url ?? ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: 0
      }}
    />
  ) : null;
  const innerStyle: CSSProperties = {
    width: "100%",
    maxWidth: "var(--max-width)",
    margin: "0 auto",
    ...(hasBackground ? { padding: isCompact ? 26 : 32, position: "relative", zIndex: 1 } : {}),
    ...(isCompact && !hasBackground ? { padding: "0 12px" } : {})
  };
  const textOnlyContentStyle: CSSProperties = hasMedia
    ? {}
    : { maxWidth: "min(var(--max-width), 960px)", width: "100%", justifySelf: "start" };
  const headingSize = isCompact ? "clamp(36px, 8vw, 56px)" : "clamp(44px, 9vw, 76px)";
  const subtitleSize = isCompact ? 16 : 18;
  const stackGap = isCompact ? 12 : 14;
  const layoutGap = isCompact ? 16 : 18;
  const content = (
    <div className="grid" style={{ gap: stackGap, ...textOnlyContentStyle }}>
      {block.eyebrow ? <Pill>{block.eyebrow}</Pill> : null}
      <h1 style={{ fontSize: headingSize, lineHeight: 1.05, margin: 0 }}>{block.title}</h1>
      {block.subtitle ? (
        <p style={{ maxWidth: 720, color: "var(--muted)", margin: 0, fontSize: subtitleSize }}>{block.subtitle}</p>
      ) : null}
      <div style={{ display: "flex", gap: isCompact ? 10 : 12, flexWrap: "wrap" }}>
        {block.primaryCtaLabel && block.primaryCtaHref ? (
          <Link className="btn" href={block.primaryCtaHref as Route}>
            {block.primaryCtaLabel}
          </Link>
        ) : null}
        {block.secondaryCtaLabel && block.secondaryCtaHref ? (
          <Link className="btn secondary" href={block.secondaryCtaHref as Route}>
            {block.secondaryCtaLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );

  if (block.alignment === "centered" || !media) {
    if (isCompact) {
      return (
        <section
          key={block.id ?? index}
          style={{ ...heroStyle, position: hasBackground ? "relative" : heroStyle.position }}
          className="thirds-block"
        >
          {overlay}
          <div className="grid" style={{ gap: layoutGap, alignItems: "center", ...innerStyle }}>
            {content}
            {media}
          </div>
        </section>
      );
    }
    return (
      <AnimatedSection
        key={block.id ?? index}
        index={index}
        style={heroStyle}
        animated={false}
        variant={isCompact ? "plain" : "card"}
      >
        {overlay}
        <div className="grid" style={{ gap: layoutGap, alignItems: "center", ...innerStyle }}>
          {content}
          {media}
        </div>
      </AnimatedSection>
    );
  }

  const mediaFirst = block.alignment === "image_left";

  if (isCompact) {
    return (
      <section
        key={block.id ?? index}
        style={{ ...heroStyle, position: hasBackground ? "relative" : heroStyle.position }}
        className="thirds-block"
      >
        {overlay}
        <div
          className="grid"
          style={{
            ...(innerStyle ?? {}),
            gap: isCompact ? 16 : 20,
            alignItems: "center",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
          }}
        >
          {mediaFirst ? media : content}
          {mediaFirst ? content : media}
        </div>
      </section>
    );
  }

  return (
    <AnimatedSection
      key={block.id ?? index}
      index={index}
      style={heroStyle}
      animated={false}
      variant={isCompact ? "plain" : "card"}
    >
      {overlay}
      <div
        className="grid"
        style={{
          ...(innerStyle ?? {}),
          gap: isCompact ? 16 : 20,
          alignItems: "center",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
        }}
      >
        {mediaFirst ? media : content}
        {mediaFirst ? content : media}
      </div>
    </AnimatedSection>
  );
};

const renderAnimatedHeadlineBlock = (block: AnimatedHeadlineBlock, index: number, headerHeight: number) => (
  <AnimatedHeadline key={block.id ?? index} block={block} headerOffset={headerHeight} />
);

const renderStoryBlock = (block: StoryBlock, index: number) => {
  const media = renderMedia(block.media);
  const sectionsList = renderBlockSections(block.sections);

  const storyHeading = (
    <div className="grid" style={{ gap: 10 }}>
      <SectionHeading title={block.heading} />
      {block.variant !== "split_with_quote" ? (
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 16 }}>{block.body}</p>
      ) : null}
    </div>
  );

  if (block.variant === "two_column") {
    return (
      <AnimatedSection key={block.id ?? index} index={index}>
        <div
          className="grid"
          style={{ gap: 18, alignItems: "start", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          <div className="grid" style={{ gap: 12 }}>
            {storyHeading}
            {sectionsList}
          </div>
          {media}
        </div>
      </AnimatedSection>
    );
  }

  if (block.variant === "split_with_quote") {
    return (
      <AnimatedSection key={block.id ?? index} index={index}>
        <div className="grid" style={{ gap: 16 }}>
          {block.body ? (
            <div
              style={{
                padding: 18,
                borderLeft: "3px solid var(--accent)",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 12
              }}
            >
              <p style={{ margin: 0, fontSize: 18, lineHeight: 1.4 }}>{block.body}</p>
            </div>
          ) : null}
          <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {storyHeading}
            {media}
          </div>
          {sectionsList}
        </div>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection key={block.id ?? index} index={index}>
      <div className="grid" style={{ gap: 12 }}>
        {storyHeading}
        {media}
        {sectionsList}
      </div>
    </AnimatedSection>
  );
};

const renderSplitBlock = (block: SplitBlock, index: number) => {
  const renderSplitMedia = () => {
    if (!block.media?.url) return null;
    const isVideo = block.media.type === "video" || /\.(mp4|mov|webm|ogg)$/i.test(block.media.url);
    return (
      <div
        data-split-media
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--border-strong)",
          background: "rgba(255,255,255,0.02)"
        }}
      >
        {isVideo ? (
          <video
            src={block.media.url}
            controls
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={block.media.url}
            alt={block.media.alt ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    );
  };

  const media = renderSplitMedia();
  const mediaFirst = block.mediaSide === "left";
  const preset = animationPresets[defaultAnimationPreset];
  const content = (
    <div className="grid" style={{ gap: 12 }}>
      <SectionHeading eyebrow={block.eyebrow} title={block.heading} />
      {block.body ? <p style={{ margin: 0, color: "var(--muted)", fontSize: 16 }}>{block.body}</p> : null}
      {block.ctaLabel && block.ctaHref ? (
        <Link className="btn" href={block.ctaHref as Route} style={{ width: "fit-content" }}>
          {block.ctaLabel}
        </Link>
      ) : null}
    </div>
  );

  if (!media) {
    return (
      <motion.section
        key={block.id ?? index}
        style={{ width: "100%" }}
        variants={preset.item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        custom={index}
      >
        {content}
      </motion.section>
    );
  }

  return (
    <motion.section
      key={block.id ?? index}
      style={{ width: "100%", paddingLeft: 15, paddingRight: 15 }}
      data-split-section
      variants={preset.item}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={index}
    >
      <style>{`
        @media (max-width: 900px) {
          [data-split-media] {
            max-width: 540px;
            margin-left: auto;
            margin-right: auto;
          }
        }
        @media (max-width: 768px) {
          [data-split-section] {
            padding-left: 15px;
            padding-right: 15px;
          }
          [data-split-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div
        className="grid"
        data-split-grid
        style={{ gap: 18, alignItems: "center", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
      >
        {mediaFirst ? media : content}
        {mediaFirst ? content : media}
      </div>
    </motion.section>
  );
};

const FeaturesBlockSection = ({
  block,
  index,
  componentsMap
}: {
  block: FeaturesBlock;
  index: number;
  componentsMap: Record<string, ComponentRecord>;
}) => {
  const paddingX = 16;
  const minSidePadding = 15;
  const items = (block.items ?? [])
    .map((item) => mergeComponentFields(item, componentsMap))
    .slice(0, 3);
  const galleryPreset = animationPresets[defaultAnimationPreset];
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const galleryInView = useInView(galleryRef, { amount: 0.3, once: true });

  return (
    <section
      key={block.id ?? index}
      style={{
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        padding: "36px 0 42px"
      }}
    >
      <div className="grid" style={{ gap: 18 }}>
        <div
          style={{
            width: "100%",
            maxWidth: "var(--max-width)",
            margin: "0 auto",
            padding: `0 ${paddingX}px`,
            textAlign: "center"
          }}
        >
          <SectionHeading eyebrow={block.eyebrow} title={block.heading} kicker={block.body} align="center" />
        </div>
        <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
          <motion.div
            ref={galleryRef}
            className="features-gallery-track"
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(260px, 380px)",
              gap: 16,
              justifyContent: "center",
              paddingLeft: `max(${minSidePadding}px, calc((100vw - var(--max-width)) / 2 + ${paddingX}px))`,
              paddingRight: `max(${minSidePadding}px, calc((100vw - var(--max-width)) / 2 + ${paddingX}px))`
            }}
            variants={galleryPreset.container}
            initial="hidden"
            animate={galleryInView ? "visible" : "hidden"}
          >
            {items.map((item, idx) => (
              <motion.div key={`${item.title}-${idx}`} variants={galleryPreset.item}>
                <FeatureCard
                  item={item}
                  variant="gallery"
                  style={{ minHeight: "100%" }}
                  className="features-gallery-card"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ScrollGalleryBlockSection = ({
  block,
  index,
  headerHeight,
  componentsMap
}: {
  block: ScrollGalleryBlock;
  index: number;
  headerHeight: number;
  componentsMap: Record<string, ComponentRecord>;
}) => {
  const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );

  const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );

  const navButtonStyle: CSSProperties = {
    width: 44,
    height: 44,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border-strong)"
  };

  const contentPaddingX = 12;
  const bleedContentStyle: CSSProperties = {
    width: "calc(100vw - 30px)",
    maxWidth: "calc(100vw - 30px)",
    marginLeft: "calc(50% - 50vw + 15px)",
    marginRight: "calc(50% - 50vw + 15px)",
    display: "grid",
    justifyContent: "center"
  };
  const constrainedInnerStyle: CSSProperties = {
    width: "100%",
    maxWidth: "var(--max-width)"
  };
  const fullBleedStyle: CSSProperties = {
    width: "100vw",
    maxWidth: "100vw",
    marginLeft: "calc(50% - 50vw)",
    marginRight: "calc(50% - 50vw)",
    padding: "36px 0 42px",
    display: "flex",
    alignItems: "center",
    overflow: "hidden"
  };
  const fadeWidth = 72;
  const [fadeState, setFadeState] = useState({ hasOverflow: false, left: false, right: false });
  const edgeFadeMask =
    fadeState.left || fadeState.right
      ? `linear-gradient(90deg, ${fadeState.left ? `transparent 0, #000 ${fadeWidth}px` : "#000 0"}, #000 calc(100% - ${fadeState.right ? fadeWidth : 0}px), ${fadeState.right ? "transparent 100%" : "#000 100%"})`
      : "linear-gradient(90deg, #000 0, #000 100%)";
  const updateFadeState = (el: HTMLElement | null) => {
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth - clientWidth > 4;
    const left = hasOverflow && scrollLeft > 4;
    const right = hasOverflow && scrollLeft + clientWidth < scrollWidth - 4;
    setFadeState((prev) => {
      if (prev.hasOverflow === hasOverflow && prev.left === left && prev.right === right) return prev;
      return { hasOverflow, left, right };
    });
  };

  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const galleryPreset = animationPresets[defaultAnimationPreset];
  const galleryInView = useInView(trackRef, { amount: 0.35, once: true });

  const scrollByCards = (direction: "prev" | "next") => {
    const track = trackRef.current;
    const scroller = scrollContainerRef.current;
    if (!track || !scroller) return;
    const firstCard = track.querySelector<HTMLElement>("[data-gallery-card]");
    const cardWidth = firstCard?.offsetWidth ?? 320;
    const gap = 16;
    const delta = direction === "next" ? cardWidth + gap : -1 * (cardWidth + gap);
    scroller.scrollBy({ left: delta, behavior: "smooth" });
  };

  const resolvedItems = (block.items ?? []).map((item) => mergeComponentFields(item, componentsMap));

  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const handle = () => updateFadeState(scroller);
    handle();
    scroller.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      scroller.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, []);

  useEffect(() => {
    updateFadeState(scrollContainerRef.current);
  }, [resolvedItems.length]);

  return (
    <section key={block.id ?? index} style={fullBleedStyle}>
      <div style={{ ...bleedContentStyle, gap: 18 }}>
        <div style={{ ...constrainedInnerStyle, padding: `0 ${contentPaddingX}px`, display: "flex", alignItems: "flex-end", justifyContent: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            <SectionHeading eyebrow={block.eyebrow} title={block.heading} kicker={block.body} />
          </div>
          <div style={{ display: "flex", gap: 10, marginLeft: "auto", alignSelf: "flex-end" }}>
            <button
              type="button"
              className="btn secondary"
              aria-label="Previous"
              onClick={() => scrollByCards("prev")}
              style={navButtonStyle}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="btn secondary"
              aria-label="Next"
              onClick={() => scrollByCards("next")}
              style={navButtonStyle}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
        <div style={{ position: "relative", width: "100%", ...constrainedInnerStyle, overflow: "hidden" }}>
          <div
            ref={scrollContainerRef}
            style={{
              overflowX: "auto",
              paddingBottom: 12,
              paddingLeft: `${contentPaddingX}px`,
              paddingRight: `${contentPaddingX}px`,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitMaskImage: edgeFadeMask,
              maskImage: edgeFadeMask,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat"
            }}
          >
            <style>{`
              [data-scroll-gallery]::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <motion.div
              ref={trackRef}
              data-scroll-gallery
              style={{
                display: "grid",
                gridAutoFlow: "column",
                gridAutoColumns: "minmax(320px, 480px)",
                gap: 16,
                padding: `0 ${contentPaddingX + 48}px 16px 0`,
                scrollSnapType: "x mandatory"
              }}
              variants={galleryPreset.container}
              initial="hidden"
              animate={galleryInView ? "visible" : "hidden"}
            >
              {resolvedItems.map((item, cardIdx) => (
                <motion.div key={`${item.title}-${cardIdx}`} variants={galleryPreset.item}>
                  <FeatureCard
                    item={item}
                    variant="gallery"
                    style={{
                      minHeight: "100%",
                      scrollSnapAlign: "start"
                    }}
                    data-gallery-card
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

type ShowcaseMediaItem = {
  id: string;
  url: string;
  alt?: string;
  mediaType?: "image" | "video";
  width?: number;
  height?: number;
  isPlaceholder?: boolean;
};

const ShowcaseBlockSection = ({
  block,
  index,
  headerHeight
}: {
  block: ShowcaseBlock;
  index: number;
  headerHeight: number;
}) => {
  const basePaddingX = 0;
  const frameRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1280);
  const [items, setItems] = useState<ShowcaseMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const zSeedsRef = useRef<Record<string, number>>({});
  const isNarrow = containerWidth < 720;
  const mobilePaddingX = 15;
  const paddingX = isNarrow ? mobilePaddingX : basePaddingX;
  const typeFilter = block.typeFilter?.trim();
  const industryFilter = block.industryFilter?.trim();
  const featuredOnly = Boolean(block.featuredOnly);
  const resultsLimit = clampNumber(block.limit ?? 6, 1, 24);
  const presetName = block.animationPreset ?? defaultAnimationPreset;
  const preset = animationPresets[presetName] ?? animationPresets[defaultAnimationPreset];
  const stackInView = useInView(stackRef, { amount: 0.2, once: true });

  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const width = el.getBoundingClientRect().width;
      if (width) setContainerWidth(width);
      setViewportHeight(window.innerHeight);
    };
    update();
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      if (!typeFilter) {
        setItems([]);
        return;
      }
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        setItems([]);
        return;
      }
      try {
        setLoading(true);
        const db = getFirestore(getFirebaseApp());
        const mediaRef = collection(db, "media");
        const constraints: QueryConstraint[] = [where("type", "==", typeFilter)];
        if (industryFilter) {
          constraints.push(where("industry", "==", industryFilter));
        }
        if (featuredOnly) {
          constraints.push(where("featured", "==", true));
        }
        constraints.push(limit(resultsLimit));
        const q = query(mediaRef, ...constraints);
        const snapshot = await getDocs(q);
        const data: ShowcaseMediaItem[] = snapshot.docs.map((doc) => {
          const raw = doc.data() as any;
          const mediaType = raw.mediaType ?? raw.type ?? "image";
          return {
            id: doc.id,
            url: raw.url,
            alt: raw.alt ?? raw.name ?? "",
            mediaType: mediaType === "video" ? "video" : "image",
            width: raw.width,
            height: raw.height
          };
        });
        if (!canceled) {
          setItems(data);
        }
      } catch (error) {
        console.error("Failed to load showcase media", error);
        if (!canceled) setItems([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [typeFilter, industryFilter, featuredOnly, resultsLimit]);

  const displayItems = (items.length ? items.slice(0, resultsLimit) : []).slice(0, resultsLimit);
  const cardCount = displayItems.length || 1;

  const availableWidth = Math.max(320, containerWidth - paddingX * 2);
  const overlap = isNarrow ? 54 : clampNumber(Math.round(availableWidth / 18), 42, 120);
  const minCardWidth = 220;
  const maxCardWidth = 520;
  const computedFitWidth = (availableWidth + overlap * (cardCount - 1)) / cardCount;
  const fittedCardWidth = clampNumber(computedFitWidth, minCardWidth, maxCardWidth);
  const shouldScroll = (fittedCardWidth === minCardWidth && cardCount > 1) || isNarrow;
  const cardWidth = shouldScroll ? Math.min(320, Math.max(minCardWidth, fittedCardWidth)) : fittedCardWidth;
  const maxCardHeight = shouldScroll
    ? clampNumber(viewportHeight !== null ? viewportHeight - headerHeight - 96 : 560, 260, 660)
    : null;
  const totalWidth = cardCount * cardWidth - overlap * (cardCount - 1);
  const scrollPaddingX = shouldScroll ? 0 : paddingX;

  useEffect(() => {
    if (!shouldScroll) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    const viewportWidth = scroller.clientWidth || availableWidth;
    const effectiveViewportWidth = viewportWidth - scrollPaddingX * 2;
    const start = Math.max(0, totalWidth / 2 - effectiveViewportWidth / 2);
    scroller.scrollTo({ left: start, behavior: "auto" });
  }, [shouldScroll, totalWidth, availableWidth, resultsLimit, scrollPaddingX]);

  useEffect(() => {
    displayItems.forEach((item, idx) => {
      const key = item.id ?? `card-${idx}`;
      if (!(key in zSeedsRef.current)) {
        zSeedsRef.current[key] = Math.random();
      }
    });
  }, [displayItems]);
  const rotations = [-6, -2.5, 3.5, 1, -4.5, 5, -1.5];

  const sectionPadding = isNarrow ? "0" : "40px 0 52px";

  return (
    <section
      key={block.id ?? index}
      style={{
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        padding: sectionPadding,
        display: "flex",
        alignItems: isNarrow ? "flex-start" : "center",
        overflowX: "hidden",
        overflowY: "visible"
      }}
    >
      <div
        ref={frameRef}
        style={{
          width: "100%",
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: 0,
          display: "grid",
          gap: 12,
          position: "relative",
          zIndex: 1,
          overflow: "visible"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "var(--max-width)",
            margin: "0 auto",
            textAlign: "center",
            display: "grid",
            gap: 10,
            padding: `0 ${paddingX}px`
          }}
        >
          <SectionHeading eyebrow={block.eyebrow} title={block.heading ?? "Showcase"} kicker={block.subhead} align="center" />
        </div>
        <div
          ref={scrollRef}
          style={{
            width: "100%",
            overflowX: shouldScroll ? "auto" : "visible",
            overflowY: "visible",
            padding: shouldScroll ? `0 ${scrollPaddingX}px 12px` : "0",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
          data-showcase-scroll={shouldScroll ? "true" : "false"}
        >
          {shouldScroll ? (
            <style>{`
              [data-showcase-scroll="true"]::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          ) : null}
          <motion.div
            ref={stackRef}
            style={{
              position: "relative",
              width: shouldScroll ? totalWidth : "100%",
              display: "flex",
              justifyContent: shouldScroll ? "flex-start" : "center",
              alignItems: "center",
              padding: "12px 0",
              opacity: loading && !items.length ? 0.65 : 1,
              paddingLeft: shouldScroll ? 4 : 0,
              paddingRight: shouldScroll ? 4 : 0
            }}
            variants={preset.container}
            initial="hidden"
            animate={stackInView ? "visible" : "hidden"}
          >
            {displayItems.length ? (
              displayItems.map((item, cardIdx) => {
                const fallbackRatio = 4 / 3;
                const cardKey = item.id ?? `card-${cardIdx}`;
                const seed = zSeedsRef.current[cardKey] ?? 0;
                const baseZ = Math.round(seed * 100);
                const isHovered = hoveredId === cardKey;
                const ratio =
                  ratios[item.id] ||
                  (item.width && item.height && item.width > 0 && item.height > 0 ? item.width / item.height : fallbackRatio);
                const cardW = Math.min(cardWidth, (maxCardHeight ?? Infinity) * ratio);
                const cardH = cardW / ratio;
                const isVideo = item.mediaType === "video" || /\.(mp4|mov|webm|ogg)$/i.test(item.url);
                const hue = (cardIdx * 37) % 360;
                const baseRotate = rotations[cardIdx % rotations.length];
                const hoverRotate = baseRotate * 0.4;

                return (
                  <motion.div
                    key={cardKey}
                    custom={cardIdx}
                    variants={preset.item}
                    style={{
                      marginLeft: cardIdx === 0 ? 0 : -overlap,
                      zIndex: isHovered ? baseZ + 200 : baseZ + 50,
                      rotate: `${isHovered ? hoverRotate : baseRotate}deg`,
                      transformOrigin: "center",
                      translateY: isHovered ? (cardIdx % 2 === 0 ? -2 : 4) : cardIdx % 2 === 0 ? -4 : 6,
                      transition: "margin 0.24s ease, transform 0.3s ease"
                    }}
                    onMouseEnter={() => setHoveredId(cardKey)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      style={{
                        width: cardW,
                        height: cardH,
                        maxHeight: shouldScroll ? maxCardHeight ?? undefined : undefined,
                        borderRadius: 16,
                        overflow: "hidden",
                        border: "1px solid var(--border-strong)",
                        boxShadow: "none",
                        background: item.isPlaceholder
                          ? `linear-gradient(135deg, hsla(${hue}, 70%, 62%, 0.16), rgba(255,255,255,0.04))`
                          : "rgba(255,255,255,0.02)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "width 0.24s ease, height 0.24s ease"
                      }}
                    >
                      {item.isPlaceholder ? (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: `linear-gradient(120deg, hsla(${hue}, 78%, 68%, 0.22), hsla(${(hue + 40) % 360}, 70%, 62%, 0.12))`
                          }}
                        />
                      ) : isVideo ? (
                        <video
                          src={item.url}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          muted
                          playsInline
                          loop
                          onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            if (video.videoWidth && video.videoHeight) {
                              setRatios((prev) => ({ ...prev, [item.id]: video.videoWidth / video.videoHeight }));
                            }
                          }}
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.alt ?? ""}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          loading="lazy"
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            if (img.naturalWidth && img.naturalHeight) {
                              setRatios((prev) => ({ ...prev, [item.id]: img.naturalWidth / img.naturalHeight }));
                            }
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export function BlocksRenderer({ blocks }: BlocksRendererProps) {
  const headerHeight = useHeaderHeight();
  const shouldForceDarkOnLoad = useMemo(() => {
    const first = blocks[0];
    if (!first) return false;
    if (first.type === "animated_headline") return false;
    return !!first.enableDarkModeOnScroll;
  }, [blocks]);
  const initialThemeScript = useMemo(() => {
    const forceDark = shouldForceDarkOnLoad;
    return `(function(){try{var root=document.documentElement;if(!root)return;var base=root.getAttribute("data-base-theme");if(base!=="light"&&base!=="dark"){var prefersDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)");var isDark=prefersDark&&prefersDark.matches;root.setAttribute("data-base-theme", isDark ? "dark" : "light");}if(${forceDark ? "true" : "false"} && root.getAttribute("data-theme")!=="dark"){root.setAttribute("data-theme","dark");}}catch(e){}})();`;
  }, [shouldForceDarkOnLoad]);
  const componentIds = useMemo(() => {
    const ids = new Set<string>();
    blocks.forEach((block) => {
      if (block.type === "features" || block.type === "scroll_gallery") {
        (block.items ?? []).forEach((item) => {
          if (item.componentId) ids.add(item.componentId);
        });
      }
    });
    return Array.from(ids);
  }, [blocks]);
  const componentsMap = useComponentsMap(componentIds);

  return (
    <>
      {shouldForceDarkOnLoad ? (
        <script id="initial-theme-shift" dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      ) : null}
      <div className="grid" style={{ gap: 24 }}>
        {blocks.map((block, index) => {
          const key = block.id ?? index;
          let element: JSX.Element;
          if (block.type === "hero" || block.type === "thirds") {
            element = renderHeroBlock(block, index, headerHeight);
          } else if (block.type === "animated_headline") {
            element = renderAnimatedHeadlineBlock(block, index, headerHeight);
        } else if (block.type === "scroll_gallery") {
          element = (
            <ScrollGalleryBlockSection
              key={key}
              block={block}
              index={index}
              headerHeight={headerHeight}
              componentsMap={componentsMap}
            />
          );
        } else if (block.type === "showcase") {
          element = <ShowcaseBlockSection key={key} block={block} index={index} headerHeight={headerHeight} />;
        } else if (block.type === "split") {
          element = renderSplitBlock(block, index);
        } else if (block.type === "features") {
          element = <FeaturesBlockSection key={key} block={block} index={index} componentsMap={componentsMap} />;
        } else {
          element = renderStoryBlock(block, index);
        }
          const shouldWrap = block.type !== "animated_headline" && block.enableDarkModeOnScroll;
          if (shouldWrap) {
            return (
              <ThemeShiftRegion key={key} enabled>
                {element}
              </ThemeShiftRegion>
            );
          }
          return element;
        })}
      </div>
    </>
  );
}
