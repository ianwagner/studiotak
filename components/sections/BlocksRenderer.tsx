"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useInView, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import type {
  AnimatedHeadlineBlock,
  ArticleFeaturedBlock,
  ArticleGridBlock,
  BlockRecord,
  BlockSection,
  DividerBlock,
  ContactBlock,
  HeroBlock,
  ThirdsBlock,
  StoryBlock,
  FeaturesBlock,
  FeatureItem,
  FeatureSpotlightBlock,
  ScrollGalleryBlock,
  ShowcaseBlock,
  LogosBlock,
  SplitBlock,
  ProductDemoBlock,
  StatsBlock,
  ComparisonBlock
} from "@/lib/admin/pages";
import { AnimatedSection, SectionHeading, Pill } from "./AnimatedSection";
import { AnimatedHeadline } from "./AnimatedHeadline";
import { animationPresets, defaultAnimationPreset } from "./animationPresets";
import { useDarkModeShift } from "./useDarkModeShift";
import { getFirebaseApp } from "@/lib/firebaseClient";
import { collection, getDocs, getFirestore, limit, query, where, type QueryConstraint } from "firebase/firestore";
import Script from "next/script";
import Head from "next/head";
import Link from "next/link";
import AdReviewDemo from "@/components/demos/AdReviewDemo";

const viewportWidthVar = "var(--full-bleed-width, 100vw)";
const viewportShiftVar = "var(--full-bleed-shift, calc(50% - 50vw))";

const formatDate = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    REQUIRED_CODE_ERROR_MESSAGE?: string;
    LOCALE?: string;
    EMAIL_INVALID_MESSAGE?: string;
    SMS_INVALID_MESSAGE?: string;
    REQUIRED_ERROR_MESSAGE?: string;
    GENERIC_INVALID_MESSAGE?: string;
    translation?: {
      common: {
        selectedList: string;
        selectedLists: string;
        selectedOption: string;
        selectedOptions: string;
      };
    };
    AUTOHIDE?: boolean;
    handleCaptchaResponse?: () => void;
    grecaptcha?: {
      render?: (
        container: HTMLElement | string,
        params: { sitekey: string; callback?: () => void; theme?: string }
      ) => void;
      reset?: (widgetId?: number | string) => void;
    };
  }
}

type BlocksRendererProps = {
  blocks: BlockRecord[];
};

const trackGaEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
};

const AnchorAwareLink = ({
  href,
  className,
  children,
  style,
  trackingName,
  trackingSection
}: {
  href: string;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  trackingName?: string;
  trackingSection?: string;
}) => {
  if (!href) return null;
  const isExternal = /^https?:\/\//i.test(href);
  const isAnchor = href.startsWith("#");
  const eventName = trackingName ?? (className?.includes("btn") ? "cta_click" : undefined);
  const handleClick = () => {
    if (!eventName) return;
    const text = typeof children === "string" ? children : undefined;
    trackGaEvent(eventName, {
      link_url: href,
      link_text: text,
      section: trackingSection ?? "unknown"
    });
  };

  if (isExternal) {
    return (
      <a className={className} href={href} style={style} target="_blank" rel="noreferrer noopener" onClick={handleClick}>
        {children}
      </a>
    );
  }
  if (!isAnchor && href.startsWith("/")) {
    return (
      <Link className={className} href={href as any} style={style} onClick={handleClick}>
        {children}
      </Link>
    );
  }
  return (
    <a className={className} href={href} style={style} onClick={handleClick} {...(isAnchor ? { "data-anchor": true } : {})}>
      {children}
    </a>
  );
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
    // Hold dark mode when near the edge of the viewport — longer hold reduces flicker during scroll.
    const timeout = window.setTimeout(() => setShouldActivate(false), 200);
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

const useViewportWidth = () => {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
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

const getTimelinePhaseWindow = (phase: number, phaseCount: number) => {
  const start = 0.08;
  const end = 0.92;
  const phaseSpan = (end - start) / Math.max(phaseCount, 1);
  return {
    start: start + phase * phaseSpan,
    end: start + (phase + 0.86) * phaseSpan
  };
};

const StoryTimelineStep = ({
  section,
  idx,
  total,
  scrollProgress
}: {
  section: BlockSection;
  idx: number;
  total: number;
  scrollProgress: MotionValue<number>;
}) => {
  const phaseCount = Math.max(total * 2 - 1, 1);
  const stepWindow = getTimelinePhaseWindow(idx * 2, phaseCount);
  const lineWindow = getTimelinePhaseWindow(idx * 2 + 1, phaseCount);
  const stepOpacity = useTransform(scrollProgress, [stepWindow.start, stepWindow.end], [0, 1]);
  const stepY = useTransform(scrollProgress, [stepWindow.start, stepWindow.end], [12, 0]);
  const lineScaleY = useTransform(scrollProgress, [lineWindow.start, lineWindow.end], [0, 1]);

  return (
    <div className="story-step">
      <div className="story-step-marker">
        <motion.span className="story-step-badge" style={{ opacity: stepOpacity, y: stepY }}>
          {`0${idx + 1}`}
        </motion.span>
        {idx < total - 1 ? (
          <motion.div className="story-step-line" style={{ scaleY: lineScaleY }} />
        ) : null}
      </div>
      <motion.div className="story-step-content" style={{ opacity: stepOpacity, y: stepY }}>
        <strong style={{ fontSize: "var(--font-size-title-sm)" }}>{section.title}</strong>
        <p style={{ margin: 0, color: "var(--muted)" }}>{section.body}</p>
      </motion.div>
    </div>
  );
};

const StoryTimeline = ({ sections }: { sections: BlockSection[] }) => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 78%", "end 42%"]
  });

  return (
    <div className="story-timeline" ref={timelineRef}>
      {sections.map((section, idx) => (
        <StoryTimelineStep
          key={`${section.title}-${idx}`}
          section={section}
          idx={idx}
          total={sections.length}
          scrollProgress={scrollYProgress}
        />
      ))}
    </div>
  );
};

const renderBlockSections = (sections?: BlockSection[]) => {
  if (!sections?.length) return null;
  return <StoryTimeline sections={sections} />;
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
} & HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`card${className ? ` ${className}` : ""}`}
      style={{
        padding: variant === "gallery" ? 0 : 14,
        display: variant === "gallery" ? "flex" : "grid",
        flexDirection: variant === "gallery" ? "column" : undefined,
        gap: variant === "gallery" ? 0 : 8,
        border: "1px solid var(--border-strong)",
        overflow: "hidden",
        background: undefined,
        boxShadow: "none",
        height: "100%",
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
                background: "transparent",
                overflow: "hidden",
                padding: "16px 16px 0",
                boxSizing: "border-box"
              }}
            >
              <img
                src={item.icon.url}
                alt={item.icon.alt ?? ""}
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 240,
                  display: "block",
                  objectFit: item.mediaFit === "contain" ? "contain" : "cover"
                }}
              />
            </div>
          ) : null}
          <div
            style={{
              padding: "16px 16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-start",
              justifyContent: "flex-start",
              flex: 1
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ fontSize: "var(--font-size-title-md)" }}>{item.title}</strong>
            </div>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--font-size-body)" }}>{item.body}</p>
            {item.href ? (
              <AnchorAwareLink
                href={item.href}
                className="nav-link"
                trackingName="content_link_click"
                trackingSection="features_gallery"
                style={{ width: "fit-content" }}
              >
                Learn more
              </AnchorAwareLink>
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
            <strong style={{ fontSize: "var(--font-size-title-sm)" }}>{item.title}</strong>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>{item.body}</p>
          {item.href ? (
            <AnchorAwareLink
              href={item.href}
              className="nav-link"
              trackingName="content_link_click"
              trackingSection="features_grid"
              style={{ width: "fit-content" }}
            >
              Learn more
            </AnchorAwareLink>
          ) : null}
        </>
      )}
    </div>
  );
};

const useHeaderHeight = () => {
  // Always start with the CSS default to avoid SSR/client hydration mismatch.
  // The useLayoutEffect below will correct it immediately on mount.
  const [height, setHeight] = useState<number>(72);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;

    const applyHeight = (next: number) => {
      const rounded = Math.round(next || 72);
      setHeight((prev) => {
        if (Math.abs(prev - rounded) < 1) return prev;
        return rounded;
      });
      document.documentElement.style.setProperty("--header-height", `${rounded}px`);
    };

    const update = () => {
      const measured = header.getBoundingClientRect().height || 72;
      applyHeight(measured);
    };

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

const sectionPx = "var(--section-px, 15px)";

const getFullBleedHeroStyle = (headerHeight: number, compact = false, viewportWidth: number | null = null): CSSProperties => {
  const isMobile = viewportWidth !== null && viewportWidth < 680;
  const gutter = isMobile ? 0 : 30;
  // On Safari iOS, --full-bleed-mobile-inset is 0px because --full-bleed-width is container-relative (100%)
  // and the container's own padding already provides the margin. On other browsers it equals --section-px.
  const mobileInset = "var(--full-bleed-mobile-inset, var(--section-px, 15px))";
  const leftInset = isMobile ? `max(${mobileInset}, env(safe-area-inset-left, 0px))` : `${gutter / 2}px`;
  const rightInset = isMobile ? `max(${mobileInset}, env(safe-area-inset-right, 0px))` : `${gutter / 2}px`;
  // Width must subtract both side margins to prevent right-edge overflow
  const fullBleedWidth = isMobile
    ? `calc(var(--full-bleed-width, 100vw) - ${leftInset} - ${rightInset})`
    : `calc(var(--full-bleed-width, 100vw) - ${gutter}px)`;
  const fullBleedShiftLeft = `calc(var(--full-bleed-shift, calc(50% - 50vw)) + ${leftInset})`;
  const fullBleedShiftRight = `calc(var(--full-bleed-shift, calc(50% - 50vw)) + ${rightInset})`;
  const fullBleedHeight = "var(--full-bleed-height, 100vh)";
  // Use the CSS variable instead of the JS value to avoid SSR/client hydration mismatch
  const headerVar = "var(--header-height, 72px)";
  const heroMaxHeight = compact ? undefined : `calc(${fullBleedHeight} - ${headerVar} - 30px)`;
  return {
    width: fullBleedWidth,
    maxWidth: fullBleedWidth,
    marginLeft: fullBleedShiftLeft,
    marginRight: fullBleedShiftRight,
    marginTop: 15,
    marginBottom: 15,
    minHeight: compact ? "clamp(180px, 32vh, 360px)" : `calc(${fullBleedHeight} - ${headerVar} - 30px)`,
    maxHeight: heroMaxHeight,
    padding: compact ? "8px 0" : undefined,
    display: "flex",
    alignItems: "center",
    overflow: "hidden"
  };
};

type HeroMediaItem = {
  id: string;
  url: string;
  alt?: string;
  mediaType?: "image" | "video";
  width?: number;
  height?: number;
};

const heroPlaceholderPalette = ["#e1e9ff", "#e8f7ff", "#f4e8ff", "#ffeae3", "#eaf3e0", "#f3f1e8"];

const buildHeroPlaceholderMedia = (count: number, seed?: HeroBlock["media"]): HeroMediaItem[] => {
  if (seed?.url) {
    const mediaType = seed.type === "video" ? "video" : "image";
    return Array.from({ length: Math.max(count, 6) }, (_, idx) => ({
      id: `${seed.url}-${idx}`,
      url: seed.url,
      alt: seed.alt ?? `Hero media ${idx + 1}`,
      mediaType,
      width: seed.width,
      height: seed.height
    }));
  }
  return Array.from({ length: Math.max(count, 9) }, (_, idx) => {
    const color = heroPlaceholderPalette[idx % heroPlaceholderPalette.length];
    const label = `Media ${idx + 1}`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='520' viewBox='0 0 400 520' fill='none'><defs><linearGradient id='g${idx}' x1='0' y1='0' x2='1' y2='1'><stop stop-color='${color}' offset='0%'/><stop stop-color='${color}' stop-opacity='0.7' offset='100%'/></linearGradient></defs><rect width='400' height='520' rx='22' fill='url(%23g${idx})'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, Helvetica, Arial, sans-serif' font-size='42' font-weight='700' fill='%23222' opacity='0.28'>${label}</text></svg>`;
    return {
      id: `placeholder-${idx}`,
      url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
      alt: label,
      mediaType: "image",
      width: 3,
      height: 4
    };
  });
};

const DynamicHeroColumns = ({
  block,
  innerStyle,
  layoutGap,
  content,
  isCompact,
  gridTemplate,
  hideColumns,
  audienceFilter
}: {
  block: HeroBlock;
  innerStyle: CSSProperties;
  layoutGap: number;
  content: ReactNode;
  isCompact: boolean;
  gridTemplate: string;
  hideColumns: boolean;
  audienceFilter?: string;
}) => {
  const [items, setItems] = useState<HeroMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const industryTag = audienceFilter || block.mediaIndustryTag?.trim();
  const typeTag = block.mediaTypeTag?.trim();
  const maxItems = clampNumber(block.mediaLimit ?? 18, 6, 60);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      if (!industryTag && !typeTag) {
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

        const toHeroItem = (doc: any): HeroMediaItem => {
          const data = doc.data() as any;
          const mediaType: HeroMediaItem["mediaType"] =
            data.mediaType === "video" || data.type === "video" ? "video" : "image";
          return {
            id: doc.id,
            url: data.url,
            alt: data.alt ?? data.name ?? "Hero media",
            mediaType,
            width: data.width,
            height: data.height
          };
        };

        const baseConstraints: QueryConstraint[] = [where("status", "==", "published")];
        if (typeTag) baseConstraints.push(where("type", "==", typeTag));

        let results: HeroMediaItem[] = [];

        // 1. Prioritize industry-matched items
        if (industryTag) {
          const industryQ = query(
            mediaRef,
            ...baseConstraints,
            where("industry", "array-contains", industryTag),
            limit(maxItems)
          );
          const industrySnap = await getDocs(industryQ);
          if (canceled) return;
          results = industrySnap.docs.map(toHeroItem).filter((item) => item.url);
        }

        // 2. Backfill remaining spots with any-industry media
        if (results.length < maxItems) {
          const remaining = maxItems - results.length;
          const backfillQ = query(mediaRef, ...baseConstraints, limit(remaining + results.length));
          const backfillSnap = await getDocs(backfillQ);
          if (canceled) return;
          const existingIds = new Set(results.map((r) => r.id));
          const backfill = backfillSnap.docs
            .map(toHeroItem)
            .filter((item) => item.url && !existingIds.has(item.id));
          results = [...results, ...backfill].slice(0, maxItems);
        }

        setItems(results);
      } catch (error) {
        console.error("Failed to load hero media", error);
        if (!canceled) setItems([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [industryTag, typeTag, maxItems]);

  const fallbackItems = useMemo(() => buildHeroPlaceholderMedia(maxItems, block.media), [block.media, maxItems]);
  const resolvedItems = items.length ? items : loading ? [] : fallbackItems;
  const columns = useMemo(() => {
    const buckets: HeroMediaItem[][] = [[], [], []];
    resolvedItems.forEach((item, idx) => {
      buckets[idx % buckets.length].push(item);
    });
    return buckets;
  }, [resolvedItems]);
  const statusText =
    !industryTag && !typeTag
      ? "Set an industry or type tag to pull media into the hero."
      : !loading && !items.length
      ? "No media matched those tags yet."
      : null;
  const itemGap = isCompact ? 12 : 14;
  const columnsGap = isCompact ? 6 : 8;
  const containerGap = itemGap;

  useEffect(() => {
    let canceled = false;
    let done = false;
    setReady(false);
    if (!resolvedItems.length) {
      setReady(true);
      return;
    }

    const markReady = () => {
      if (done || canceled) return;
      done = true;
      setReady(true);
    };

    const fallbackTimer = window.setTimeout(markReady, 900);
    const firstImage = resolvedItems.find((item) => item.mediaType !== "video");

    if (!firstImage) {
      markReady();
      return () => window.clearTimeout(fallbackTimer);
    }

    const img = new Image();
    img.onload = markReady;
    img.onerror = markReady;
    img.src = firstImage.url;
    if (img.complete) {
      markReady();
    }

    return () => {
      canceled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [resolvedItems]);

  const HeroMedia = ({ item }: { item: HeroMediaItem }) => {
    const [loaded, setLoaded] = useState(false);
    const isVideo = item.mediaType === "video";
    const aspectRatio = item.width && item.height ? `${item.width} / ${item.height}` : "9 / 16";
    const mediaStyle: CSSProperties = {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      filter: loaded ? "blur(0px)" : "blur(12px)",
      transform: loaded ? "scale(1)" : "scale(1.03)",
      transition: "filter 320ms cubic-bezier(0.4, 0, 0.2, 1), transform 380ms cubic-bezier(0.4, 0, 0.2, 1)",
      willChange: "filter, transform"
    };

    useEffect(() => {
      setLoaded(false);
    }, [item.url]);

    useEffect(() => {
      if (loaded) return;
      const fallback = window.setTimeout(() => setLoaded(true), 1400);
      return () => window.clearTimeout(fallback);
    }, [item.url, loaded]);

    return (
      <div
        style={{
          borderRadius: 18,
          overflow: "hidden",
          background: "transparent",
          boxShadow: "none",
          aspectRatio
        }}
      >
        {isVideo ? (
          <video
            src={item.url}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setLoaded(true)}
            onLoadedMetadata={() => setLoaded(true)}
            style={mediaStyle}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={item.url}
            alt={item.alt ?? ""}
            style={mediaStyle}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        )}
      </div>
    );
  };

  const renderCell = (item: HeroMediaItem, key: string) => {
    return <HeroMedia key={key} item={item} />;
  };

  return (
    <>
      <style>{`
        @keyframes hero-column-scroll {
          from { transform: translateY(0); }
          to { transform: translateY(-38%); }
        }
      `}</style>
      <div
        className="grid"
        style={{
          gap: containerGap,
          alignItems: "center",
          ...innerStyle,
          gridTemplateColumns: gridTemplate,
          paddingRight: 0
        }}
      >
        {content}
        {!hideColumns ? (
          <div
            className="grid"
            style={{ gap: columnsGap, height: "100%", maxHeight: "100%", justifyItems: "stretch", opacity: ready ? 1 : 0, transition: "opacity 240ms ease", overflow: "hidden" }}
            aria-busy={!ready}
          >
            <div
              data-hero-columns
              style={{
                display: "grid",
                gap: columnsGap,
                gridTemplateColumns: "repeat(3, minmax(120px, 190px))",
                justifyContent: "end",
                alignItems: "stretch",
                height: "100%",
                maxHeight: "100%",
                overflow: "hidden"
              }}
            >
              {columns.map((bucket, colIdx) => {
                const duration = 26 + colIdx * 3;
                const direction = colIdx === 1 ? "alternate-reverse" : "alternate";
                return (
                  <div
                    key={`hero-col-${colIdx}`}
                    data-hero-column
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 18,
                      background: "transparent",
                      padding: 4,
                      minHeight: isCompact ? 200 : 260,
                      height: "100%"
                    }}
                  >
                    <div
                      data-hero-track
                      style={{
                        display: "grid",
                        gap: itemGap,
                        animation: `hero-column-scroll ${duration}s linear infinite`,
                        animationDirection: direction as CSSProperties["animationDirection"],
                        gridAutoRows: "minmax(140px, auto)"
                      }}
                    >
                      {bucket.map((item, itemIdx) => renderCell(item, `${item.id}-${itemIdx}`))}
                    </div>
                  </div>
                );
              })}
            </div>
            {loading ? (
              <span style={{ color: "var(--muted)", fontSize: "var(--font-size-sm)" }}>Loading tagged media…</span>
            ) : null}
            {statusText ? <span style={{ color: "var(--muted)", fontSize: "var(--font-size-sm)" }}>{statusText}</span> : null}
          </div>
        ) : null}
      </div>
    </>
  );
};

const renderHeroBlock = (
  block: HeroBlock | ThirdsBlock,
  index: number,
  headerHeight: number,
  viewportWidth: number | null,
  audienceFilter?: string
) => {
  const heroMode = block.mode ?? "static";
  const isDynamicHero = block.type === "hero" && heroMode === "dynamic";
  const hasMedia = !isDynamicHero && Boolean(block.media?.url);
  const media = hasMedia ? renderMedia(block.media) : null;
  const hasBackground = Boolean(block.background?.url);
  const backgroundIsVideo =
    block.background?.type === "video" || /\.(mp4|mov|webm|ogg)$/i.test(block.background?.url ?? "");
  const backgroundUrl = block.background?.url ?? "";
  const overlayStyleChoice = block.overlayStyle ?? "gradient";
  const fallbackHeroBackground =
    "radial-gradient(circle at 24% 22%, rgba(255, 140, 64, 0.22), transparent 46%), radial-gradient(circle at 20% 20%, var(--bg-glow-1), transparent 45%), radial-gradient(circle at 80% 30%, var(--bg-glow-2), transparent 55%), var(--surface)";
  const overlayImage =
    overlayStyleChoice === "full"
      ? `linear-gradient(145deg, var(--hero-overlay-from), var(--hero-overlay-to))${backgroundIsVideo ? "" : `, url(${backgroundUrl})`}`
      : `${backgroundIsVideo ? "var(--hero-overlay-gradient)" : `var(--hero-overlay-gradient), url(${backgroundUrl})`}`;
  const isCompact = block.type === "thirds";
  const thirdsLayout = block.type === "thirds" ? block.layout ?? "left" : "left";
  const isCenteredThirds = isCompact && thirdsLayout === "centered";
  const fullBleedHeroStyle = getFullBleedHeroStyle(headerHeight, isCompact, viewportWidth);
  const removeStroke = isDynamicHero || !!block.media?.url;
  const hideColumns = isDynamicHero && viewportWidth !== null && viewportWidth < 1100;
  const isNarrowViewport = viewportWidth !== null && viewportWidth < 640;
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
        background: isCompact ? "transparent" : fallbackHeroBackground,
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
    <>
      {backgroundIsVideo ? (
        <video
          aria-hidden
          src={backgroundUrl}
          playsInline
          autoPlay
          muted
          loop
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0
          }}
        />
      ) : null}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: overlayImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: backgroundIsVideo ? 1 : 0
        }}
      />
    </>
  ) : null;
  const innerStyle: CSSProperties = {
    width: `min(100%, calc(var(--max-width) + ${sectionPx} * 2))`,
    paddingLeft: sectionPx,
    paddingRight: sectionPx,
    margin: "0 auto",
    ...(hasBackground ? { padding: isCompact ? 26 : 32, position: "relative", zIndex: 2 } : {}),
    ...(isCompact && !hasBackground ? { padding: `0 12px` } : {}),
    ...(isCenteredThirds ? { justifyItems: "center" } : {})
  };
  const isSingleColumnDynamic = isDynamicHero && hideColumns;
  const textOnlyContentStyle: CSSProperties = hasMedia
    ? {}
    : {
        maxWidth:
          isSingleColumnDynamic ? "min(var(--max-width), 880px)" : isDynamicHero ? "min(var(--max-width), 640px)" : "min(var(--max-width), 600px)",
        width: "100%",
        justifySelf: isDynamicHero ? (isSingleColumnDynamic ? "start" : "end") : isCenteredThirds ? "center" : "start",
        marginLeft: isDynamicHero && !isSingleColumnDynamic ? "auto" : undefined,
        textAlign: isCenteredThirds ? "center" : undefined
      };
  const headingSize = isCompact ? "var(--font-size-display-sm)" : "var(--font-size-display-md)";
  const subtitleSize = isCompact ? "var(--font-size-body-lg)" : "var(--font-size-lede)";
  const stackGap = isCompact ? 12 : 14;
  const layoutGap = isCompact ? 16 : 18;
  const dynamicLayoutGap = isDynamicHero ? 12 : layoutGap;
  const dynamicStackGap = isDynamicHero ? 6 : stackGap;
  if (isDynamicHero) {
    // Dynamic heroes should stay exactly their target height — overflow from scrolling columns is clipped.
    heroStyle.overflow = "hidden";
  }
  const content = (
    <div
      className="grid"
      style={{
        gap: dynamicStackGap,
        alignSelf: "center",
        ...textOnlyContentStyle,
        ...(isCenteredThirds ? { textAlign: "center", justifyItems: "center", maxWidth: "min(var(--max-width), 820px)" } : {})
      }}
    >
      {block.eyebrow ? <Pill>{block.eyebrow}</Pill> : null}
      <h1
        style={{
          fontFamily: "var(--font-secondary)",
          fontSize: headingSize,
          fontWeight: 300,
          lineHeight: isCompact ? 0.98 : 0.94,
          letterSpacing: 0,
          textTransform: "none",
          margin: 0
        }}
      >
        {block.title}
      </h1>
      {block.subtitle ? (
        <p
          style={{
            maxWidth: isCompact ? "52ch" : "48ch",
            color: "var(--muted)",
            fontFamily: "var(--font-sans, var(--font-primary))",
            fontSize: subtitleSize,
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: isCompact ? 1.4 : 1.45,
            margin: 0
          }}
        >
          {block.subtitle}
        </p>
      ) : null}
      <div
        style={{
          display: "flex",
          gap: isCompact ? 10 : 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
          justifyContent: isCenteredThirds ? "center" : undefined,
          paddingTop: isNarrowViewport ? 10 : undefined
        }}
      >
        {block.primaryCtaLabel && block.primaryCtaHref ? (
          <AnchorAwareLink
            className="btn"
            href={block.primaryCtaHref}
            trackingSection="hero_primary"
            style={{ minWidth: 160, justifyContent: "center" }}
          >
            {block.primaryCtaLabel}
          </AnchorAwareLink>
        ) : null}
        {block.secondaryCtaLabel && block.secondaryCtaHref ? (
          <AnchorAwareLink
            className="btn secondary"
            href={block.secondaryCtaHref}
            trackingSection="hero_secondary"
            style={{ minWidth: 160, justifyContent: "center" }}
          >
            {block.secondaryCtaLabel}
          </AnchorAwareLink>
        ) : null}
      </div>
    </div>
  );

  const dynamicInnerStyle = isDynamicHero
    ? {
        ...innerStyle,
        maxWidth: "100%",
        margin: "0 auto",
        paddingLeft: isNarrowViewport ? (isCompact ? 10 : 12) : isCompact ? 22 : 26,
        paddingRight: isSingleColumnDynamic
          ? isNarrowViewport
            ? (isCompact ? 10 : 12)
            : isCompact
            ? 22
            : 26
          : 0
      }
    : innerStyle;

  if (isDynamicHero && block.type === "hero") {
    const dynamicGridTemplate = hideColumns ? "minmax(0, 1fr)" : "minmax(460px, 1.1fr) minmax(360px, 0.9fr)";
    return (
      <AnimatedSection
        key={block.id ?? index}
        index={index}
        style={heroStyle}
        animated={false}
        variant={isCompact ? "plain" : "card"}
      >
        {overlay}
        <DynamicHeroColumns
          block={block}
          innerStyle={dynamicInnerStyle}
          layoutGap={layoutGap}
          content={content}
          isCompact={isCompact}
          gridTemplate={dynamicGridTemplate}
          hideColumns={hideColumns}
          audienceFilter={audienceFilter}
        />
      </AnimatedSection>
    );
  }

  if (isCenteredThirds) {
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
            gap: layoutGap,
            alignItems: "center",
            ...innerStyle
          }}
        >
          {media ? <div style={{ width: "100%", maxWidth: 900 }}>{media}</div> : null}
          {content}
        </div>
      </section>
    );
  }

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

const renderDividerBlock = (block: DividerBlock, index: number) => {
  const wrapperStyle: CSSProperties | undefined =
    block.width === "page"
      ? {
          width: "100%",
          maxWidth: "var(--max-width)",
          marginLeft: "auto",
          marginRight: "auto"
        }
      : undefined;

  return (
    <AnimatedSection key={block.id ?? index} index={index} animated={false} variant="plain">
      <div className="ghost-content" style={wrapperStyle}>
        <hr className="kg-divider" />
      </div>
    </AnimatedSection>
  );
};

const renderStoryBlock = (block: StoryBlock, index: number) => {
  const media = renderMedia(block.media);
  const sectionsList = renderBlockSections(block.sections);
  const storyOuterStyle: CSSProperties = {
    width: "100%",
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: sectionPx,
    paddingRight: sectionPx
  };

  const storyHeading = (
    <div className="grid" style={{ gap: 10 }}>
      <SectionHeading title={block.heading} />
      {block.variant !== "split_with_quote" ? (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--font-size-body)" }}>{block.body}</p>
      ) : null}
    </div>
  );

  if (block.variant === "two_column") {
    return (
      <AnimatedSection key={block.id ?? index} index={index} variant="plain" style={storyOuterStyle}>
        <div
          className="grid"
          style={{ gap: 18, alignItems: "start", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
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
      <AnimatedSection key={block.id ?? index} index={index} variant="plain" style={storyOuterStyle}>
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
              <p style={{ margin: 0, fontSize: "var(--font-size-body-lg)", lineHeight: 1.4 }}>{block.body}</p>
            </div>
          ) : null}
          <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {storyHeading}
            {media}
          </div>
          {sectionsList}
        </div>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection key={block.id ?? index} index={index} variant="plain" style={storyOuterStyle}>
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
      {block.body ? <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--font-size-body)" }}>{block.body}</p> : null}
      {block.ctaLabel && block.ctaHref ? (
        <AnchorAwareLink
          className="btn"
          href={block.ctaHref}
          trackingName="cta_click"
          trackingSection="split_block"
          style={{ width: "fit-content" }}
        >
          {block.ctaLabel}
        </AnchorAwareLink>
      ) : null}
    </div>
  );

  if (!media) {
    return (
      <motion.section
        key={block.id ?? index}
        style={{
          width: "100%",
          maxWidth: "min(var(--max-width), 960px)",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: sectionPx,
          paddingRight: sectionPx
        }}
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
      style={{
        width: "100%",
        maxWidth: "var(--max-width)",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: sectionPx,
        paddingRight: sectionPx
      }}
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
            padding-left: var(--section-px, 16px);
            padding-right: var(--section-px, 16px);
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

type ProductDemoMediaItem = {
  id: string;
  url: string;
  name?: string;
  mediaType?: "image" | "video";
  width?: number;
  height?: number;
};

type ProductDemoMediaSelection = {
  portraitUrl?: string;
  squareUrl?: string;
};

type ProductDemoFilterableItem = ProductDemoMediaItem & {
  type?: string;
  industry: string[];
  featured: boolean;
};

const normalizeDemoTag = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const decodeMediaText = (value?: string) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const filenameHasRatio = (item: ProductDemoMediaItem, ratio: "9x16" | "1x1") => {
  const source = `${item.name ?? ""} ${decodeMediaText(item.url)}`;
  const pattern =
    ratio === "9x16"
      ? /(?:^|[^a-z0-9])9\s*[xX:_-]\s*16(?:[^a-z0-9]|$)/
      : /(?:^|[^a-z0-9])1\s*[xX:_-]\s*1(?:[^a-z0-9]|$)/;
  return pattern.test(source);
};

const dimensionsMatchRatio = (item: ProductDemoMediaItem, ratio: "9x16" | "1x1") => {
  if (!item.width || !item.height) return false;
  const actual = item.width / item.height;
  if (ratio === "9x16") return actual > 0.48 && actual < 0.66;
  return actual > 0.9 && actual < 1.1;
};

const selectProductDemoMedia = (items: ProductDemoMediaItem[]): ProductDemoMediaSelection => {
  const images = items.filter((item) => item.url && item.mediaType !== "video");
  const portrait =
    images.find((item) => filenameHasRatio(item, "9x16")) ??
    images.find((item) => dimensionsMatchRatio(item, "9x16")) ??
    images[0];
  const square =
    images.find((item) => item.id !== portrait?.id && filenameHasRatio(item, "1x1")) ??
    images.find((item) => item.id !== portrait?.id && dimensionsMatchRatio(item, "1x1")) ??
    images.find((item) => item.id !== portrait?.id) ??
    portrait;

  return {
    portraitUrl: portrait?.url,
    squareUrl: square?.url
  };
};

const ProductDemoBlockSection = ({
  block,
  index,
  audienceFilter
}: {
  block: ProductDemoBlock;
  index: number;
  audienceFilter?: string;
}) => {
  const hasCopy = !!(block.eyebrow || block.heading || block.body);
  const sectionId = `product-demo-${block.id ?? index}`;
  const [dynamicMedia, setDynamicMedia] = useState<ProductDemoMediaSelection>({});
  const typeFilter = block.typeFilter?.trim() || "product_demo";
  const industryFilter = audienceFilter || block.industryFilter?.trim();
  const featuredOnly = Boolean(block.featuredOnly);
  const resultsLimit = 16;

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      if (!typeFilter || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        setDynamicMedia({});
        return;
      }

      try {
        const db = getFirestore(getFirebaseApp());
        const mediaRef = collection(db, "media");
        const toItem = (doc: any): ProductDemoMediaItem => {
          const raw = doc.data() as any;
          const mediaType = raw.mediaType === "video" || raw.type === "video" ? "video" : "image";
          return {
            id: doc.id,
            url: raw.url,
            name: raw.name,
            mediaType,
            width: raw.width,
            height: raw.height
          };
        };
        const toFilterableItem = (doc: any): ProductDemoFilterableItem => {
          const raw = doc.data() as any;
          return {
            ...toItem(doc),
            type: raw.type,
            industry: Array.isArray(raw.industry)
              ? raw.industry
              : typeof raw.industry === "string" && raw.industry.trim()
                ? [raw.industry.trim()]
                : [],
            featured: Boolean(raw.featured)
          };
        };
        const isMatch = (item: ProductDemoFilterableItem) => {
          if (!item.url || item.mediaType === "video") return false;
          if (normalizeDemoTag(item.type) !== normalizeDemoTag(typeFilter)) return false;
          if (featuredOnly && !item.featured) return false;
          return !industryFilter || item.industry.some((tag) => normalizeDemoTag(tag) === normalizeDemoTag(industryFilter));
        };
        const baseConstraints: QueryConstraint[] = [where("status", "==", "published"), where("type", "==", typeFilter)];
        if (featuredOnly) {
          baseConstraints.push(where("featured", "==", true));
        }
        let items: ProductDemoMediaItem[] = [];
        const appendRelaxedMatches = async () => {
          const relaxedQ = query(mediaRef, where("status", "==", "published"), limit(120));
          const relaxedSnap = await getDocs(relaxedQ);
          if (canceled) return false;
          const seen = new Set(items.map((item) => item.id));
          const relaxedItems = relaxedSnap.docs
            .map(toFilterableItem)
            .filter((item) => isMatch(item) && !seen.has(item.id));
          items = [...items, ...relaxedItems].slice(0, resultsLimit);
          return true;
        };

        if (industryFilter) {
          try {
            const audienceQ = query(mediaRef, ...baseConstraints, where("industry", "array-contains", industryFilter), limit(resultsLimit));
            const audienceSnap = await getDocs(audienceQ);
            if (canceled) return;
            items = audienceSnap.docs.map(toItem).filter((item) => item.url && item.mediaType !== "video");
          } catch (error) {
            console.warn("Falling back to relaxed product demo media query", error);
          }
        }

        if (industryFilter && items.length < resultsLimit) {
          const shouldContinue = await appendRelaxedMatches();
          if (!shouldContinue) return;
        }

        if (items.length < resultsLimit) {
          try {
            const fallbackQ = query(mediaRef, ...baseConstraints, limit(resultsLimit));
            const fallbackSnap = await getDocs(fallbackQ);
            if (canceled) return;
            const seen = new Set(items.map((item) => item.id));
            const fallbackItems = fallbackSnap.docs
              .map(toItem)
              .filter((item) => item.url && item.mediaType !== "video" && !seen.has(item.id));
            items = [...items, ...fallbackItems].slice(0, resultsLimit);
          } catch (error) {
            console.warn("Falling back to relaxed product demo media query", error);
          }
        }

        if (items.length < 2) {
          const shouldContinue = await appendRelaxedMatches();
          if (!shouldContinue) return;
        }

        setDynamicMedia(selectProductDemoMedia(items));
      } catch (error) {
        console.error("Failed to load product demo media", error);
        if (!canceled) setDynamicMedia({});
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [featuredOnly, industryFilter, resultsLimit, typeFilter]);

  const demoBlock = useMemo(() => {
    if (!dynamicMedia.portraitUrl && !dynamicMedia.squareUrl) return block;
    const existing = block.exampleData ?? {};
    const portraitAd = existing.portraitAd ?? { imageUrl: "", brandName: "", headline: "" };
    const squareAd = existing.squareAd ?? portraitAd;
    return {
      ...block,
      exampleData: {
        ...existing,
        portraitAd: {
          ...portraitAd,
          imageUrl: dynamicMedia.portraitUrl ?? portraitAd.imageUrl
        },
        squareAd: {
          ...squareAd,
          imageUrl: dynamicMedia.squareUrl ?? dynamicMedia.portraitUrl ?? squareAd.imageUrl
        }
      }
    };
  }, [block, dynamicMedia]);

  return (
    <>
      <style>{`
        @media (min-width: 900px) {
          #${sectionId} .product-demo-layout {
            flex-direction: row !important;
            align-items: center !important;
          }
          #${sectionId} .product-demo-copy {
            flex: 1 1 0 !important;
            text-align: left !important;
          }
          #${sectionId} .product-demo-card {
            flex: 1 1 0 !important;
          }
        }
      `}</style>
      <section
        id={sectionId}
        key={block.id ?? index}
        style={{
          width: "100%",
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "var(--block-gap) var(--section-px)",
        }}
      >
        <div
          className="product-demo-layout"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          {hasCopy && (
            <div className="product-demo-copy">
              <SectionHeading eyebrow={block.eyebrow} title={block.heading ?? ""} kicker={block.body} />
            </div>
          )}
          <AnimatedSection variant="plain" index={0} className="product-demo-card" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            {block.demoId === "ad_review" ? <AdReviewDemo block={demoBlock} /> : null}
          </AnimatedSection>
        </div>
      </section>
    </>
  );
};

const ContactBlockSection = ({ block, index }: { block: ContactBlock; index: number }) => {
  const hasMedia = !!block.media?.url;
  const isVideo = block.media?.type === "video" || /\.(mp4|mov|webm|ogg)$/i.test(block.media?.url ?? "");
  const [formSuccess, setFormSuccess] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const hasTrackedFormStart = useRef(false);
  const recaptchaSiteKey = "6Ld_MyksAAAAAMwJusVI9I7wpyxKjnM5i8X9VFpL";
  const media = hasMedia ? (
    <div
      data-contact-media
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
          src={block.media?.url}
          controls
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          src={block.media?.url ?? ""}
          alt={block.media?.alt ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  ) : null;
  const preset = animationPresets[defaultAnimationPreset];

  useEffect(() => {
    window.REQUIRED_CODE_ERROR_MESSAGE = "Please choose a country code";
    window.LOCALE = "en";
    window.EMAIL_INVALID_MESSAGE =
      "The information provided is invalid. Please review the field format and try again.";
    window.SMS_INVALID_MESSAGE = window.EMAIL_INVALID_MESSAGE;
    window.REQUIRED_ERROR_MESSAGE = "This field cannot be left blank.";
    window.GENERIC_INVALID_MESSAGE =
      "The information provided is invalid. Please review the field format and try again.";
    window.translation = {
      common: {
        selectedList: "{quantity} list selected",
        selectedLists: "{quantity} lists selected",
        selectedOption: "{quantity} selected",
        selectedOptions: "{quantity} selected"
      }
    };
    window.AUTOHIDE = false;
    window.handleCaptchaResponse = () => {
      const captcha = document.getElementById("sib-captcha");
      if (!captcha) return;
      const event = new Event("captchaChange");
      captcha.dispatchEvent(event);
    };
  }, []);

  useEffect(() => {
    const container = document.getElementById("sib-captcha");
    if (!container) return;

    const markRenderedIfIframe = () => {
      if (container.querySelector("iframe")) {
        container.dataset.rendered = "true";
        return true;
      }
      return false;
    };

    const renderCaptcha = () => {
      if (container.dataset.rendered === "true") return true;
      if (markRenderedIfIframe()) return true;
      if (window.grecaptcha?.render) {
        try {
          window.grecaptcha.render(container, {
            sitekey: recaptchaSiteKey,
            callback: window.handleCaptchaResponse,
            theme: "light"
          });
          container.dataset.rendered = "true";
          return true;
        } catch (err) {
          // If already rendered, just mark and continue.
          if (String(err).toLowerCase().includes("already been rendered")) {
            container.dataset.rendered = "true";
            return true;
          }
        }
      }
      return false;
    };

    let timer: number | null = null;
    const tryRender = () => {
      if (renderCaptcha()) return;
      timer = window.setTimeout(tryRender, 200);
    };
    tryRender();

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [recaptchaSiteKey]);

  useEffect(() => {
    const emailInput = document.getElementById("EMAIL") as HTMLInputElement | null;
    const form = document.getElementById("sib-form") as HTMLFormElement | null;
    const errorLabel = emailInput?.closest(".sib-input")?.querySelector<HTMLElement>(".entry__error") ?? null;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateEmail = () => {
      if (!emailInput || !errorLabel) return;
      const value = emailInput.value.trim();
      if (!value) {
        errorLabel.textContent = "";
        emailInput.setCustomValidity("");
        return;
      }
      if (!emailPattern.test(value)) {
        errorLabel.textContent = "Please enter a valid email address.";
        emailInput.setCustomValidity("invalid email");
      } else {
        errorLabel.textContent = "";
        emailInput.setCustomValidity("");
      }
    };

    const handleSubmit = async (evt: Event) => {
      const currentScroll = window.scrollY;
      evt.preventDefault();
      evt.stopPropagation();
      // Prevent other listeners from allowing navigation/scroll.
      // @ts-ignore
      if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();
      validateEmail();
      const captchaError = form?.querySelector<HTMLElement>(".sib-captcha .entry__error");
      const recaptchaValue =
        (form?.querySelector<HTMLTextAreaElement>('textarea[name="g-recaptcha-response"]')?.value || "").trim();
      if (emailInput && !emailInput.checkValidity()) {
        emailInput.reportValidity();
        return;
      }
      if (!recaptchaValue) {
        if (captchaError) captchaError.textContent = "Please complete the captcha.";
        return;
      }
      if (captchaError) captchaError.textContent = "";
      if (!form) return;

      try {
        setFormSubmitting(true);
        const formData = new FormData(form);
        await fetch(form.action, {
          method: "POST",
          body: formData,
          mode: "no-cors"
        });
        setFormSuccess(true);
        trackGaEvent("generate_lead", {
          form_id: "sib-form",
          method: "brevo_embed",
          section: block.anchor ?? "contact"
        });
        form.reset();
        const errorEls = form.querySelectorAll<HTMLElement>(".entry__error");
        errorEls.forEach((el) => (el.textContent = ""));
        window.grecaptcha?.reset?.();
        window.scrollTo({ top: currentScroll, behavior: "instant" as ScrollBehavior });
      } catch (err) {
        if (captchaError) captchaError.textContent = "Something went wrong. Please try again.";
      } finally {
        setFormSubmitting(false);
      }
    };

    emailInput?.addEventListener("input", validateEmail);
    emailInput?.addEventListener("blur", validateEmail);
    form?.addEventListener("submit", handleSubmit, { capture: true });

    const handleFormStart = () => {
      if (hasTrackedFormStart.current) return;
      hasTrackedFormStart.current = true;
      trackGaEvent("form_start", {
        form_id: "sib-form",
        method: "brevo_embed",
        section: block.anchor ?? "contact"
      });
    };
    form?.addEventListener("focusin", handleFormStart);
    form?.addEventListener("input", handleFormStart);

    validateEmail();

    return () => {
      emailInput?.removeEventListener("input", validateEmail);
      emailInput?.removeEventListener("blur", validateEmail);
      form?.removeEventListener("submit", handleSubmit, { capture: true } as EventListenerOptions);
      form?.removeEventListener("focusin", handleFormStart);
      form?.removeEventListener("input", handleFormStart);
    };
  }, [block.anchor]);

  return (
    <AnimatedSection key={block.id ?? index} index={index} variant="plain" animated={false}>
      <Head>
        <link rel="stylesheet" href="https://sibforms.com/forms/end-form/build/sib-styles.css" />
      </Head>
      <Script id="brevo-form-main" src="https://sibforms.com/forms/end-form/build/main.js" strategy="afterInteractive" />
      <Script id="brevo-form-recaptcha" src="https://www.google.com/recaptcha/api.js?hl=en" strategy="afterInteractive" />
      <div data-contact-block style={{ position: "relative" }}>
        <style suppressHydrationWarning>{`
          [data-contact-block] {
            width: 100%;
            max-width: var(--max-width);
            margin-left: auto;
            margin-right: auto;
          }
          [data-contact-section] {
            width: 100%;
            max-width: var(--max-width);
            margin-left: auto;
            margin-right: auto;
            padding-left: var(--section-px, 15px);
            padding-right: var(--section-px, 15px);
          }
          [data-contact-grid] {
            gap: 18px;
            align-items: center;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
          [data-brevo-form] * {
            font-family: var(--font-sans, "Rubik", system-ui, -apple-system, sans-serif);
          }
          [data-brevo-form] {
            padding: 16px;
            border-radius: 12px;
            border: 1px solid var(--border-strong);
            background: var(--input-bg);
            box-shadow: none;
          }
          [data-brevo-form] .sib-form {
            text-align: left;
          }
          [data-brevo-form] .sib-form-container {
            display: grid;
            gap: 12px;
          }
          [data-brevo-form] .sib-form-message-panel {
            display: none;
            border-radius: 12px;
            padding: 10px 12px;
            border: 1px solid transparent;
            font-size: var(--font-size-label);
          }
          [data-brevo-form] .sib-form-message-panel svg {
            width: 18px;
            height: 18px;
          }
          [data-brevo-form] #error-message {
            color: var(--danger);
            background: rgba(214, 54, 54, 0.08);
            border-color: rgba(214, 54, 54, 0.28);
          }
          [data-brevo-form] #success-message {
            color: var(--text);
            background: var(--accent-soft);
            border-color: var(--accent);
          }
          [data-brevo-form] .sib-form-message-panel.sib-form-message-panel--visible {
            display: block;
          }
          [data-brevo-form] .sib-container--large {
            border: none;
            background: transparent;
            padding: 0;
          }
          [data-brevo-form] form {
            display: grid;
            gap: 14px;
          }
          [data-brevo-form] .sib-form-block {
            width: 100%;
          }
          [data-brevo-form] .sib-form-block + .sib-form-block {
            margin-top: 4px;
          }
          [data-brevo-form] [data-name-row] {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
          }
          [data-brevo-form] [data-name-row] .sib-form-block {
            margin-top: 0;
          }
          [data-brevo-form] .sib-input .form__entry,
          [data-brevo-form] .sib-optin .form__entry,
          [data-brevo-form] .sib-captcha .form__entry {
            display: grid;
            gap: 6px;
          }
          [data-brevo-form] .entry__label {
            font-weight: 700;
            font-size: var(--font-size-label);
            color: var(--muted);
          }
          [data-brevo-form] .entry__field,
          [data-brevo-form] .entry__choice {
            display: grid;
            gap: 6px;
          }
          [data-brevo-form] .entry__error {
            color: var(--danger);
            background: rgba(214, 54, 54, 0.08);
            border: 1px solid rgba(214, 54, 54, 0.28);
            border-radius: 10px;
            padding: 6px 10px;
            font-size: var(--font-size-sm);
            min-height: 1.25rem;
            display: block !important;
            opacity: 1 !important;
          }
          [data-brevo-form] .entry__error:empty {
            display: none !important;
          }
          [data-brevo-form] .entry__specification {
            color: var(--muted);
            font-size: var(--font-size-xs);
            margin: 0;
          }
          [data-brevo-form] .input,
          [data-brevo-form] textarea,
          [data-brevo-form] select {
            width: 100%;
            background: var(--input-bg);
            color: var(--text);
            border: 1px solid var(--border-strong);
            border-radius: 12px;
            padding: 10px 12px;
          }
          [data-brevo-form] .input:focus,
          [data-brevo-form] textarea:focus,
          [data-brevo-form] select:focus {
            border-color: var(--accent);
            outline: none;
            box-shadow: 0 0 0 2px rgba(255, 112, 11, 0.16);
          }
          [data-brevo-form] textarea {
            min-height: 120px;
            resize: vertical;
          }
          [data-brevo-form] .sib-optin label {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: var(--font-size-label);
            color: var(--text);
          }
          [data-brevo-form] .sib-optin input[type="checkbox"] {
            width: 18px;
            height: 18px;
            appearance: none;
            -webkit-appearance: none;
            position: relative;
            border: 1px solid var(--accent);
            border-radius: 4px;
            background: var(--input-bg);
            display: grid;
            place-content: center;
            transition: background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
          }
          [data-brevo-form] .sib-optin input[type="checkbox"]:checked {
            background: var(--accent);
            border-color: var(--accent);
            box-shadow: 0 0 0 2px rgba(255, 112, 11, 0.16);
          }
          [data-brevo-form] .sib-optin input[type="checkbox"]:checked::after {
            content: "";
            position: absolute;
            inset: 0;
            background-repeat: no-repeat;
            background-position: center;
            background-size: 12px 12px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5 13 9 17 19 7'/%3E%3C/svg%3E");
          }
          [data-brevo-form] .sib-form-block__button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: var(--font-size-body);
            text-align: left;
            font-weight: 700;
            font-family: var(--font-sans, "Rubik", system-ui, -apple-system, sans-serif);
            color: #ffffff;
            background: var(--accent);
            border-radius: 12px;
            border-width: 0px;
            padding: 12px 16px;
            cursor: pointer;
            transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
            box-shadow: 0 6px 16px rgba(0,0,0,0.12);
          }
          [data-brevo-form] .sib-form-block__button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 18px rgba(0,0,0,0.16);
            background: var(--accent-strong);
          }
          [data-brevo-form] .sib-form-block__button:focus {
            outline: 2px solid var(--accent);
            outline-offset: 2px;
          }
          [data-brevo-form] .progress-indicator__icon {
            display: none;
          }
          [data-brevo-success] {
            padding: 18px;
            border-radius: 14px;
            border: 1px solid var(--border-strong);
            background: var(--accent-soft);
            color: var(--text);
            font-size: var(--font-size-body-lg);
            line-height: 1.6;
            font-weight: 600;
            box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            animation: brevoSuccessFade 300ms ease;
          }
          @keyframes brevoSuccessFade {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 900px) {
            [data-contact-media] {
              max-width: 540px;
              margin-left: auto;
              margin-right: auto;
            }
          }
          @media (max-width: 768px) {
            [data-contact-section] {
              padding-left: 15px;
              padding-right: 15px;
            }
            [data-contact-grid] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        <motion.section
          data-contact-section
          variants={preset.item}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={index}
        >
          <div
            className="grid"
            data-contact-grid
            style={{ gap: 18, alignItems: "center", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
          >
            {media}
            <div className="grid" style={{ gap: 12 }}>
              <SectionHeading eyebrow={block.eyebrow} title={block.heading} kicker={block.body} />
              <div
                data-contact-form
                data-brevo-form
              >
                {formSuccess ? (
                  <div data-brevo-success aria-live="polite">Thank you! We&apos;ll reach out soon.</div>
                ) : (
                  <div className="sib-form" data-type="subscription">
                    <div id="sib-form-container" className="sib-form-container">
                    <div id="error-message" className="sib-form-message-panel">
                      <div className="sib-form-message-panel__text sib-form-message-panel__text--center">
                        <svg viewBox="0 0 512 512" className="sib-icon sib-notification__icon">
                          <path d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-11.49 120h22.979c6.823 0 12.274 5.682 11.99 12.5l-7 168c-.268 6.428-5.556 11.5-11.99 11.5h-8.979c-6.433 0-11.722-5.073-11.99-11.5l-7-168c-.283-6.818 5.167-12.5 11.99-12.5zM256 340c-15.464 0-28 12.536-28 28s12.536 28 28 28 28-12.536 28-28-12.536-28-28-28z" />
                        </svg>
                        <span className="sib-form-message-panel__inner-text">
                          Your submission could not be saved. Please try again.
                        </span>
                      </div>
                    </div>
                    <div id="success-message" className="sib-form-message-panel">
                      <div className="sib-form-message-panel__text sib-form-message-panel__text--center">
                        <svg viewBox="0 0 512 512" className="sib-icon sib-notification__icon">
                          <path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 464c-118.664 0-216-96.055-216-216 0-118.663 96.055-216 216-216 118.664 0 216 96.055 216 216 0 118.663-96.055 216-216 216zm141.63-274.961L217.15 376.071c-4.705 4.667-12.303 4.637-16.97-.068l-85.878-86.572c-4.667-4.705-4.637-12.303.068-16.97l8.52-8.451c4.705-4.667 12.303-4.637 16.97.068l68.976 69.533 163.441-162.13c4.705-4.667 12.303-4.637 16.97.068l8.451 8.52c4.668 4.705 4.637 12.303-.068 16.97z" />
                        </svg>
                        <span className="sib-form-message-panel__inner-text">
                          Your submission has been successful.
                        </span>
                      </div>
                    </div>
                    <div id="sib-container" className="sib-container--large sib-container--vertical">
                      <form
                        id="sib-form"
                        method="POST"
                        action="https://bd3a921f.sibforms.com/serve/MUIFAHM-9ERG7aYtvQaKLgylvX7RO_ew2aPPC9v8M5QsEKgnSYunibbCbINAijwJdD-UUk4scmuXwqt11zysNEc4WIoCfb-PE3WTUnLw8ltAF2rq5bGjQLCoRQZ7yC5zAu8399v1xnGYK0rbWLrgm2u9pY6qZoke25S2n4GtQc4vnGY5qWEkj4Tk-u99e_uKQQ_wAyzrE2Led8NM6w=="
                        data-type="subscription"
                        noValidate
                      >
                        <div className="sib-input sib-form-block">
                          <div className="form__entry entry_block">
                            <div className="form__label-row">
                              <label className="entry__label" htmlFor="EMAIL" data-required="*">
                                Enter your email address
                              </label>
                              <div className="entry__field">
                                <input
                                  className="input"
                                  type="email"
                                  id="EMAIL"
                                  name="EMAIL"
                                  autoComplete="email"
                                  placeholder="Email"
                                  data-required="true"
                                  required
                                />
                              </div>
                            </div>
                            <label className="entry__error entry__error--primary" />
                          </div>
                        </div>
                        <div className="name-row" data-name-row>
                          <div className="sib-input sib-form-block">
                            <div className="form__entry entry_block">
                              <div className="form__label-row">
                                <label className="entry__label" htmlFor="FIRSTNAME" data-required="*">
                                  Enter your first name
                                </label>
                                <div className="entry__field">
                                  <input
                                    className="input"
                                    maxLength={200}
                                    type="text"
                                    id="FIRSTNAME"
                                    name="FIRSTNAME"
                                    autoComplete="given-name"
                                    placeholder="First name"
                                    data-required="true"
                                    required
                                  />
                                </div>
                              </div>
                              <label className="entry__error entry__error--primary" />
                            </div>
                          </div>
                          <div className="sib-input sib-form-block">
                            <div className="form__entry entry_block">
                              <div className="form__label-row">
                                <label className="entry__label" htmlFor="LASTNAME" data-required="*">
                                  Enter your last name
                                </label>
                                <div className="entry__field">
                                  <input
                                    className="input"
                                    maxLength={200}
                                    type="text"
                                    id="LASTNAME"
                                    name="LASTNAME"
                                    autoComplete="family-name"
                                    placeholder="Last name"
                                    data-required="true"
                                    required
                                  />
                                </div>
                              </div>
                              <label className="entry__error entry__error--primary" />
                            </div>
                          </div>
                        </div>
                        <div className="sib-captcha sib-form-block">
                          <div className="form__entry entry_block">
                            <div className="form__label-row">
                              <div
                                className="g-recaptcha sib-visible-recaptcha"
                                id="sib-captcha"
                                data-sitekey="6Ld_MyksAAAAAMwJusVI9I7wpyxKjnM5i8X9VFpL"
                                data-callback="handleCaptchaResponse"
                                style={{ direction: "ltr" }}
                              />
                            </div>
                            <label className="entry__error entry__error--primary" />
                          </div>
                        </div>
                        <div className="sib-optin sib-form-block" data-required="true">
                          <div className="form__entry entry_mcq">
                            <div className="form__label-row">
                              <label className="entry__label" htmlFor="OPT_IN" data-required="*">
                                Opt-in
                              </label>
                              <div className="entry__choice">
                                <label className="opt-in-label">
                                  <input type="checkbox" className="input_replaced" value="1" id="OPT_IN" name="OPT_IN" required />
                                  <span className="opt-in-copy">I agree to receive communications from Studio Tak.</span>
                                </label>
                              </div>
                            </div>
                            <label className="entry__error entry__error--primary" />
                            <p className="entry__specification">
                              You may unsubscribe at any time using the link in our emails.
                            </p>
                          </div>
                        </div>
                        <div className="sib-form-block" style={{ textAlign: "left" }}>
                          <button
                            className="sib-form-block__button sib-form-block__button-with-loader"
                            form="sib-form"
                            type="submit"
                          >
                            <svg className="icon clickable__icon progress-indicator__icon sib-hide-loader-icon" viewBox="0 0 512 512">
                              <path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" />
                            </svg>
                            Submit
                          </button>
                        </div>
                        <input type="hidden" name="email_address_check" value="" aria-hidden="true" />
                        <input type="hidden" name="locale" value="en" />
                      </form>
                    </div>
                  </div>
                </div>
                )}
              </div>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--font-size-sm)" }}>
                We typically reply within one business day.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </AnimatedSection>
  );
};

const FeaturesBlockSection = ({
  block,
  index
}: {
  block: FeaturesBlock;
  index: number;
}) => {
  const paddingX = 16;
  const minSidePadding = 16;
  const items = (block.items ?? []).slice(0, 3);
  const galleryPreset = animationPresets[defaultAnimationPreset];
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const galleryInView = useInView(galleryRef, { amount: 0.3, once: true });
  const featVW = useViewportWidth();
  const featIsMobile = featVW !== null && featVW < 680;
  const featMobileInset = "var(--full-bleed-mobile-inset, var(--section-px, 15px))";
  const featLeftInset = featIsMobile ? `max(${featMobileInset}, env(safe-area-inset-left, 0px))` : "0px";
  const featRightInset = featIsMobile ? `max(${featMobileInset}, env(safe-area-inset-right, 0px))` : "0px";
  const featWidth = featIsMobile
    ? `calc(${viewportWidthVar} - ${featLeftInset} - ${featRightInset})`
    : viewportWidthVar;

  if (block.variant === "stacked") {
    return (
      <section
        key={block.id ?? index}
        style={{ padding: featIsMobile ? "48px 0 56px" : "64px 0 72px" }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "var(--max-width)",
            margin: "0 auto",
            padding: `0 ${paddingX}px`
          }}
        >
          <SectionHeading eyebrow={block.eyebrow} title={block.heading} kicker={block.body} align="center" />
          <motion.div
            ref={galleryRef}
            style={{
              display: "grid",
              gridTemplateColumns: featIsMobile ? "1fr" : `repeat(${Math.min(items.length, 3)}, 1fr)`,
              gap: featIsMobile ? 0 : 24,
              marginTop: featIsMobile ? 32 : 48
            }}
            variants={galleryPreset.container}
            initial="hidden"
            animate={galleryInView ? "visible" : "hidden"}
          >
            {items.map((item, idx) => (
              <motion.div
                key={`${item.title}-${idx}`}
                variants={galleryPreset.item}
                className="features-stacked-item"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  padding: featIsMobile ? "24px 0" : "28px 24px",
                  borderBottom: featIsMobile && idx < items.length - 1 ? "1px solid var(--border)" : "none",
                  border: featIsMobile ? undefined : "1px solid var(--border)",
                  borderRadius: featIsMobile ? undefined : "var(--radius)",
                  background: featIsMobile ? undefined : "var(--surface)"
                }}
              >
                {item.badge ? (
                  <span style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--accent)"
                  }}>
                    {item.badge}
                  </span>
                ) : null}
                {item.icon?.url ? (
                  <img
                    src={item.icon.url}
                    alt={item.icon.alt ?? ""}
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: "contain",
                      borderRadius: 8
                    }}
                  />
                ) : null}
                <strong style={{ fontSize: "var(--font-size-title-md)", lineHeight: 1.3 }}>{item.title}</strong>
                <p style={{
                  margin: 0,
                  color: "var(--muted)",
                  fontSize: "var(--font-size-body)",
                  lineHeight: 1.7
                }}>
                  {item.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section
      key={block.id ?? index}
      style={{
        width: featWidth,
        maxWidth: featWidth,
        marginLeft: `calc(${viewportShiftVar} + ${featLeftInset})`,
        marginRight: `calc(${viewportShiftVar} + ${featRightInset})`,
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
              paddingLeft: `max(${minSidePadding}px, calc((${viewportWidthVar} - var(--max-width)) / 2 + ${paddingX}px))`,
              paddingRight: `max(${minSidePadding}px, calc((${viewportWidthVar} - var(--max-width)) / 2 + ${paddingX}px))`
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

const FeatureSpotlightBlockSection = ({
  block,
  index
}: {
  block: FeatureSpotlightBlock;
  index: number;
}) => {
  const items = block.items ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex] ?? items[0];
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(sectionRef, { amount: 0.15, once: true });
  const vw = useViewportWidth();
  const isMobile = vw !== null && vw < 768;

  if (!items.length) return null;

  return (
    <section
      key={block.id ?? index}
      ref={sectionRef}
      style={{ padding: "48px 0 56px" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "0 16px"
        }}
      >
        <SectionHeading eyebrow={block.eyebrow} title={block.heading} kicker={block.body} align="center" />
        <motion.div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            marginTop: isMobile ? 28 : 40
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Tab pills row */}
          <div
            className="spotlight-tabs"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? undefined : `repeat(${items.length}, 1fr)`,
              gridAutoFlow: isMobile ? "column" : undefined,
              gridAutoColumns: isMobile ? "auto" : undefined,
              gap: isMobile ? 8 : 12,
              overflow: isMobile ? "auto" : undefined
            }}
          >
            {items.map((item, idx) => (
              <button
                key={`${item.title}-${idx}`}
                onClick={() => setActiveIndex(idx)}
                className={`spotlight-tab${idx === activeIndex ? " spotlight-tab-active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: isMobile ? "12px 20px" : "14px 24px",
                  background: idx === activeIndex ? "rgba(255, 107, 53, 0.1)" : "transparent",
                  border: idx === activeIndex ? "1px solid rgba(255, 107, 53, 0.3)" : "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
                  color: idx === activeIndex ? "var(--text)" : "var(--muted)",
                  fontFamily: "inherit",
                  fontSize: "var(--font-size-body)",
                  fontWeight: idx === activeIndex ? 600 : 400
                }}
              >
                <span>{item.badge || item.title}</span>
              </button>
            ))}
          </div>

          {/* Active content panel */}
          <motion.div
            key={activeIndex}
            style={{
              padding: isMobile ? "28px 20px" : "48px 48px",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : activeItem.icon?.url ? "5fr 6fr" : "1fr",
              gap: isMobile ? 24 : 56,
              alignItems: "center",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              marginTop: isMobile ? 12 : 16,
              minHeight: isMobile ? undefined : 320
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: isMobile ? 0 : "24px 0",
              justifyContent: "center"
            }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? "var(--font-size-title-md)" : "var(--font-size-title-lg)", fontWeight: 700, lineHeight: 1.25 }}>{activeItem.title}</h3>
              <p style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: "var(--font-size-body-lg)",
                lineHeight: 1.7
              }}>
                {activeItem.body}
              </p>
              {activeItem.href ? (
                <AnchorAwareLink
                  href={activeItem.href}
                  className="nav-link"
                  trackingName="content_link_click"
                  trackingSection="feature_spotlight"
                  style={{ width: "fit-content", marginTop: 8 }}
                >
                  Learn more
                </AnchorAwareLink>
              ) : null}
            </div>
            {activeItem.icon?.url ? (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                order: isMobile ? -1 : undefined,
                overflow: "hidden",
                borderRadius: 12
              }}>
                <img
                  src={activeItem.icon.url}
                  alt={activeItem.icon.alt ?? ""}
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    height: "auto",
                    borderRadius: 12,
                    objectFit: activeItem.mediaFit === "contain" ? "contain" : "cover"
                  }}
                />
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const ScrollGalleryBlockSection = ({
  block,
  index,
  headerHeight
}: {
  block: ScrollGalleryBlock;
  index: number;
  headerHeight: number;
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

  const viewportWidth = useViewportWidth();
  const isMobile = (viewportWidth ?? Number.POSITIVE_INFINITY) <= 768;
  const mobileCardWidth = "100%";
  const contentPaddingX = 12;
  const isMobileBleed = viewportWidth !== null && viewportWidth < 680;
  const bleedGutter = isMobileBleed ? 0 : 30;
  const mobileInset = "var(--full-bleed-mobile-inset, var(--section-px, 15px))";
  const bleedLeftInset = isMobileBleed ? `max(${mobileInset}, env(safe-area-inset-left, 0px))` : `${bleedGutter / 2}px`;
  const bleedRightInset = isMobileBleed ? `max(${mobileInset}, env(safe-area-inset-right, 0px))` : `${bleedGutter / 2}px`;
  const bleedWidth = isMobileBleed
    ? `calc(${viewportWidthVar} - ${bleedLeftInset} - ${bleedRightInset})`
    : `calc(${viewportWidthVar} - ${bleedGutter}px)`;
  const bleedShiftLeft = `calc(${viewportShiftVar} + ${bleedLeftInset})`;
  const bleedShiftRight = `calc(${viewportShiftVar} + ${bleedRightInset})`;
  const bleedContentStyle: CSSProperties = {
    width: bleedWidth,
    maxWidth: bleedWidth,
    marginLeft: bleedShiftLeft,
    marginRight: bleedShiftRight,
    display: "grid",
    justifyContent: "center"
  };
  const constrainedInnerStyle: CSSProperties = {
    width: "100%",
    maxWidth: "var(--max-width)"
  };
  const fullBleedLeftInset = isMobileBleed ? `max(${mobileInset}, env(safe-area-inset-left, 0px))` : "0px";
  const fullBleedRightInset = isMobileBleed ? `max(${mobileInset}, env(safe-area-inset-right, 0px))` : "0px";
  const fullBleedWidth = isMobileBleed
    ? `calc(${viewportWidthVar} - ${fullBleedLeftInset} - ${fullBleedRightInset})`
    : viewportWidthVar;
  const fullBleedStyle: CSSProperties = {
    width: fullBleedWidth,
    maxWidth: fullBleedWidth,
    marginLeft: `calc(${viewportShiftVar} + ${fullBleedLeftInset})`,
    marginRight: `calc(${viewportShiftVar} + ${fullBleedRightInset})`,
    padding: "36px 0 42px",
    display: "flex",
    alignItems: "center",
    overflow: "hidden"
  };
  const fadeWidth = 72;
  const [sidePadding, setSidePadding] = useState(0);
  const [fadeState, setFadeState] = useState({ hasOverflow: false, left: false, right: false });
  const canScrollLeft = fadeState.hasOverflow && fadeState.left;
  const canScrollRight = fadeState.hasOverflow && fadeState.right;
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
  const horizontalPadding = isMobile ? Math.max(sidePadding, contentPaddingX) : contentPaddingX;

  const scrollByCards = (direction: "prev" | "next") => {
    const track = trackRef.current;
    const scroller = scrollContainerRef.current;
    if (!track || !scroller) return;
    const firstCard = track.querySelector<HTMLElement>("[data-gallery-card]");
    const cardWidth = firstCard?.offsetWidth ?? 320;
    const gap = 16;
    const delta = direction === "next" ? cardWidth + gap : -1 * (cardWidth + gap);
    scroller.scrollBy({ left: delta, behavior: "smooth" });
    requestAnimationFrame(() => updateFadeState(scroller));
  };

  const resolvedItems = block.items ?? [];

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

  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const firstCard = scroller.querySelector<HTMLElement>("[data-gallery-card]");
    if (!firstCard) return;

    const computePadding = () => {
      if (!isMobile) {
        setSidePadding(contentPaddingX);
        updateFadeState(scroller);
        return;
      }
      const viewport = scroller.clientWidth;
      const card = firstCard.getBoundingClientRect().width || 0;
      const base = 0;
      const next = Math.max(base, (viewport - card) / 2);
      setSidePadding(next);
      updateFadeState(scroller);
    };

    computePadding();

    const resizeObserver = new ResizeObserver(computePadding);
    resizeObserver.observe(scroller);
    resizeObserver.observe(firstCard);
    window.addEventListener("resize", computePadding);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", computePadding);
    };
  }, [isMobile, contentPaddingX, resolvedItems.length]);

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
              style={{ ...navButtonStyle, opacity: canScrollLeft ? 1 : 0.4, cursor: canScrollLeft ? "pointer" : "not-allowed" }}
              disabled={!canScrollLeft}
              aria-disabled={!canScrollLeft}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="btn secondary"
              aria-label="Next"
              onClick={() => scrollByCards("next")}
              style={{ ...navButtonStyle, opacity: canScrollRight ? 1 : 0.4, cursor: canScrollRight ? "pointer" : "not-allowed" }}
              disabled={!canScrollRight}
              aria-disabled={!canScrollRight}
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
              paddingLeft: horizontalPadding,
              paddingRight: horizontalPadding,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitMaskImage: isMobile ? "none" : edgeFadeMask,
              maskImage: isMobile ? "none" : edgeFadeMask,
              WebkitMaskSize: isMobile ? undefined : "100% 100%",
              maskSize: isMobile ? undefined : "100% 100%",
              WebkitMaskRepeat: isMobile ? undefined : "no-repeat",
              maskRepeat: isMobile ? undefined : "no-repeat",
              scrollPaddingLeft: horizontalPadding,
              scrollPaddingRight: horizontalPadding
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
                gridAutoColumns: isMobile ? mobileCardWidth : "minmax(320px, min(84vw, 520px))",
                gap: 16,
                padding: "0 0 16px 0",
                scrollSnapType: "x mandatory",
                justifyItems: isMobile ? "center" : "start"
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
                      scrollSnapAlign: isMobile ? "center" : "start"
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

type LogoItem = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  mediaType?: "image" | "video";
};

const buildPlaceholderLogo = (label: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='280' height='120' viewBox='0 0 280 120' fill='none'><rect width='280' height='120' rx='18' fill='%23f8f8f8' /><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='44' font-weight='700' fill='%23222'>${label}</text></svg>`)}`;

const placeholderLogos: LogoItem[] = ["Northwind", "Aperture", "Lumen", "Scout", "Harbor", "Beacon"].map((name, idx) => ({
  id: `placeholder-${idx}`,
  url: buildPlaceholderLogo(name),
  alt: `${name} placeholder logo`
}));

const shuffleLogos = (items: LogoItem[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

type StatItemRecord = StatsBlock["items"][number];

const parseStatValue = (rawValue: string) => {
  const match = rawValue.trim().match(/^(\d[\d,]*)([A-Za-z]*)$/);
  if (!match) return null;

  const target = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(target)) return null;

  return {
    target,
    compactSuffix: match[2] ?? "",
    useGrouping: match[1].includes(",")
  };
};

const formatStatValue = (value: number, useGrouping: boolean) =>
  useGrouping ? new Intl.NumberFormat("en-US").format(value) : String(value);

const AnimatedStatValue = ({
  item,
  scrollProgress,
  revealStart,
  revealEnd,
  hideQualifierPrefix
}: {
  item: StatItemRecord;
  scrollProgress: MotionValue<number>;
  revealStart: number;
  revealEnd: number;
  hideQualifierPrefix: boolean;
}) => {
  const parsed = useMemo(() => parseStatValue(item.value), [item.value]);
  const animatedValue = useTransform(scrollProgress, [revealStart, revealEnd], [0, parsed?.target ?? 1]);
  const [displayValue, setDisplayValue] = useState(() => {
    if (!parsed) return item.value;
    return `${formatStatValue(0, parsed.useGrouping)}${parsed.compactSuffix}`;
  });

  useMotionValueEvent(animatedValue, "change", (latest) => {
    if (!parsed) return;
    setDisplayValue(`${formatStatValue(Math.round(latest), parsed.useGrouping)}${parsed.compactSuffix}`);
  });

  useEffect(() => {
    if (!parsed) {
      setDisplayValue(item.value);
      return;
    }

    setDisplayValue(`${formatStatValue(Math.round(animatedValue.get()), parsed.useGrouping)}${parsed.compactSuffix}`);
  }, [animatedValue, item.value, parsed]);

  return (
    <>
      {hideQualifierPrefix ? "" : item.prefix ?? ""}
      {displayValue}
      {item.suffix ?? ""}
    </>
  );
};

const getScrubWindow = (idx: number, total: number, start = 0.14, span = 0.28) => {
  const stagger = total > 1 ? (idx / (total - 1)) * 0.14 : 0;
  const revealStart = Math.min(0.78, start + stagger);
  const revealEnd = Math.min(0.94, revealStart + span);
  return { revealStart, revealEnd };
};

const ScrollScrubStatCard = ({
  children,
  idx,
  total,
  isCard,
  scrollProgress
}: {
  children: ReactNode;
  idx: number;
  total: number;
  isCard: boolean;
  scrollProgress: MotionValue<number>;
}) => {
  const { revealStart, revealEnd } = getScrubWindow(idx, total);
  const opacity = useTransform(scrollProgress, [revealStart, revealEnd], [0, 1]);
  const y = useTransform(scrollProgress, [revealStart, revealEnd], [34, 0]);
  const scale = useTransform(scrollProgress, [revealStart, revealEnd], [0.96, 1]);
  const rotateX = useTransform(scrollProgress, [revealStart, revealEnd], [-6, 0]);
  const filter = useTransform(scrollProgress, [revealStart, revealEnd], ["blur(10px)", "blur(0px)"]);

  return (
    <motion.div
      style={{
        minHeight: isCard ? 140 : undefined,
        padding: isCard ? "28px 24px 22px" : 16,
        borderRadius: 0,
        border: "none",
        background: isCard ? "var(--stats-card-bg)" : "transparent",
        transformStyle: "preserve-3d",
        willChange: "transform, opacity, filter",
        opacity,
        y,
        scale,
        rotateX,
        filter
      }}
    >
      {children}
    </motion.div>
  );
};

const StatsBlockSection = ({ block, index }: { block: StatsBlock; index: number }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 82%", "end 52%"]
  });
  const items = block.items ?? [];
  const isCard = block.variant === "card";

  return (
    <motion.section
      ref={sectionRef}
      key={block.id ?? index}
      style={{
        width: "100%",
        maxWidth: "var(--max-width)",
        minHeight: "100svh",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: sectionPx,
        paddingRight: sectionPx,
        paddingTop: "clamp(72px, 10vh, 128px)",
        paddingBottom: "clamp(72px, 10vh, 128px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <style>{`
        @media (max-width: 600px) {
          [data-stats-grid] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 380px) {
          [data-stats-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="grid" style={{ gap: 24, width: "100%" }}>
        {block.heading ? (
          <SectionHeading
            eyebrow={block.eyebrow}
            title={block.heading}
            kicker={block.body}
            align="center"
          />
        ) : null}
        <motion.div
          data-stats-grid
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${items.length}, 1fr)`,
            gap: isCard ? 2 : 16,
            textAlign: "left",
            borderRadius: isCard ? "var(--radius-md)" : undefined,
            overflow: isCard ? "hidden" : undefined,
            perspective: 1000
          }}
        >
          {items.map((item, idx) => {
            const hasQualifierPrefix = Boolean(item.prefix?.trim() && /[A-Za-z]/.test(item.prefix));
            const { revealStart, revealEnd } = getScrubWindow(idx, items.length);

            return (
              <ScrollScrubStatCard
                key={`${item.label}-${idx}`}
                idx={idx}
                total={items.length}
                isCard={isCard}
                scrollProgress={scrollYProgress}
              >
                <div
                  style={{
                    fontFamily: "var(--font-stat)",
                    fontSize: "var(--font-size-stat)",
                    fontWeight: 300,
                    lineHeight: 0.86,
                    color: "var(--fg)",
                    letterSpacing: 0
                  }}
                >
                  <AnimatedStatValue
                    item={item}
                    scrollProgress={scrollYProgress}
                    revealStart={revealStart}
                    revealEnd={revealEnd}
                    hideQualifierPrefix={hasQualifierPrefix}
                  />
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-sm)",
                    lineHeight: 1.5,
                    color: "var(--muted)",
                    marginTop: 12
                  }}
                >
                  {item.label}
                </div>
              </ScrollScrubStatCard>
            );
          })}
        </motion.div>
        {block.ctaLabel && block.ctaHref ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AnchorAwareLink className="btn" href={block.ctaHref} trackingSection="stats_cta">
              {block.ctaLabel}
            </AnchorAwareLink>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
};

const ComparisonBlockSection = ({ block, index }: { block: ComparisonBlock; index: number }) => {
  const preset = animationPresets[defaultAnimationPreset];
  const gridRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(gridRef, { amount: 0.3, once: true });
  const [colA, colB] = block.columns ?? [];
  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
  };

  const CheckIcon = () => (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "var(--accent)",
      flexShrink: 0,
      marginTop: 2
    }}>
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
  const XIcon = () => (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "var(--border-strong)",
      flexShrink: 0,
      marginTop: 2
    }}>
      <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </span>
  );

  const highlightedColumn = block.columns?.find((col) => col.highlighted) ?? colB ?? colA;
  const otherColumn = block.columns?.find((col) => !col.highlighted) ?? colA ?? colB;
  const tableHeaders = {
    feature: block.tableHeaders?.feature ?? "Feature",
    highlighted: block.tableHeaders?.highlighted ?? highlightedColumn?.heading ?? "Campfire",
    other: block.tableHeaders?.other ?? otherColumn?.heading ?? "The other guys"
  };
  const tableRows: NonNullable<ComparisonBlock["rows"]> = (block.rows ?? []).length
    ? block.rows ?? []
    : Array.from({ length: Math.max(highlightedColumn?.items?.length ?? 0, otherColumn?.items?.length ?? 0) }, (_, rowIdx) => ({
        feature: `Point ${rowIdx + 1}`,
        highlighted: highlightedColumn?.items?.[rowIdx] ?? "",
        other: otherColumn?.items?.[rowIdx] ?? ""
      }));

  return (
    <motion.section
      key={block.id ?? index}
      style={{
        width: "100%",
        maxWidth: "var(--max-width)",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: sectionPx,
        paddingRight: sectionPx
      }}
      data-comparison-table-section
      variants={preset.item}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      custom={index}
    >
      <style>{`
        [data-comparison-table-section] {
          --comparison-panel: color-mix(in srgb, var(--surface) 96%, var(--bg));
          --comparison-header: color-mix(in srgb, var(--muted-surface) 52%, transparent);
          --comparison-highlight: color-mix(in srgb, var(--accent-soft) 32%, var(--surface));
          --comparison-highlight-border: color-mix(in srgb, var(--accent) 24%, var(--border-strong));
          --comparison-highlight-text: color-mix(in srgb, var(--text) 88%, var(--accent));
        }
        [data-comparison-table] {
          overflow: hidden;
          position: relative;
        }
        [data-comparison-table-header],
        [data-comparison-table-row],
        [data-comparison-table-footer] {
          display: grid;
          grid-template-columns: minmax(140px, 0.7fr) minmax(0, 1.08fr) minmax(0, 1fr);
          position: relative;
          z-index: 1;
        }
        [data-comparison-table-header] > div,
        [data-comparison-table-cell] {
          padding: 13px 16px;
        }
        [data-comparison-table-row] {
          border-top: 1px solid var(--border);
        }
        [data-table-highlight-cell] {
          position: relative;
          background: var(--comparison-highlight);
          border-left: 1px solid var(--comparison-highlight-border);
          border-right: 1px solid var(--comparison-highlight-border);
        }
        [data-comparison-table-footer] {
          border-top: 1px solid var(--border-strong);
          background: color-mix(in srgb, var(--muted-surface) 22%, transparent);
        }
        @media (max-width: 760px) {
          [data-comparison-table-header] {
            display: none;
          }
          [data-comparison-table-row],
          [data-comparison-table-footer] {
            display: block;
          }
          [data-comparison-table-row] {
            border-top: 1px solid var(--border);
            padding: 10px 0;
          }
          [data-comparison-table-header] > div,
          [data-comparison-table-cell] {
            padding: 5px 14px;
          }
          [data-table-feature-cell] {
            padding-bottom: 8px;
          }
          [data-table-highlight-cell] {
            background: transparent;
            border: 0;
          }
          [data-table-highlight-cell],
          [data-table-other-cell] {
            display: grid;
            grid-template-columns: 72px minmax(0, 1fr);
            column-gap: 10px;
            align-items: flex-start;
          }
          [data-table-highlight-cell]::before,
          [data-table-other-cell]::before {
            content: attr(data-column-label);
            display: block;
            padding-top: 3px;
            color: var(--muted);
            font-family: var(--font-sans, "Rubik", system-ui, -apple-system, sans-serif);
            font-size: 10px;
            font-style: normal;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          [data-table-highlight-cell]::before {
            color: var(--accent-strong);
          }
          [data-comparison-table-footer] {
            padding: 12px 0;
          }
        }
      `}</style>
      <div className="grid" style={{ gap: 18 }}>
        {block.heading ? (
          <SectionHeading
            eyebrow={block.eyebrow}
            title={block.heading}
            kicker={block.body}
            align="center"
          />
        ) : null}
        <motion.div
          ref={gridRef}
          data-comparison-table
          style={{
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            background: "var(--comparison-panel)",
            boxShadow: "none"
          }}
          variants={preset.container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <div
            data-comparison-table-header
            style={{
              background: "var(--comparison-header)",
              borderBottom: "1px solid var(--border)",
              color: "var(--muted)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase"
            }}
          >
            <div data-table-feature-cell style={{ color: "var(--muted)", lineHeight: 1.2 }}>
              {tableHeaders.feature}
            </div>
            <div
              style={{
                background: "var(--comparison-highlight)",
                borderLeft: "1px solid var(--comparison-highlight-border)",
                borderRight: "1px solid var(--comparison-highlight-border)",
                color: "var(--accent)",
                fontWeight: 700,
                lineHeight: 1.2
              }}
            >
              {tableHeaders.highlighted}
            </div>
            <div data-table-feature-cell style={{ color: "var(--muted)", lineHeight: 1.2 }}>
              {tableHeaders.other}
            </div>
          </div>
          <div data-comparison-table-body>
            {tableRows.map((row, rowIdx) => (
              <motion.div key={`${row.feature}-${rowIdx}`} data-comparison-table-row variants={fadeUp}>
                <div
                  data-comparison-table-cell
                  data-table-feature-cell
                  data-table-side-cell
                  style={{
                    color: "var(--text)",
                    fontWeight: 700,
                    alignSelf: "stretch"
                  }}
                >
                  <div style={{ fontSize: "var(--font-size-body)", lineHeight: 1.2 }}>{row.feature}</div>
                  {row.label ? (
                    <div
                      style={{
                        marginTop: 4,
                        color: "var(--muted)",
                        fontSize: 10.5,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      {row.label}
                    </div>
                  ) : null}
                </div>
                <div
                  data-comparison-table-cell
                  data-table-highlight-cell
                  data-column-label={tableHeaders.highlighted}
                  style={{
                    color: "var(--comparison-highlight-text)",
                    fontSize: "var(--font-size-label)",
                    lineHeight: 1.4,
                    alignSelf: "stretch"
                  }}
                >
                  <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <CheckIcon />
                    <span style={{ fontWeight: 500 }}>{row.highlighted}</span>
                  </div>
                </div>
                <div
                  data-comparison-table-cell
                  data-table-side-cell
                  data-table-other-cell
                  data-column-label={tableHeaders.other}
                  style={{
                    color: "var(--muted)",
                    fontSize: "var(--font-size-label)",
                    lineHeight: 1.4,
                    alignSelf: "stretch"
                  }}
                >
                  <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <XIcon />
                    <span>{row.other}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {block.footer ? (
            <div data-comparison-table-footer>
              <div
                data-comparison-table-cell
                data-table-side-cell
                style={{
                  color: "var(--text)",
                  fontSize: "var(--font-size-body)",
                  fontWeight: 700
                }}
              >
                {block.footer.feature}
              </div>
              <div
                data-comparison-table-cell
                data-table-highlight-cell
                data-column-label={tableHeaders.highlighted}
                style={{
                  color: "var(--accent-strong)",
                  fontWeight: 700,
                  lineHeight: 1.5
                }}
              >
                {block.footer.highlighted}
              </div>
              <div
                data-comparison-table-cell
                data-table-side-cell
                data-table-other-cell
                data-column-label={tableHeaders.other}
                style={{
                  color: "var(--muted)",
                  lineHeight: 1.5
                }}
              >
                {block.footer.other}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </motion.section>
  );
};

const LogosBlockSection = ({ block, index, audienceFilter }: { block: LogosBlock; index: number; audienceFilter?: string }) => {
  const maxLogosBase = clampNumber(block.limit ?? 12, 1, 20);
  // Enforce an even count so we can split the wall evenly between two rows.
  const maxLogos = Math.max(2, maxLogosBase - (maxLogosBase % 2));
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [shuffledPrimary, setShuffledPrimary] = useState<LogoItem[]>([]);
  const [shuffledSecondary, setShuffledSecondary] = useState<LogoItem[]>([]);
  const wallRef = useRef<HTMLDivElement | null>(null);
  const primaryTrackRef = useRef<HTMLDivElement | null>(null);
  const secondaryTrackRef = useRef<HTMLDivElement | null>(null);
  const [primaryDistance, setPrimaryDistance] = useState(0);
  const [secondaryDistance, setSecondaryDistance] = useState(0);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        setLogos(shuffleLogos(placeholderLogos.slice(0, maxLogos)));
        return;
      }
      try {
        setLoading(true);
        const db = getFirestore(getFirebaseApp());
        const mediaRef = collection(db, "media");
        const baseConstraints: QueryConstraint[] = [where("status", "==", "published"), where("type", "in", ["Logo", "logo"])];

        const toLogoItem = (doc: any): LogoItem => {
          const data = doc.data() as any;
          const mediaType: LogoItem["mediaType"] =
            data.mediaType === "video" || data.type === "video" ? "video" : "image";
          return {
            id: doc.id,
            url: data.url,
            alt: data.alt ?? data.name ?? "Logo",
            mediaType,
            width: data.width,
            height: data.height
          };
        };
        const isValidLogo = (item: LogoItem) => item.url && item.mediaType !== "video";

        let items: LogoItem[] = [];

        // 1. Prioritize audience-matched logos
        if (audienceFilter) {
          const industryQ = query(
            mediaRef,
            ...baseConstraints,
            where("industry", "array-contains", audienceFilter),
            limit(maxLogos)
          );
          const industrySnap = await getDocs(industryQ);
          if (canceled) return;
          items = industrySnap.docs.map(toLogoItem).filter(isValidLogo);
        }

        // 2. Backfill remaining spots with any-industry logos
        if (items.length < maxLogos) {
          const remaining = maxLogos - items.length;
          const backfillQ = query(mediaRef, ...baseConstraints, limit(remaining + items.length));
          const backfillSnap = await getDocs(backfillQ);
          if (canceled) return;
          const existingIds = new Set(items.map((i) => i.id));
          const backfill = backfillSnap.docs
            .map(toLogoItem)
            .filter((item) => isValidLogo(item) && !existingIds.has(item.id));
          items = [...items, ...backfill].slice(0, maxLogos);
        }

        if (!items.length) {
          setLogos(shuffleLogos(placeholderLogos.slice(0, maxLogos)));
        } else {
          setLogos(shuffleLogos(items));
        }
      } catch (error) {
        console.error("Failed to load logos", error);
        if (!canceled) setLogos(shuffleLogos(placeholderLogos.slice(0, maxLogos)));
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [maxLogos, audienceFilter]);

  useEffect(() => {
    const rotateLogos = (items: LogoItem[]) => {
      if (!items.length) return items;
      const offset = Math.floor(Math.random() * items.length);
      return [...items.slice(offset), ...items.slice(0, offset)];
    };

    const ensureEvenLogos = (items: LogoItem[]) => {
      if (!items.length) return items;
      const evenCount = items.length - (items.length % 2);
      if (evenCount >= 2) return items.slice(0, evenCount);
      // Only one logo available; duplicate with a placeholder to keep the row split even.
      const filler = placeholderLogos.find((item) => item.id !== items[0].id) ?? items[0];
      return [items[0], filler];
    };

    const resolvedRaw = (logos.length ? logos : placeholderLogos).slice(0, maxLogos);
    const resolved = ensureEvenLogos(resolvedRaw);
    const randomized = resolved.length ? rotateLogos(shuffleLogos(resolved)) : resolved;
    const half = Math.floor(randomized.length / 2);
    const primary = randomized.slice(0, half);
    const secondary = randomized.slice(half);
    setShuffledPrimary(primary);
    setShuffledSecondary(secondary);
  }, [logos, maxLogos]);

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;
    const prefersDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const computeTheme = () => {
      const attrTheme = root.getAttribute("data-theme") || root.getAttribute("data-base-theme");
      if (attrTheme === "dark" || attrTheme === "light") {
        setIsDarkTheme(attrTheme === "dark");
        return;
      }
      setIsDarkTheme(prefersDark());
    };
    computeTheme();
    const observer = new MutationObserver(computeTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-base-theme"] });
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handleMedia = () => computeTheme();
    media?.addEventListener?.("change", handleMedia);
    return () => {
      observer.disconnect();
      media?.removeEventListener?.("change", handleMedia);
    };
  }, []);

  useEffect(() => {
    const measure = () => {
      const wallWidth = wallRef.current?.offsetWidth ?? 0;
      const primaryWidth = primaryTrackRef.current?.scrollWidth ?? 0;
      const secondaryWidth = secondaryTrackRef.current?.scrollWidth ?? 0;
      setPrimaryDistance(Math.max(0, primaryWidth - wallWidth));
      setSecondaryDistance(Math.max(0, secondaryWidth - wallWidth));
    };

    const resizeObserver = new ResizeObserver(() => measure());
    if (wallRef.current) resizeObserver.observe(wallRef.current);
    if (primaryTrackRef.current) resizeObserver.observe(primaryTrackRef.current);
    if (secondaryTrackRef.current) resizeObserver.observe(secondaryTrackRef.current);
    measure();
    const raf = window.requestAnimationFrame(measure);
    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(raf);
    };
  }, [shuffledPrimary, shuffledSecondary]);

  const loopedPrimary = shuffledPrimary.length ? [...shuffledPrimary, ...shuffledPrimary] : shuffledPrimary;
  const loopedSecondary = shuffledSecondary.length ? [...shuffledSecondary, ...shuffledSecondary] : shuffledSecondary;
  const logoCellStyle: CSSProperties = {
    minWidth: 140,
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    background: "transparent"
  };
  const imgStyle: CSSProperties = {
    maxWidth: 85,
    maxHeight: 52,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    transition: "filter 160ms ease, mix-blend-mode 160ms ease"
  };
  const logoFilter = isDarkTheme
    ? "invert(1) grayscale(1) brightness(3.2) contrast(1.35)"
    : "grayscale(1)";
  const logoBlendMode = isDarkTheme ? "screen" : "normal";
  const wallBackground = "transparent";

  return (
    <section
      key={block.id ?? index}
      style={{ width: "100%", pointerEvents: "none" }}
    >
      <style suppressHydrationWarning>{`
        [data-logos-track] {
          display: flex;
          align-items: center;
          gap: 18px;
          width: max-content;
          will-change: transform;
        }
        @media (max-width: 640px) {
          [data-logos-wall] {
            padding: 10px 12px 2px;
          }
          [data-logos-track] {
            gap: 12px;
          }
        }
      `}</style>
      <div className="grid" style={{ gap: 14 }}>
        <div style={{ textAlign: "center", display: "grid", gap: 6 }}>
          <SectionHeading eyebrow={block.eyebrow} title={block.heading ?? "Partners"} align="center" />
        </div>
        <div
          data-logos-wall
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 0,
            background: wallBackground,
            padding: "14px 16px",
            ["--logos-duration" as string]: "26s"
          }}
          ref={wallRef}
        >
          <div style={{ display: "grid", gap: 12, position: "relative" }}>
            <div style={{ position: "relative", overflow: "hidden" }}>
              <motion.div
                data-logos-track
                ref={primaryTrackRef}
                key={`logos-primary-${primaryDistance}-${loopedPrimary.length}`}
                animate={
                  primaryDistance > 0
                    ? { x: [0, -primaryDistance] }
                    : { x: 0 }
                }
                transition={{
                  duration: Math.max(18, primaryDistance / 24),
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear"
                }}
              >
                {loopedPrimary.map((logo, idx) => (
                  <div key={`${logo.id}-${idx}`} style={logoCellStyle} aria-label={logo.alt ?? "Logo"}>
                    <img
                      src={logo.url}
                      alt={logo.alt ?? ""}
                      style={{ ...imgStyle, filter: logoFilter, mixBlendMode: logoBlendMode }}
                      width={logo.width}
                      height={logo.height}
                      data-logos-img
                    />
                  </div>
                ))}
              </motion.div>
            </div>
            {loopedSecondary.length > 0 ? (
              <div style={{ position: "relative", overflow: "hidden" }}>
                <motion.div
                  data-logos-track
                  data-direction="reverse"
                  data-variation="alt"
                  ref={secondaryTrackRef}
                  key={`logos-secondary-${secondaryDistance}-${loopedSecondary.length}`}
                  animate={
                    secondaryDistance > 0
                      ? { x: [-secondaryDistance, 0] }
                      : { x: 0 }
                  }
                  transition={{
                    duration: Math.max(20, secondaryDistance / 24),
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear"
                  }}
                >
                  {loopedSecondary.map((logo, idx) => (
                    <div key={`${logo.id}-rev-${idx}`} style={logoCellStyle} aria-label={logo.alt ?? "Logo"}>
                      <img
                        src={logo.url}
                        alt={logo.alt ?? ""}
                        style={{ ...imgStyle, filter: logoFilter, mixBlendMode: logoBlendMode }}
                        width={logo.width}
                        height={logo.height}
                        data-logos-img
                      />
                    </div>
                  ))}
                </motion.div>
              </div>
            ) : null}
          </div>
        </div>
        {!logos.length && !loading ? (
          <p style={{ margin: 0, textAlign: "center", color: "var(--muted)", fontSize: "var(--font-size-sm)" }}>
            Add media items with type <code>Logo</code> to replace the placeholders.
          </p>
        ) : null}
        {loading ? (
            <p style={{ margin: 0, textAlign: "center", color: "var(--muted)", fontSize: "var(--font-size-sm)" }}>Loading logos…</p>
          ) : null}
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

// Showcase assets are always portrait 9x16, so start with that ratio to avoid a resize jump on load.
const showcaseDefaultRatio = 9 / 16;

const stableUnitInterval = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
};

const ScrollScrubShowcaseCard = ({
  children,
  idx,
  total,
  scrollProgress,
  style,
  onMouseEnter,
  onMouseLeave
}: {
  children: ReactNode;
  idx: number;
  total: number;
  scrollProgress: MotionValue<number>;
  style?: CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => {
  const { revealStart, revealEnd } = getScrubWindow(idx, total, 0.08, 0.3);
  const opacity = useTransform(scrollProgress, [revealStart, revealEnd], [0, 1]);
  const y = useTransform(scrollProgress, [revealStart, revealEnd], [48, 0]);
  const scale = useTransform(scrollProgress, [revealStart, revealEnd], [0.92, 1]);
  const filter = useTransform(scrollProgress, [revealStart, revealEnd], ["blur(12px)", "blur(0px)"]);

  return (
    <motion.div
      style={{
        ...style,
        opacity,
        y,
        scale,
        filter,
        willChange: "transform, opacity, filter"
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.div>
  );
};

const ShowcaseBlockSection = ({
  block,
  index,
  headerHeight,
  audienceFilter
}: {
  block: ShowcaseBlock;
  index: number;
  headerHeight: number;
  audienceFilter?: string;
}) => {
  const basePaddingX = 0;
  const sectionRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1280);
  const [items, setItems] = useState<ShowcaseMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const zSeedsRef = useRef<Record<string, number>>({});
  const viewportWidth = useViewportWidth();
  const isNarrow = containerWidth < 720;
  const mobilePaddingX = 15;
  const paddingX = isNarrow ? mobilePaddingX : basePaddingX;
  const typeFilter = block.typeFilter?.trim();
  const industryFilter = audienceFilter || block.industryFilter?.trim();
  const featuredOnly = Boolean(block.featuredOnly);
  const resultsLimit = clampNumber(block.limit ?? 6, 1, 24);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 88%", "end 52%"]
  });

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

        const toItem = (doc: any): ShowcaseMediaItem => {
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
        };

        const baseConstraints: QueryConstraint[] = [where("status", "==", "published"), where("type", "==", typeFilter)];
        if (featuredOnly) {
          baseConstraints.push(where("featured", "==", true));
        }

        let data: ShowcaseMediaItem[] = [];

        // 1. Fetch industry-matched items first (prioritized)
        if (industryFilter) {
          const industryQ = query(
            mediaRef,
            ...baseConstraints,
            where("industry", "array-contains", industryFilter),
            limit(resultsLimit)
          );
          const industrySnap = await getDocs(industryQ);
          data = industrySnap.docs.map(toItem);
        }

        // 2. Backfill remaining spots with any-industry media
        if (data.length < resultsLimit) {
          const remaining = resultsLimit - data.length;
          const backfillQ = query(mediaRef, ...baseConstraints, limit(remaining + data.length));
          const backfillSnap = await getDocs(backfillQ);
          const existingIds = new Set(data.map((d) => d.id));
          const backfill = backfillSnap.docs
            .map(toItem)
            .filter((item) => !existingIds.has(item.id));
          data = [...data, ...backfill].slice(0, resultsLimit);
        }

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
  }, [typeFilter, industryFilter, audienceFilter, featuredOnly, resultsLimit]);

  const displayItems = (items.length ? items.slice(0, resultsLimit) : []).slice(0, resultsLimit);
  const cardCount = displayItems.length || 1;

  const availableWidth = Math.max(320, containerWidth - paddingX * 2);
  const overlapBase = clampNumber(Math.round(availableWidth / 18), 42, 140);
  const overlapBoost = clampNumber(Math.round((1150 - availableWidth) / 20), 0, 36);
  const overlap = clampNumber(Math.max(isNarrow ? 64 : 42, overlapBase + overlapBoost), 42, 160);
  const minCardWidth = 220;
  const maxCardWidth = 520;
  const computedFitWidth = (availableWidth + overlap * (cardCount - 1)) / cardCount;
  const fittedCardWidth = clampNumber(computedFitWidth, minCardWidth, maxCardWidth);
  const forceScroll = (viewportWidth ?? Number.POSITIVE_INFINITY) < 768;
  const shouldScroll = forceScroll || isNarrow;
  const cardWidth = shouldScroll ? Math.min(320, Math.max(minCardWidth, fittedCardWidth)) : fittedCardWidth;
  const maxCardHeight = shouldScroll
    ? clampNumber(viewportHeight !== null ? viewportHeight - headerHeight - 96 : 560, 260, 660)
    : null;
  const totalWidth = cardCount * cardWidth - overlap * (cardCount - 1);
  const scrollBleedX = shouldScroll ? clampNumber(Math.round(cardWidth * 0.14), 28, 56) : 0;
  const scrollPaddingX = shouldScroll ? scrollBleedX : paddingX;
  const stackBleedY = clampNumber(Math.round(cardWidth * 0.22), 48, 92);

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
      const key = `${item.id ?? `card-${idx}`}-${item.url}`;
      if (!(key in zSeedsRef.current)) {
        zSeedsRef.current[key] = stableUnitInterval(key);
      }
    });
  }, [displayItems]);
  const rotations = [-6, -2.5, 3.5, 1, -4.5, 5, -1.5];

  const sectionPadding = isNarrow ? "0" : "40px 0 52px";

const ShowcaseMedia = ({
  item,
  onLoaded,
  loaded: externallyLoaded,
  mediaKey,
  priority = false
}: {
  item: ShowcaseMediaItem;
  onLoaded?: (ratio?: number) => void;
  loaded?: boolean;
  mediaKey: string;
  priority?: boolean;
}) => {
  const [ready, setReady] = useState(false);
  const hasLoadedRef = useRef(false);
  const lastMediaKeyRef = useRef<string | null>(null);
  const onLoadedRef = useRef(onLoaded);
    useEffect(() => {
      onLoadedRef.current = onLoaded;
    }, [onLoaded]);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const isVideo = item.mediaType === "video" || /\.(mp4|mov|webm|ogg)$/i.test(item.url);
    const isLoaded = ready || externallyLoaded;
    const mediaStyle: CSSProperties = {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      filter: isLoaded ? "blur(0px)" : "blur(14px)",
      transform: isLoaded ? "scale(1)" : "scale(1.04)",
      opacity: isLoaded ? 1 : 0.7,
      transition: "filter 220ms ease, transform 260ms ease, opacity 220ms ease",
      display: "block",
      willChange: "filter, transform"
    };

    const markLoaded = useCallback(
      (ratio?: number) => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;
        setReady(true);
        onLoadedRef.current?.(ratio);
      },
      []
    );

    useEffect(() => {
      const isNewMedia = lastMediaKeyRef.current !== mediaKey;
      if (isNewMedia) {
        lastMediaKeyRef.current = mediaKey;
        hasLoadedRef.current = false;
        setReady(false);
      }
      if (externallyLoaded && !hasLoadedRef.current) {
        hasLoadedRef.current = true;
        setReady(true);
      }
      const node = isVideo ? videoRef.current : imageRef.current;
      if (node instanceof HTMLImageElement && node.complete) {
        if (node.naturalWidth && node.naturalHeight) {
          markLoaded(node.naturalWidth / node.naturalHeight);
          return;
        }
        markLoaded();
      }
      if (node instanceof HTMLVideoElement && node.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (node.videoWidth && node.videoHeight) {
          markLoaded(node.videoWidth / node.videoHeight);
          return;
        }
        markLoaded();
      }
    }, [isVideo, item.url, markLoaded, mediaKey, externallyLoaded]);

    useEffect(() => {
      if (!externallyLoaded) return;
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;
      setReady(true);
    }, [externallyLoaded]);

  useEffect(() => {
    if (isLoaded) return;
    const fallback = window.setTimeout(() => markLoaded(), 900);
    return () => window.clearTimeout(fallback);
  }, [isLoaded, item.url, markLoaded, mediaKey]);

  if (isVideo) {
    return (
      <video
        src={item.url}
        style={mediaStyle}
        ref={videoRef}
        muted
        preload={priority ? "auto" : "metadata"}
        playsInline
        loop
        autoPlay
        onLoadedData={(e) => {
          const video = e.currentTarget;
          markLoaded(video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : undefined);
        }}
          onCanPlay={(e) => {
            const video = e.currentTarget;
            markLoaded(video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : undefined);
          }}
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            if (video.videoWidth && video.videoHeight) {
              markLoaded(video.videoWidth / video.videoHeight);
            }
          }}
          onError={() => markLoaded()}
        />
      );
    }

    return (
      <img
        src={item.url}
        alt={item.alt ?? ""}
        style={mediaStyle}
        fetchPriority={priority ? "high" : "auto"}
        ref={imageRef}
        loading={priority ? "eager" : "lazy"}
        onLoad={(e) => {
          const img = e.currentTarget;
          markLoaded(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : undefined);
        }}
        onError={() => markLoaded()}
      />
    );
  };

  return (
    <section
      ref={sectionRef}
      key={block.id ?? index}
      style={{
        width: "100%",
        maxWidth: "100%",
        marginLeft: 0,
        marginRight: 0,
        padding: sectionPadding,
        display: "flex",
        alignItems: isNarrow ? "flex-start" : "center",
        overflow: "visible"
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
            padding: shouldScroll ? `${stackBleedY}px ${scrollPaddingX}px ${stackBleedY + 12}px` : "0",
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
              width: shouldScroll ? totalWidth : `${totalWidth}px`,
              marginLeft: shouldScroll ? undefined : `calc(50% - ${totalWidth / 2}px)`,
              display: "flex",
              justifyContent: shouldScroll ? "flex-start" : "center",
              alignItems: "center",
              padding: shouldScroll ? "0" : `${stackBleedY}px 0`,
              opacity: loading && !items.length ? 0.65 : 1,
              paddingLeft: shouldScroll ? 4 : 0,
              paddingRight: shouldScroll ? 4 : 0
            }}
          >
            {displayItems.length ? (
              displayItems.map((item, cardIdx) => {
                const fallbackRatio = showcaseDefaultRatio;
                const cardKey = `${item.id ?? `card-${cardIdx}`}-${item.url}`;
                const seed = zSeedsRef.current[cardKey] ?? stableUnitInterval(cardKey);
                const baseZ = Math.round(seed * 100);
                const isHovered = hoveredId === cardKey;
                const ratio =
                  ratios[cardKey] ||
                  (item.width && item.height && item.width > 0 && item.height > 0 ? item.width / item.height : fallbackRatio);
                const isLoaded = loadedMap[cardKey];
                const cardW = Math.min(cardWidth, (maxCardHeight ?? Infinity) * ratio);
                const cardH = cardW / ratio;
                const isVideo = item.mediaType === "video" || /\.(mp4|mov|webm|ogg)$/i.test(item.url);
                const hue = (cardIdx * 37) % 360;
                const seededRotate = (seed - 0.5) * 13;
                const baseRotate = Math.abs(seededRotate) > 1.2 ? seededRotate : rotations[cardIdx % rotations.length];
                const hoverRotate = baseRotate * 0.4;
                const liftY = isHovered ? (cardIdx % 2 === 0 ? -2 : 4) : cardIdx % 2 === 0 ? -4 : 6;

                return (
                  <ScrollScrubShowcaseCard
                    key={cardKey}
                    idx={cardIdx}
                    total={displayItems.length}
                    scrollProgress={scrollYProgress}
                    style={{
                      marginLeft: cardIdx === 0 ? 0 : -overlap,
                      zIndex: isHovered ? baseZ + 200 : baseZ + 50,
                      transition: "margin 0.24s ease"
                    }}
                    onMouseEnter={() => setHoveredId(cardKey)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      style={{
                        transform: `translateY(${liftY}px) rotate(${isHovered ? hoverRotate : baseRotate}deg)`,
                        transformOrigin: "center",
                        transition: "transform 0.3s ease"
                      }}
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
                        <ShowcaseMedia
                          item={item}
                          onLoaded={(ratio) => {
                            setLoadedMap((prev) => ({ ...prev, [cardKey]: true }));
                            if (ratio) {
                              setRatios((prev) => ({ ...prev, [cardKey]: ratio }));
                            }
                          }}
                          loaded={isLoaded}
                          mediaKey={cardKey}
                          priority={cardIdx < 2}
                        />
                      ) : (
                        <ShowcaseMedia
                          item={item}
                          onLoaded={(ratio) => {
                            setLoadedMap((prev) => ({ ...prev, [cardKey]: true }));
                            if (ratio) {
                              setRatios((prev) => ({ ...prev, [cardKey]: ratio }));
                            }
                          }}
                          loaded={isLoaded}
                          mediaKey={cardKey}
                          priority={cardIdx < 2}
                        />
                      )}
                      </div>
                    </div>
                  </ScrollScrubShowcaseCard>
                );
              })
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ArticleFeaturedBlockSection = ({ block }: { block: ArticleFeaturedBlock }) => {
  const post = block.posts?.[0];
  if (!post) return null;
  const published = formatDate(post.published_at);
  return (
    <section className="container learn-shell learn-featured-section" style={{ display: "grid", gap: 24 }}>
      <Link href={`/learn/${post.slug}`} className="learn-featured-link">
        <div className="learn-featured">
          <div className="learn-featured-content">
            <div className="learn-featured-meta">
              {published ? <span className="learn-date">{published}</span> : null}
            </div>
            <h2 className="learn-featured-title">{post.title}</h2>
            {post.excerpt ? <p style={{ color: "var(--muted)", margin: 0 }}>{post.excerpt}</p> : null}
            <span className="btn learn-featured-cta">Read more</span>
          </div>
          <div className="learn-featured-media">
            {post.feature_image ? (
              <img src={post.feature_image} alt={post.feature_image_alt ?? post.title} />
            ) : (
              <div className="learn-media-placeholder">Studio Tak</div>
            )}
          </div>
        </div>
      </Link>
    </section>
  );
};

const ArticleGridBlockSection = ({ block }: { block: ArticleGridBlock }) => {
  const posts = block.posts ?? [];
  if (!posts.length) return null;
  const recentPosts = posts.slice(0, 3);
  const gridPosts = posts.slice(3);
  return (
    <section className="container learn-shell" style={{ display: "grid", gap: 24 }}>
      {recentPosts.length ? (
        <div className="learn-recent">
          <div className="learn-recent-grid">
            {recentPosts.map((post) => {
              const published = formatDate(post.published_at);
              return (
                <Link key={post.id} href={`/learn/${post.slug}`} className="learn-recent-link">
                  <article className="learn-recent-card">
                    <div className="learn-media-link">
                      {post.feature_image ? (
                        <img src={post.feature_image} alt={post.feature_image_alt ?? post.title} />
                      ) : (
                        <div className="learn-media-placeholder">Studio Tak</div>
                      )}
                    </div>
                    <div className="learn-card-body">
                      {published ? <span className="learn-date">{published}</span> : null}
                      <h4 className="learn-card-title">{post.title}</h4>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      {gridPosts.length ? (
        <div className="grid learn-posts-grid">
          {gridPosts.map((post) => {
            const published = formatDate(post.published_at);
            return (
              <article key={post.id} className="card learn-post-card">
                <Link href={`/learn/${post.slug}`} className="learn-media-link">
                  {post.feature_image ? (
                    <img src={post.feature_image} alt={post.feature_image_alt ?? post.title} />
                  ) : (
                    <div className="learn-media-placeholder">Studio Tak</div>
                  )}
                </Link>
                <div className="learn-card-body">
                  <h4 className="learn-card-title">
                    <Link href={`/learn/${post.slug}`} className="learn-card-link">
                      {post.title}
                    </Link>
                  </h4>
                  {post.excerpt ? <p className="learn-card-excerpt">{post.excerpt}</p> : null}
                  <div className="learn-card-meta">
                    {published ? <span className="learn-date">{published}</span> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

const GlowBackgroundLayer = ({ active }: { active: boolean }) => (
  <div className={`block-background-glow${active ? " is-active" : ""}`} aria-hidden="true">
    <div className="block-background-field">
      <span />
      <span />
      <span />
    </div>
    <div className="block-background-texture" />
  </div>
);

function BlocksRendererInner({ blocks }: BlocksRendererProps) {
  const searchParams = useSearchParams();
  const audienceFilter = searchParams.get("audience") ?? undefined;
  const headerHeight = useHeaderHeight();
  const viewportWidth = useViewportWidth();
  const initialVisibleCount = 2;
  // Defer rendering everything after the first two blocks until the user scrolls toward it to reduce initial work.
  // In non-production environments, disable lazy loading so preview/testing tools can see all blocks.
  const isDevMode = process.env.NODE_ENV !== "production";
  const shouldLazyLoadRest = !isDevMode && blocks.length > initialVisibleCount;
  const lazyLoadRef = useRef<HTMLDivElement | null>(null);
  const lazyInView = useInView(lazyLoadRef, { once: true, margin: "35% 0px" });
  const [renderRest, setRenderRest] = useState(!shouldLazyLoadRest);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const glowRange = useMemo(() => {
    const first = blocks.findIndex((block) => block.backgroundStyle === "glow");
    if (first < 0) return null;
    let last = first;
    blocks.forEach((block, idx) => {
      if (block.backgroundStyle === "glow") last = idx;
    });
    return {
      first,
      last,
      firstKey: String(blocks[first]?.id ?? first),
      lastKey: String(blocks[last]?.id ?? last)
    };
  }, [blocks]);
  const [glowActive, setGlowActive] = useState(false);
  const shouldForceDarkOnLoad = useMemo(() => {
    const first = blocks[0];
    if (!first) return false;
    if (first.type === "animated_headline") return false;
    return !!first.enableDarkModeOnScroll;
  }, [blocks]);
  useEffect(() => {
    if (!shouldLazyLoadRest) {
      setRenderRest(true);
      return;
    }
    if (lazyInView) {
      setRenderRest(true);
    }
  }, [lazyInView, shouldLazyLoadRest]);
  useEffect(() => {
    if (!glowRange) {
      setGlowActive(false);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const firstEl = blockRefs.current[glowRange.firstKey];
      const lastEl = blockRefs.current[glowRange.lastKey];
      if (!firstEl) {
        setGlowActive(false);
        return;
      }
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const firstRect = firstEl.getBoundingClientRect();
      const lastRect = lastEl?.getBoundingClientRect();
      const hasStarted = firstRect.top <= viewportHeight;
      const hasNotEnded = lastRect ? lastRect.bottom >= 0 : true;
      setGlowActive(hasStarted && hasNotEnded);
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [glowRange, renderRest]);
  const initialThemeScript = useMemo(() => {
    const forceDark = shouldForceDarkOnLoad;
    return `(function(){try{var root=document.documentElement;if(!root)return;var base=root.getAttribute("data-base-theme");if(base!=="light"&&base!=="dark"){var prefersDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)");var isDark=prefersDark&&prefersDark.matches;root.setAttribute("data-base-theme", isDark ? "dark" : "light");}if(${forceDark ? "true" : "false"} && root.getAttribute("data-theme")!=="dark"){root.setAttribute("data-theme","dark");}}catch(e){}})();`;
  }, [shouldForceDarkOnLoad]);
  return (
    <>
      {shouldForceDarkOnLoad ? (
        <script id="initial-theme-shift" dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      ) : null}
      <GlowBackgroundLayer active={glowActive} />
      <div className="grid block-content-layer" style={{ gap: "var(--block-gap, 24px)" }}>
        {blocks.map((block, index) => {
          const key = block.id ?? index;
          const refKey = String(key);
          const shouldDelayRender = shouldLazyLoadRest && index >= initialVisibleCount && !renderRest;
          if (shouldDelayRender) {
            if (index === initialVisibleCount) {
              return <div key="lazy-sentinel" ref={lazyLoadRef} style={{ width: "100%", height: 1 }} />;
            }
            return null;
          }
          let element: JSX.Element;
          if (block.type === "hero" || block.type === "thirds") {
            element = renderHeroBlock(block, index, headerHeight, viewportWidth, audienceFilter);
          } else if (block.type === "animated_headline") {
            element = renderAnimatedHeadlineBlock(block, index, headerHeight);
          } else if (block.type === "logos") {
            element = <LogosBlockSection key={key} block={block} index={index} audienceFilter={audienceFilter} />;
          } else if (block.type === "scroll_gallery") {
            element = (
              <ScrollGalleryBlockSection
                key={key}
                block={block}
                index={index}
                headerHeight={headerHeight}
              />
            );
          } else if (block.type === "showcase") {
            element = <ShowcaseBlockSection key={key} block={block} index={index} headerHeight={headerHeight} audienceFilter={audienceFilter} />;
          } else if (block.type === "split") {
            element = renderSplitBlock(block, index);
          } else if (block.type === "features") {
            element = <FeaturesBlockSection key={key} block={block} index={index} />;
          } else if (block.type === "feature_spotlight") {
            element = <FeatureSpotlightBlockSection key={key} block={block} index={index} />;
          } else if (block.type === "article_featured") {
            element = <ArticleFeaturedBlockSection key={key} block={block} />;
          } else if (block.type === "article_grid") {
            element = <ArticleGridBlockSection key={key} block={block} />;
          } else if (block.type === "contact") {
            element = <ContactBlockSection key={key} block={block} index={index} />;
          } else if (block.type === "product_demo") {
            element = <ProductDemoBlockSection key={key} block={block} index={index} audienceFilter={audienceFilter} />;
          } else if (block.type === "divider") {
            element = renderDividerBlock(block, index);
          } else if (block.type === "stats") {
            element = <StatsBlockSection key={key} block={block} index={index} />;
          } else if (block.type === "comparison") {
            element = <ComparisonBlockSection key={key} block={block} index={index} />;
          } else {
            element = renderStoryBlock(block, index);
          }
          const anchorId = (block.anchor ?? block.id ?? "").trim();
          const anchoredElement =
            anchorId.length > 0 ? (
              <div key={key} id={anchorId} style={{ scrollMarginTop: headerHeight + 12, width: "100%" }}>
                {element}
              </div>
            ) : (
              element
            );
          const shouldWrap = block.type !== "animated_headline" && block.enableDarkModeOnScroll;
          if (shouldWrap) {
            return (
              <div
                key={key}
                ref={(node) => {
                  blockRefs.current[refKey] = node;
                }}
                data-background-style={block.backgroundStyle ?? "blank"}
                style={{ width: "100%" }}
              >
                <ThemeShiftRegion enabled>
                  {anchoredElement}
                </ThemeShiftRegion>
              </div>
            );
          }
          return (
            <div
              key={key}
              ref={(node) => {
                blockRefs.current[refKey] = node;
              }}
              data-background-style={block.backgroundStyle ?? "blank"}
              style={{ width: "100%" }}
            >
              {anchoredElement}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function BlocksRenderer(props: BlocksRendererProps) {
  return (
    <Suspense>
      <BlocksRendererInner {...props} />
    </Suspense>
  );
}
