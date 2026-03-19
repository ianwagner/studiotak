"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { motion, useInView } from "framer-motion";
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
  ScrollGalleryBlock,
  ShowcaseBlock,
  LogosBlock,
  SplitBlock
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

const renderBlockSections = (sections?: BlockSection[]) => {
  if (!sections?.length) return null;
  const preset = animationPresets[defaultAnimationPreset];
  return (
    <div className="story-timeline">
      {sections.map((section, idx) => (
        <motion.div
          key={`${section.title}-${idx}`}
          className="story-step"
          variants={preset.item}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={idx}
        >
          <div className="story-step-marker">
            <span className="story-step-badge">{`0${idx + 1}`}</span>
            <div className="story-step-line" />
          </div>
          <div className="story-step-content">
            <strong style={{ fontSize: 18 }}>{section.title}</strong>
            <p style={{ margin: 0, color: "var(--muted)" }}>{section.body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
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
              <strong style={{ fontSize: 20 }}>{item.title}</strong>
            </div>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 15 }}>{item.body}</p>
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
            <strong style={{ fontSize: 18 }}>{item.title}</strong>
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
  hideColumns
}: {
  block: HeroBlock;
  innerStyle: CSSProperties;
  layoutGap: number;
  content: ReactNode;
  isCompact: boolean;
  gridTemplate: string;
  hideColumns: boolean;
}) => {
  const [items, setItems] = useState<HeroMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const industryTag = block.mediaIndustryTag?.trim();
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
        const constraints: QueryConstraint[] = [];
        if (industryTag) constraints.push(where("industry", "==", industryTag));
        if (typeTag) constraints.push(where("type", "==", typeTag));
        constraints.push(limit(maxItems));
        const q = query(mediaRef, ...constraints);
        const snapshot = await getDocs(q);
        if (canceled) return;
        const results: HeroMediaItem[] = snapshot.docs
          .map((doc) => {
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
          })
          .filter((item) => item.url);
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
  const resolvedItems = items.length ? items : fallbackItems;
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
          boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
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
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Loading tagged media…</span>
            ) : null}
            {statusText ? <span style={{ color: "var(--muted)", fontSize: 13 }}>{statusText}</span> : null}
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
  viewportWidth: number | null
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
  const headingSize = isCompact ? "clamp(36px, 8vw, 56px)" : "clamp(44px, 9vw, 76px)";
  const subtitleSize = isCompact ? 16 : 18;
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
      <h1 style={{ fontSize: headingSize, lineHeight: 1.05, margin: 0 }}>{block.title}</h1>
      {block.subtitle ? (
        <p style={{ maxWidth: 720, color: "var(--muted)", margin: 0, fontSize: subtitleSize }}>{block.subtitle}</p>
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
    maxWidth: "var(--max-width)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: sectionPx,
    paddingRight: sectionPx
  };

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
      <AnimatedSection key={block.id ?? index} index={index} variant="plain" style={storyOuterStyle}>
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
      {block.body ? <p style={{ margin: 0, color: "var(--muted)", fontSize: 16 }}>{block.body}</p> : null}
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
          marginRight: "auto"
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
            font-size: 14px;
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
            font-size: 14px;
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
            font-size: 13px;
            min-height: 1.25rem;
            display: block !important;
            opacity: 1 !important;
          }
          [data-brevo-form] .entry__error:empty {
            display: none !important;
          }
          [data-brevo-form] .entry__specification {
            color: var(--muted);
            font-size: 12px;
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
            font-size: 14px;
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
            font-size: 15px;
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
            font-size: 18px;
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
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
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

  return (
    <section
      key={block.id ?? index}
      style={{
        width: viewportWidthVar,
        maxWidth: viewportWidthVar,
        marginLeft: viewportShiftVar,
        marginRight: viewportShiftVar,
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
  const bleedContentStyle: CSSProperties = {
    width: `calc(${viewportWidthVar} - 30px)`,
    maxWidth: `calc(${viewportWidthVar} - 30px)`,
    marginLeft: `calc(${viewportShiftVar} + 15px)`,
    marginRight: `calc(${viewportShiftVar} + 15px)`,
    display: "grid",
    justifyContent: "center"
  };
  const constrainedInnerStyle: CSSProperties = {
    width: "100%",
    maxWidth: "var(--max-width)"
  };
  const fullBleedStyle: CSSProperties = {
    width: viewportWidthVar,
    maxWidth: viewportWidthVar,
    marginLeft: viewportShiftVar,
    marginRight: viewportShiftVar,
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

const LogosBlockSection = ({ block, index }: { block: LogosBlock; index: number }) => {
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
        const constraints = [where("type", "in", ["Logo", "logo"]), limit(maxLogos)] as QueryConstraint[];
        const q = query(mediaRef, ...constraints);
        const snapshot = await getDocs(q);
        if (canceled) return;
        const items: LogoItem[] = snapshot.docs
          .map((doc) => {
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
          })
          .filter((item) => item.url && item.mediaType !== "video");
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
  }, [maxLogos]);

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
  const fadeColor = isDarkTheme ? "rgba(6,6,10,0.92)" : "rgba(255,255,255,0.94)";
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
        [data-logos-fade] {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 96px;
          pointer-events: none;
          z-index: 2;
        }
        [data-logos-fade="left"] {
          left: 0;
          background: linear-gradient(90deg, var(--logos-fade-color, var(--surface)) 0%, var(--logos-fade-color, var(--surface)) 18%, transparent 100%);
        }
        [data-logos-fade="right"] {
          right: 0;
          background: linear-gradient(270deg, var(--logos-fade-color, var(--surface)) 0%, var(--logos-fade-color, var(--surface)) 18%, transparent 100%);
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
            ["--logos-fade-color" as string]: fadeColor,
            ["--logos-duration" as string]: "26s"
          }}
          ref={wallRef}
        >
          <div data-logos-fade="left" aria-hidden />
          <div data-logos-fade="right" aria-hidden />
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
          <p style={{ margin: 0, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Add media items with type <code>Logo</code> to replace the placeholders.
          </p>
        ) : null}
        {loading ? (
            <p style={{ margin: 0, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Loading logos…</p>
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
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const zSeedsRef = useRef<Record<string, number>>({});
  const viewportWidth = useViewportWidth();
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
  const overlapBase = clampNumber(Math.round(availableWidth / 18), 42, 140);
  const overlapBoost = clampNumber(Math.round((1150 - availableWidth) / 20), 0, 36);
  const overlap = clampNumber(Math.max(isNarrow ? 64 : 42, overlapBase + overlapBoost), 42, 160);
  const minCardWidth = 220;
  const maxCardWidth = 520;
  const computedFitWidth = (availableWidth + overlap * (cardCount - 1)) / cardCount;
  const fittedCardWidth = clampNumber(computedFitWidth, minCardWidth, maxCardWidth);
  const forceScroll = (viewportWidth ?? Number.POSITIVE_INFINITY) < 1250;
  const shouldScroll = forceScroll || (fittedCardWidth === minCardWidth && cardCount > 1) || isNarrow;
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
      const key = `${item.id ?? `card-${idx}`}-${item.url}`;
      if (!(key in zSeedsRef.current)) {
        zSeedsRef.current[key] = Math.random();
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
                const fallbackRatio = showcaseDefaultRatio;
                const cardKey = `${item.id ?? `card-${cardIdx}`}-${item.url}`;
                const seed = zSeedsRef.current[cardKey] ?? 0;
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

const ArticleFeaturedBlockSection = ({ block }: { block: ArticleFeaturedBlock }) => {
  const post = block.posts?.[0];
  if (!post) return null;
  const published = formatDate(post.published_at);
  return (
    <section className="container learn-shell" style={{ display: "grid", gap: 24, padding: "24px 0 48px" }}>
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

export function BlocksRenderer({ blocks }: BlocksRendererProps) {
  const headerHeight = useHeaderHeight();
  const viewportWidth = useViewportWidth();
  const initialVisibleCount = 2;
  // Defer rendering everything after the first two blocks until the user scrolls toward it to reduce initial work.
  const shouldLazyLoadRest = blocks.length > initialVisibleCount;
  const lazyLoadRef = useRef<HTMLDivElement | null>(null);
  const lazyInView = useInView(lazyLoadRef, { once: true, margin: "35% 0px" });
  const [renderRest, setRenderRest] = useState(!shouldLazyLoadRest);
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
  const initialThemeScript = useMemo(() => {
    const forceDark = shouldForceDarkOnLoad;
    return `(function(){try{var root=document.documentElement;if(!root)return;var base=root.getAttribute("data-base-theme");if(base!=="light"&&base!=="dark"){var prefersDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)");var isDark=prefersDark&&prefersDark.matches;root.setAttribute("data-base-theme", isDark ? "dark" : "light");}if(${forceDark ? "true" : "false"} && root.getAttribute("data-theme")!=="dark"){root.setAttribute("data-theme","dark");}}catch(e){}})();`;
  }, [shouldForceDarkOnLoad]);
  return (
    <>
      {shouldForceDarkOnLoad ? (
        <script id="initial-theme-shift" dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      ) : null}
      <div className="grid" style={{ gap: "var(--block-gap, 24px)" }}>
        {blocks.map((block, index) => {
          const key = block.id ?? index;
          const shouldDelayRender = shouldLazyLoadRest && index >= initialVisibleCount && !renderRest;
          if (shouldDelayRender) {
            if (index === initialVisibleCount) {
              return <div key="lazy-sentinel" ref={lazyLoadRef} style={{ width: "100%", height: 1 }} />;
            }
            return null;
          }
          let element: JSX.Element;
          if (block.type === "hero" || block.type === "thirds") {
            element = renderHeroBlock(block, index, headerHeight, viewportWidth);
          } else if (block.type === "animated_headline") {
            element = renderAnimatedHeadlineBlock(block, index, headerHeight);
          } else if (block.type === "logos") {
            element = <LogosBlockSection key={key} block={block} index={index} />;
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
            element = <ShowcaseBlockSection key={key} block={block} index={index} headerHeight={headerHeight} />;
          } else if (block.type === "split") {
            element = renderSplitBlock(block, index);
          } else if (block.type === "features") {
            element = <FeaturesBlockSection key={key} block={block} index={index} />;
          } else if (block.type === "article_featured") {
            element = <ArticleFeaturedBlockSection key={key} block={block} />;
          } else if (block.type === "article_grid") {
            element = <ArticleGridBlockSection key={key} block={block} />;
          } else if (block.type === "contact") {
            element = <ContactBlockSection key={key} block={block} index={index} />;
          } else if (block.type === "divider") {
            element = renderDividerBlock(block, index);
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
              <ThemeShiftRegion key={key} enabled>
                {anchoredElement}
              </ThemeShiftRegion>
            );
          }
          return anchoredElement;
        })}
      </div>
    </>
  );
}
