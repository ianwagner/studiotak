"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ProductDemoBlock } from "@/lib/admin/pages";

type Status = "pending" | "approved" | "rejected" | "edit_requested";

const STATUS_CONFIG: Record<Status, { label: string; color: string; darkColor?: string; bg: string; darkBg?: string; dot: string }> = {
  pending: { label: "Pending", color: "#4b5563", darkColor: "#9ca3af", bg: "#f3f4f6", darkBg: "rgba(156,163,175,0.12)", dot: "#9ca3af" },
  approved: { label: "Approved", color: "#16a34a", darkColor: "#4ade80", bg: "#dcfce7", darkBg: "rgba(34,197,94,0.12)", dot: "#22c55e" },
  rejected: { label: "Rejected", color: "#dc2626", darkColor: "#f87171", bg: "#fee2e2", darkBg: "rgba(239,68,68,0.12)", dot: "#ef4444" },
  edit_requested: { label: "Edits Requested", color: "#d97706", darkColor: "#fbbf24", bg: "#fef3c7", darkBg: "rgba(245,158,11,0.12)", dot: "#f59e0b" },
};

const DEFAULT_DATA = {
  index: 1,
  version: "V2",
  status: "pending" as Status,
  portraitAd: {
    imageUrl: "",
    brandName: "QUAY",
    headline: "FRAMES WITH ATTITUDE",
  },
  squareAd: {
    imageUrl: "",
    brandName: "QUAY",
    headline: "FRAMES WITH ATTITUDE",
  },
  copy: {
    primary: "Designed to stand out. Eyewear for everywhere.",
    headline: "SIGNATURE FRAMES",
    description: "Made to be Seen",
  },
};

/** Ad creative — shows uploaded image or a neutral placeholder */
function AdCreative({
  aspect,
  imageUrl,
}: {
  aspect: "9x16" | "1x1";
  imageUrl?: string;
}) {
  const isPortrait = aspect === "9x16";
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: isPortrait ? "9 / 16" : "1 / 1",
        borderRadius: 12,
        overflow: "hidden",
        background: imageUrl ? "#f3f4f6" : "linear-gradient(145deg, #e8c4a0 0%, #c69060 40%, #a07050 100%)",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "contain"
          }}
        />
      ) : null}
    </div>
  );
}

/** Popover with a "contact us" CTA */
function DemoPopover({
  open,
  onClose,
  anchorRef,
  children,
  bg,
  border,
  shadow,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  bg?: string;
  border?: string;
  shadow?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const popover = popoverRef.current;
      if (!anchor || !popover) return;

      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const viewportPadding = 16;
      const gap = 8;
      const left = Math.min(
        Math.max(anchorRect.left, viewportPadding),
        window.innerWidth - popoverRect.width - viewportPadding
      );
      const spaceBelow = window.innerHeight - anchorRect.bottom - viewportPadding;
      const spaceAbove = anchorRect.top - viewportPadding;
      const openBelow = spaceBelow >= popoverRect.height || spaceBelow >= spaceAbove;
      const top = openBelow
        ? Math.min(anchorRect.bottom + gap, window.innerHeight - popoverRect.height - viewportPadding)
        : Math.max(viewportPadding, anchorRect.top - popoverRect.height - gap);

      setPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  // Portals have no server-rendered host. Keeping the first client render null
  // makes it identical to the server render; the portal mounts after hydration.
  if (!mounted) return null;

  return createPortal(
    <>
      {open ? (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 19 }}
          onClick={onClose}
        />
      ) : null}
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={popoverRef}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 5 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              background: bg ?? "#ffffff",
              border: `1px solid ${border ?? "rgba(10,15,26,0.10)"}`,
              borderRadius: 12,
              boxShadow: shadow ?? "0 8px 28px rgba(0,0,0,0.14)",
              padding: "14px 16px",
              zIndex: 20,
              minWidth: 220,
              maxWidth: 280,
            }}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>,
    document.body
  );
}

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const check = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      // Explicit data-theme wins; otherwise fall back to system preference
      setDark(attr ? attr === "dark" : mq.matches);
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    mq.addEventListener("change", check);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", check);
    };
  }, []);
  return dark;
}

export default function AdReviewDemo({ block }: { block: ProductDemoBlock }) {
  const data = { ...DEFAULT_DATA, ...block.exampleData };
  const [status, setStatus] = useState<Status>((data.status as Status) ?? "pending");
  const isDark = useIsDark();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState(1); // 0 = V1, 1 = V2 (current)
  const [versionPopoverOpen, setVersionPopoverOpen] = useState(false);
  const [copyPopoverOpen, setCopyPopoverOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [showVersionHint, setShowVersionHint] = useState(true);
  const [showCopyHint, setShowCopyHint] = useState(true);
  const [showApprovalHint, setShowApprovalHint] = useState(true);
  const versionAnchorRef = useRef<HTMLDivElement>(null);
  const copyAnchorRef = useRef<HTMLDivElement>(null);
  const statusAnchorRef = useRef<HTMLDivElement>(null);

  const cfgRaw = STATUS_CONFIG[status];
  const cfg = {
    ...cfgRaw,
    color: isDark && cfgRaw.darkColor ? cfgRaw.darkColor : cfgRaw.color,
    bg: isDark && cfgRaw.darkBg ? cfgRaw.darkBg : cfgRaw.bg,
  };

  // Dark-mode-aware palette
  const card = isDark ? "var(--surface)" : "#ffffff";
  const cardBorder = isDark ? "var(--border)" : "rgba(10, 15, 26, 0.08)";
  const fg = isDark ? "var(--text)" : "#0b0c10";
  const fgSecondary = isDark ? "var(--muted)" : "#4b5563";
  const fgTertiary = isDark ? "rgba(255,255,255,0.4)" : "#6b7280";
  const subtleBg = isDark ? "rgba(255,255,255,0.04)" : "#f9fafb";
  const subtleBorder = isDark ? "var(--border)" : "rgba(10,15,26,0.06)";
  const btnBg = isDark ? "var(--surface)" : "#ffffff";
  const btnBorder = isDark ? "var(--border-strong)" : "rgba(10,15,26,0.12)";
  const btnHoverBg = isDark ? "rgba(255,255,255,0.06)" : "#f9fafb";
  const badgeBg = isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6";
  const dividerColor = isDark ? "var(--border)" : "rgba(10,15,26,0.08)";
  const popoverBg = isDark ? "var(--surface)" : "#ffffff";
  const popoverBorder = isDark ? "var(--border-strong)" : "rgba(10,15,26,0.10)";
  const popoverShadow = isDark ? "0 8px 28px rgba(0,0,0,0.36)" : "0 8px 28px rgba(0,0,0,0.14)";
  const dropdownItemHover = isDark ? "rgba(255,255,255,0.06)" : "#f9fafb";
  const fgBody = isDark ? "var(--text)" : "#1f2937";
  const fgButton = isDark ? "var(--muted)" : "#374151";

  const handleStatusChange = useCallback((newStatus: Status) => {
    setStatus(newStatus);
    setDropdownOpen(false);
    setStatusPopoverOpen(true);
  }, []);

  const demoCta = (
    <div style={{ marginTop: 10 }}>
      <a
        href="#contact"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: "var(--accent-text)",
          textDecoration: "none",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Contact us for a full demo
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </a>
    </div>
  );

  /** Shared style for right-column content (1:1 ad + copy cards) — fills the column */
  const rightContentStyle: React.CSSProperties = {
    width: "100%",
  };

  return (
    <>
    <style>{`
      @media (max-width: 899px) {
        .ad-review-portrait { display: none !important; }
      }

      @keyframes ad-review-hotspot-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255, 112, 11, 0.42); }
        55% { box-shadow: 0 0 0 8px rgba(255, 112, 11, 0); }
      }

      @keyframes ad-review-hotspot-nudge {
        0%, 100% { transform: translateY(-50%); }
        50% { transform: translate(3px, -50%); }
      }

      .ad-review-hotspot {
        border-color: #ff700b !important;
        animation: ad-review-hotspot-pulse 2.2s ease-out infinite;
      }

      .ad-review-hotspot-hint {
        position: absolute;
        top: 50%;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 8px;
        border: 1px solid rgba(255, 112, 11, 0.42);
        border-radius: 999px;
        color: var(--accent-callout-text);
        background: #fff7ed;
        box-shadow: 0 3px 10px rgba(255, 112, 11, 0.12);
        font-size: 11px;
        font-weight: 650;
        line-height: 1;
        white-space: nowrap;
        pointer-events: none;
        transform: translateY(-50%);
        animation: ad-review-hotspot-nudge 2.2s ease-in-out infinite;
      }

      .ad-review-hotspot-hint--right {
        left: calc(100% + 12px);
      }

      .ad-review-hotspot-hint--left {
        right: calc(100% + 12px);
      }

      .ad-review-hotspot-hint-arrow {
        color: var(--accent-text);
        font-size: 15px;
        font-weight: 700;
        line-height: 0.75;
      }

      @media (prefers-reduced-motion: reduce) {
        .ad-review-hotspot,
        .ad-review-hotspot-hint {
          animation: none;
        }
      }
    `}</style>
    <div
      style={{
        background: card,
        border: `1px solid ${cardBorder}`,
        borderRadius: 12,
        padding: "20px 24px",
        width: "100%",
        fontFamily: "var(--font-body, system-ui, -apple-system, sans-serif)",
        position: "relative",
      }}
    >
      {/* Header: index + version badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: fg }}>{data.index}</span>
        <div ref={versionAnchorRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={showVersionHint && !versionPopoverOpen ? "ad-review-hotspot" : undefined}
            onClick={() => {
              setShowVersionHint(false);
              setVersionPopoverOpen((o) => !o);
            }}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: fgSecondary,
              background: badgeBg,
              borderRadius: 6,
              padding: "3px 8px",
              letterSpacing: "0.02em",
              border: "1px solid transparent",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = btnBorder;
              e.currentTarget.style.background = btnHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.background = badgeBg;
            }}
          >
            {data.version}
          </button>
          {showVersionHint && !versionPopoverOpen ? (
            <span className="ad-review-hotspot-hint ad-review-hotspot-hint--right" aria-hidden="true">
              <span className="ad-review-hotspot-hint-arrow">←</span>
              Compare versions
            </span>
          ) : null}

          {/* Version switcher popover */}
          <DemoPopover open={versionPopoverOpen} onClose={() => setVersionPopoverOpen(false)} anchorRef={versionAnchorRef} bg={popoverBg} border={popoverBorder} shadow={popoverShadow}>
            <div style={{ fontSize: 12, fontWeight: 600, color: fgTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Versions
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {["V1", "V2"].map((v, i) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setActiveVersion(i)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: activeVersion === i ? "#ff700b" : popoverBorder,
                    background: activeVersion === i ? (isDark ? "rgba(255,112,11,0.12)" : "#fff5ee") : card,
                    color: activeVersion === i ? "var(--accent-text)" : fgSecondary,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, color: fgTertiary, lineHeight: 1.4 }}>
              Toggle between creative versions to compare iterations side by side.
            </div>
            {demoCta}
          </DemoPopover>
        </div>
      </div>

      {/* Main content: portrait ad + right column (equal widths) */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* 9:16 portrait ad — hidden on mobile */}
        <div className="ad-review-portrait" style={{ flex: 1, minWidth: 0 }}>
          <AdCreative
            aspect="9x16"
            imageUrl={data.portraitAd?.imageUrl}
          />
        </div>

        {/* Right column: copy + square ad + copy card */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Primary copy */}
          <div
            style={{
              ...rightContentStyle,
              background: subtleBg,
              borderRadius: 10,
              padding: "10px 14px",
              border: `1px solid ${subtleBorder}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: fgTertiary,
                marginBottom: 6,
              }}
            >
              Primary Copy
            </div>
            <div style={{ fontSize: 14, color: fgBody, lineHeight: 1.5 }}>
              {data.copy?.primary}
            </div>
          </div>

          {/* 1:1 square ad */}
          <div style={rightContentStyle}>
            <AdCreative
              aspect="1x1"
              imageUrl={data.squareAd?.imageUrl}
            />
          </div>

          {/* Headline + Description card */}
          <div
            style={{
              ...rightContentStyle,
              background: subtleBg,
              borderRadius: 10,
              padding: "10px 14px",
              border: `1px solid ${subtleBorder}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: fgTertiary,
                marginBottom: 4,
              }}
            >
              Headline
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: fg, marginBottom: 10 }}>
              {data.copy?.headline}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: fgTertiary,
                marginBottom: 4,
              }}
            >
              Description
            </div>
            <div style={{ fontSize: 14, color: fgBody }}>{data.copy?.description}</div>
          </div>

          {/* Edit platform copy button */}
          <div style={{ ...rightContentStyle, display: "flex", justifyContent: "flex-end", position: "relative" }}>
            <div ref={copyAnchorRef} style={{ position: "relative" }}>
              {showCopyHint && !copyPopoverOpen ? (
                <span className="ad-review-hotspot-hint ad-review-hotspot-hint--left" aria-hidden="true">
                  Edit ad copy
                  <span className="ad-review-hotspot-hint-arrow">→</span>
                </span>
              ) : null}
              <button
                type="button"
                className={showCopyHint && !copyPopoverOpen ? "ad-review-hotspot" : undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: fgButton,
                  background: btnBg,
                  border: `1px solid ${btnBorder}`,
                  borderRadius: 8,
                  padding: "7px 14px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = btnHoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = btnBg)}
                onClick={() => {
                  setShowCopyHint(false);
                  setCopyPopoverOpen((o) => !o);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Edit platform copy
              </button>

              {/* Edit copy popover */}
              <DemoPopover open={copyPopoverOpen} onClose={() => setCopyPopoverOpen(false)} anchorRef={copyAnchorRef} bg={popoverBg} border={popoverBorder} shadow={popoverShadow}>
                <div style={{ fontSize: 13, color: fgButton, lineHeight: 1.5 }}>
                  Tailor headlines and descriptions for each Meta placement — Feed, Stories, Reels — right from the review link.
                </div>
                {demoCta}
              </DemoPopover>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${dividerColor}`, margin: "16px 0 12px" }} />

      {/* Status selector */}
      <div ref={statusAnchorRef} style={{ position: "relative", display: "inline-block" }}>
        {showApprovalHint && !dropdownOpen ? (
          <span className="ad-review-hotspot-hint ad-review-hotspot-hint--right" aria-hidden="true">
            <span className="ad-review-hotspot-hint-arrow">←</span>
            Set approval
          </span>
        ) : null}
        <button
          type="button"
          className={showApprovalHint && !dropdownOpen ? "ad-review-hotspot" : undefined}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          onClick={() => {
            setShowApprovalHint(false);
            setDropdownOpen((o) => !o);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            color: cfg.color,
            background: "transparent",
            border: `1px solid ${popoverBorder}`,
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
            transition: "border-color 0.15s",
            minWidth: 160,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: cfg.dot,
              flexShrink: 0,
            }}
          />
          {cfg.label}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: "auto" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Status dropdown */}
        {dropdownOpen && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 9 }}
              onClick={() => setDropdownOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 6px)",
                left: 0,
                background: popoverBg,
                border: `1px solid ${popoverBorder}`,
                borderRadius: 10,
                boxShadow: popoverShadow,
                padding: 4,
                zIndex: 10,
                minWidth: 180,
              }}
            >
              {(Object.entries(STATUS_CONFIG) as [Status, typeof cfgRaw][]).map(([key, val]) => {
                const itemColor = isDark && val.darkColor ? val.darkColor : val.color;
                const itemBg = isDark && val.darkBg ? val.darkBg : val.bg;
                return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleStatusChange(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: itemColor,
                    background: status === key ? itemBg : "transparent",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (status !== key) e.currentTarget.style.background = dropdownItemHover;
                  }}
                  onMouseLeave={(e) => {
                    if (status !== key) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: val.dot,
                      flexShrink: 0,
                    }}
                  />
                  {val.label}
                </button>
                );
              })}
            </div>
          </>
        )}

        {/* Status change popover */}
        <DemoPopover open={statusPopoverOpen} onClose={() => setStatusPopoverOpen(false)} anchorRef={statusAnchorRef} bg={popoverBg} border={popoverBorder} shadow={popoverShadow}>
          <div style={{ fontSize: 13, color: fgButton, lineHeight: 1.5 }}>
            Your feedback flows back to us in real time. Approve, request edits, or reject — we act on it immediately.
          </div>
          {demoCta}
        </DemoPopover>
      </div>
    </div>
    </>
  );
}
