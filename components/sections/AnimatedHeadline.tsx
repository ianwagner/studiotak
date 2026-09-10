"use client";

import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { AnimatedHeadlineBlock } from "@/lib/admin/pages";
import { useDarkModeShift } from "./useDarkModeShift";

const viewportWidthVar = "var(--full-bleed-width, 100vw)";
const viewportShiftVar = "var(--full-bleed-shift, calc(50% - 50vw))";

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

type TextAnimationVariant = AnimatedHeadlineBlock["animationStyle"];
type AnimationMode = AnimatedHeadlineBlock["animationMode"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const getStaggerProgress = (index: number, total: number, progress: number) => {
  if (total <= 1) return clamp01(progress);
  const step = 1 / total;
  const start = step * index;
  const end = start + step;
  return clamp01((progress - start) / (end - start));
};

const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@";

const getScrambledChar = (index: number, tick: number) => {
  const seeded = Math.abs(Math.sin(index * 13.37 + tick * 0.7));
  const nextIndex = Math.floor(seeded * scrambleChars.length) % scrambleChars.length;
  return scrambleChars[nextIndex];
};

function AnimatedText({
  text,
  variant,
  progress,
  align = "center"
}: {
  text: string;
  variant: TextAnimationVariant;
  progress: number;
  align?: "left" | "center" | "right";
}) {
  const lines = text.split(/\r?\n/);
  if (lines.length > 1) {
    const lineWeights = lines.map((line) => Math.max(line.length, 1));
    const totalWeight = lineWeights.reduce((sum, weight) => sum + weight, 0);
    const playhead = progress * totalWeight;
    let lineStart = 0;

    return (
      <span
        style={{
          display: "grid",
          gap: "0.04em",
          justifyItems: align === "center" ? "center" : align === "right" ? "end" : "start"
        }}
      >
        {lines.map((line, index) => {
          const start = lineStart;
          const end = start + lineWeights[index];
          const lineProgress = clamp01((playhead - start) / lineWeights[index]);
          lineStart = end;

          return (
            <span key={`${line}-${index}`} style={{ display: "block" }}>
              <AnimatedTextContent
                text={line}
                variant={variant}
                progress={lineProgress}
                align={align}
                showCaret={playhead >= start && playhead <= end}
              />
            </span>
          );
        })}
      </span>
    );
  }

  return <AnimatedTextContent text={text} variant={variant} progress={progress} align={align} />;
}

function AnimatedTextContent({
  text,
  variant,
  progress,
  align = "center",
  showCaret = true
}: {
  text: string;
  variant: TextAnimationVariant;
  progress: number;
  align?: "left" | "center" | "right";
  showCaret?: boolean;
}) {
  const letters = useMemo(() => text.split(""), [text]);
  const fadeCharacterTokens = useMemo(() => {
    let animationIndex = 0;
    const tokens = text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((token) => {
        if (/^\s+$/.test(token)) {
          return { kind: "space" as const, text: token };
        }

        return {
          kind: "word" as const,
          chars: Array.from(token).map((char) => ({
            char,
            animationIndex: animationIndex++
          }))
        };
      });

    return { tokens, characterCount: animationIndex };
  }, [text]);
  const justifyContent = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  if (variant === "typewriter") {
    const visibleCharacters = Math.floor(progress * (text.length + 2));
    const displayText = text.slice(0, visibleCharacters);
    const caretVisible = showCaret && visibleCharacters <= text.length;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent, gap: 6, minHeight: "1em" }}>
        <span>{displayText}</span>
        {caretVisible ? (
          <motion.span
            aria-hidden
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 10,
              height: "1em",
              background: "currentColor",
              borderRadius: 4,
              display: "inline-block"
            }}
          />
        ) : null}
      </span>
    );
  }

  if (variant === "scramble") {
    const revealedCount = Math.floor(progress * (text.length + 4));
    const tick = Math.floor(progress * 40);
    return (
      <span style={{ display: "inline-flex", flexWrap: "wrap", justifyContent, gap: 2 }}>
        {letters.map((char, index) => {
          const revealed = index <= revealedCount;
          const isSpace = char === " ";
          const displayChar = revealed || isSpace ? (isSpace ? "\u00A0" : char) : getScrambledChar(index, tick);
          const localProgress = getStaggerProgress(index, letters.length, progress);
          const opacity = revealed ? 1 : Math.max(0.3, localProgress);
          return (
            <span
              key={`${char}-${index}`}
              style={{
                display: "inline-block",
                minWidth: isSpace ? 6 : undefined,
                opacity,
                filter: revealed ? "none" : "blur(0.4px)",
                transition: "opacity 0.12s linear"
              }}
            >
              {displayChar}
            </span>
          );
        })}
      </span>
    );
  }

  if (variant === "slide_by_letter") {
    return (
      <span style={{ display: "inline-flex", flexWrap: "wrap", justifyContent }}>
        {letters.map((letter, index) => {
          const localProgress = getStaggerProgress(index, letters.length, progress);
          const y = (1 - localProgress) * -24;
          const opacity = localProgress;
          return (
            <span
              key={`${letter}-${index}`}
              style={{
                display: "inline-block",
                transform: `translateY(${y}px)`,
                opacity,
                transition: "transform 0.18s ease, opacity 0.16s ease",
                willChange: "transform"
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", justifyContent }}>
      {fadeCharacterTokens.tokens.map((token, tokenIndex) => {
        if (token.kind === "space") {
          return (
            <span key={`space-${tokenIndex}`} aria-hidden style={{ display: "inline-block", width: "0.28em" }}>
              {token.text.length > 1 ? "\u00A0" : null}
            </span>
          );
        }

        return (
          <span key={`word-${tokenIndex}`} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
            {token.chars.map(({ char, animationIndex }) => {
              const localProgress = getStaggerProgress(animationIndex, fadeCharacterTokens.characterCount, progress);
              const y = (1 - localProgress) * -16;
              const opacity = localProgress;
              return (
                <span
                  key={`${char}-${animationIndex}`}
                  style={{
                    display: "inline-block",
                    transform: `translateY(${y}px)`,
                    opacity,
                    transition: "transform 0.16s ease, opacity 0.16s ease"
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}

export function AnimatedHeadline({
  block,
  headerOffset = 0,
  headingLevel = 2
}: {
  block: AnimatedHeadlineBlock;
  headerOffset?: number;
  headingLevel?: 1 | 2;
}) {
  const { headline, subtext, animationMode, animationStyle, freezeOnScroll, enableDarkModeOnScroll } = block;
  const shouldReduceMotion = useReducedMotion();
  const enableThemeShift = !!enableDarkModeOnScroll && !shouldReduceMotion;
  const viewportWidth = useViewportWidth();
  const containerRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const freezeEnabled = freezeOnScroll && !shouldReduceMotion;
  const scrollOffsets: NonNullable<Parameters<typeof useScroll>[0]>["offset"] =
    freezeEnabled ? ["start 90%", "end start"] : ["start 80%", "end 30%"];
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: scrollOffsets
  });
  const springProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const manualProgress = useMotionValue(0);
  const inView = useInView(containerRef, { margin: "-20% 0px", amount: 0.35, once: true });
  const [themeShouldActivate, setThemeShouldActivate] = useState(false);
  const themeShouldActivateRef = useRef(false);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    const nextProgress = shouldReduceMotion ? 1 : 0;
    manualProgress.set(nextProgress);
    setProgressValue(nextProgress);
  }, [headline, animationStyle, animationMode, manualProgress, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || animationMode !== "viewport") return;
    if (inView) {
      const controls = animate(manualProgress, 1, { duration: 0.9, ease: [0.33, 1, 0.68, 1] });
      return () => controls.stop();
    }
  }, [animationMode, inView, manualProgress, shouldReduceMotion]);

  const activeProgress = !shouldReduceMotion && animationMode === "scroll" ? springProgress : manualProgress;

  useMotionValueEvent(activeProgress, "change", (value) => {
    if (freezeEnabled && animationMode === "scroll") return;
    setProgressValue(clamp01(value));
  });

  const minHeight = `calc(100vh - ${headerOffset}px - 30px)`;
  const freezeTopOffset = headerOffset + 15;

  const containerStyle: CSSProperties = freezeEnabled
    ? {
        position: "relative",
        minHeight: `calc(140vh - ${headerOffset}px - 30px)`,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        marginTop: 15,
        marginBottom: 15
      }
    : { position: "relative", width: "100%", maxWidth: "100%", minWidth: 0, marginTop: 15, marginBottom: 15 };

  const isMobile = viewportWidth !== null && viewportWidth < 680;
  const gutter = isMobile ? 0 : 30;
  const mobileInset = "var(--full-bleed-mobile-inset, var(--section-px, 15px))";
  const leftInset = isMobile ? `max(${mobileInset}, env(safe-area-inset-left, 0px))` : `${gutter / 2}px`;
  const rightInset = isMobile ? `max(${mobileInset}, env(safe-area-inset-right, 0px))` : `${gutter / 2}px`;
  const bleedWidth = isMobile
    ? `calc(${viewportWidthVar} - ${leftInset} - ${rightInset})`
    : `calc(${viewportWidthVar} - ${gutter}px)`;
  const bleedShiftLeft = `calc(${viewportShiftVar} + ${leftInset})`;
  const bleedShiftRight = `calc(${viewportShiftVar} + ${rightInset})`;

  const wrapperStyle: CSSProperties = {
    width: bleedWidth,
    maxWidth: isMobile ? "100vw" : bleedWidth,
    marginLeft: bleedShiftLeft,
    marginRight: bleedShiftRight,
    minHeight,
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...(freezeEnabled ? { position: "sticky", top: freezeTopOffset, zIndex: 1 } : {}),
    overflow: "hidden",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    boxShadow: "none",
    background:
      "radial-gradient(circle at 20% 20%, var(--bg-glow-1), transparent 45%), radial-gradient(circle at 80% 30%, var(--bg-glow-2), transparent 55%), var(--surface)"
  };

  useEffect(() => {
    if (!freezeEnabled || animationMode !== "scroll") return;
    const handleScroll = () => {
      const container = containerRef.current;
      const sticky = wrapperRef.current;
      if (!container || !sticky) return;
      const containerRect = container.getBoundingClientRect();
      const stickyRect = sticky.getBoundingClientRect();
      const available = containerRect.height - stickyRect.height;
      const viewport = typeof window !== "undefined" ? window.innerHeight || 0 : 0;
      const startAhead =
        available > 0
          ? Math.max(480, viewport * 0.8, available + viewport * 0.35)
          : Math.max(560, viewport * 0.85);
      if (available <= 0) {
        setProgressValue(containerRect.top <= freezeTopOffset ? 1 : 0);
        return;
      }
      const raw = (freezeTopOffset + startAhead - containerRect.top) / (available + startAhead);
      setProgressValue(clamp01(raw));
    };
    const handleScrollWithRaf = () => requestAnimationFrame(handleScroll);
    handleScroll();
    window.addEventListener("scroll", handleScrollWithRaf, { passive: true });
    window.addEventListener("resize", handleScrollWithRaf);
    return () => {
      window.removeEventListener("scroll", handleScrollWithRaf);
      window.removeEventListener("resize", handleScrollWithRaf);
    };
  }, [freezeEnabled, animationMode, freezeTopOffset]);

  const contentStyle: CSSProperties = {
    display: "grid",
    gap: 16,
    fontFamily: "var(--font-secondary)",
    maxWidth: 960,
    textAlign: "center",
    alignItems: "center",
    justifyItems: "center"
  };

  const subtextOpacity = clamp01((progressValue - 0.2) / 0.4);
  const subtextY = (1 - subtextOpacity) * -12;
  const Heading = headingLevel === 1 ? "h1" : "h2";

  // Use scroll position (not IntersectionObserver) to control dark mode.
  // IntersectionObserver re-fires when theme changes cause layout shifts, creating a feedback loop.
  useEffect(() => {
    if (!enableThemeShift) {
      themeShouldActivateRef.current = false;
      setThemeShouldActivate(false);
      return;
    }
    let rafId: number | null = null;
    const check = () => {
      rafId = null;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const margin = vh * 0.15;
      const visible = rect.bottom > margin && rect.top < vh - margin;
      if (themeShouldActivateRef.current !== visible) {
        themeShouldActivateRef.current = visible;
        setThemeShouldActivate(visible);
      }
    };
    const scheduleCheck = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
    };
  }, [enableThemeShift]);
  useDarkModeShift(enableThemeShift, themeShouldActivate);

  return (
    <section ref={containerRef} style={containerStyle} aria-label={headline}>
      <motion.div ref={wrapperRef} style={wrapperStyle}>
        <div style={contentStyle}>
          <Heading
            style={{
              fontFamily: "var(--font-secondary)",
              fontSize: "var(--font-size-display-md)",
              fontWeight: 300,
              letterSpacing: 0,
              lineHeight: 1.04,
              margin: 0,
              maxWidth: "100%",
              overflowWrap: "break-word",
              textTransform: "none"
            }}
          >
            {shouldReduceMotion ? headline : <AnimatedText text={headline} variant={animationStyle} progress={progressValue} />}
          </Heading>
          {subtext ? (
            shouldReduceMotion ? (
              <p style={{ margin: 0, maxWidth: 740, color: "var(--muted)", fontFamily: "var(--font-sans, var(--font-primary))", fontSize: "var(--font-size-body-lg)", fontWeight: 400, lineHeight: 1.45 }}>
                {subtext}
              </p>
            ) : (
              <motion.p
                style={{
                  margin: 0,
                  maxWidth: 740,
                  color: "var(--muted)",
                  fontFamily: "var(--font-sans, var(--font-primary))",
                  fontSize: "var(--font-size-body-lg)",
                  fontWeight: 400,
                  lineHeight: 1.45,
                  transform: `translateY(${subtextY}px)`,
                  opacity: subtextOpacity,
                  transition: "transform 0.2s ease, opacity 0.2s ease"
                }}
              >
                {subtext}
              </motion.p>
            )
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
