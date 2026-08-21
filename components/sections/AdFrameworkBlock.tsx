"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { collection, getDocs, getFirestore, limit, query, where } from "firebase/firestore";
import { Info } from "lucide-react";
import type { CSSProperties, FocusEvent as ReactFocusEvent, MouseEvent as ReactMouseEvent } from "react";
import { getFirebaseApp } from "@/lib/firebaseClient";
import type { AdFrameworkBlock, AdFrameworkItem } from "@/lib/admin/pages";
import { ProductDemoFrame } from "@/components/demos/ProductDemoFrame";

const frameworkAccents = [
  { color: "var(--ai-color)", soft: "var(--ai-color-15)" },
  { color: "var(--reject-color)", soft: "var(--reject-color-10)" },
  { color: "var(--accent-color)", soft: "var(--accent-color-10)" },
  { color: "var(--approve-color)", soft: "var(--approve-color-10)" }
];

const mediaFallbacks = ["Warm editorial", "Product close-up", "Creator POV", "Detail study", "In-use moment", "Brand world"];

type InspirationMedia = {
  id: string;
  url: string;
};

type FrameworkPreview = {
  item: AdFrameworkItem;
  index: number;
  placement: "above" | "below" | "inline";
  x: number;
  y: number;
  anchorTop: number;
  anchorBottom: number;
};

const planValue = (item: AdFrameworkItem | undefined) => item?.examples?.[0] || item?.title || "Selected";
const planLabel = (item: AdFrameworkItem, index: number) => item.label || item.title || `Framework input ${index + 1}`;

const FrameworkPreviewCard = ({ item, index, framed = true }: { item: AdFrameworkItem; index: number; framed?: boolean }) => {
  const accent = frameworkAccents[index % frameworkAccents.length];
  const card = (
    <article
      data-ad-framework-card
      data-ad-framework-inspector-card
      style={{ "--framework-accent": accent.color, "--framework-accent-soft": accent.soft } as CSSProperties}
    >
      <div data-ad-framework-card-top><span data-ad-framework-label>{item.label}</span></div>
      <h3>{item.title}</h3>
      {item.description ? <p>{item.description}</p> : null}
      {item.examples?.length ? (
        <div data-ad-framework-examples>
          {item.examples.map((example, exampleIndex) => (
            <span key={`${example}-${exampleIndex}`} data-ad-framework-example>{example}</span>
          ))}
        </div>
      ) : null}
    </article>
  );

  return framed ? <ProductDemoFrame className="ad-framework-inspector-frame">{card}</ProductDemoFrame> : card;
};

export const AdFrameworkBlockSection = ({ block, index }: { block: AdFrameworkBlock; index: number }) => {
  const [inspirationMedia, setInspirationMedia] = useState<InspirationMedia[]>([]);
  const [inspirationPopoverOpen, setInspirationPopoverOpen] = useState(false);
  const inspirationRef = useRef<HTMLDivElement>(null);
  const [frameworkPreview, setFrameworkPreview] = useState<FrameworkPreview | null>(null);
  const frameworkPreviewRef = useRef<HTMLDivElement>(null);
  const [planActionPopoverOpen, setPlanActionPopoverOpen] = useState(false);
  const planActionRef = useRef<HTMLDivElement>(null);
  const [showPlanActionHint, setShowPlanActionHint] = useState(true);
  const [showInspirationHint, setShowInspirationHint] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const principles = block.principles?.filter(Boolean) ?? [];
  const items = block.items ?? [];
  const planItems = items.filter((item) => item.label || item.title || item.description || item.examples?.length);

  const showFrameworkPreview = (
    event: ReactMouseEvent<HTMLTableCellElement> | ReactFocusEvent<HTMLTableCellElement>,
    item: AdFrameworkItem,
    itemIndex: number
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const isCompactViewport = window.matchMedia("(max-width: 700px)").matches;
    if (isCompactViewport) {
      setFrameworkPreview({ item, index: itemIndex, placement: "inline", x: 0, y: 0, anchorTop: 0, anchorBottom: 0 });
      return;
    }

    const previewWidth = 326;
    const previewHeight = 220;
    const viewportPadding = 16;
    const gap = 12;
    const roomAbove = rect.top - viewportPadding;
    const roomBelow = window.innerHeight - rect.bottom - viewportPadding;
    const placement = roomBelow >= previewHeight || roomBelow >= roomAbove ? "below" : "above";
    const x = Math.min(
      Math.max(rect.left + rect.width / 2 - previewWidth / 2, viewportPadding),
      window.innerWidth - previewWidth - viewportPadding
    );
    const maxY = Math.max(viewportPadding, window.innerHeight - previewHeight - viewportPadding);
    const preferredY = placement === "below" ? rect.bottom + gap : rect.top - previewHeight - gap;
    const y = Math.min(Math.max(preferredY, viewportPadding), maxY);

    setFrameworkPreview({ item, index: itemIndex, placement, x, y, anchorTop: rect.top, anchorBottom: rect.bottom });
  };

  const hideFrameworkPreview = () => {
    setFrameworkPreview((preview) => preview?.placement === "inline" ? preview : null);
  };

  useEffect(() => {
    if (!inspirationPopoverOpen) return;

    const closePopover = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !inspirationRef.current?.contains(target)) {
        setInspirationPopoverOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInspirationPopoverOpen(false);
    };

    document.addEventListener("pointerdown", closePopover);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closePopover);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [inspirationPopoverOpen]);

  useEffect(() => {
    if (!planActionPopoverOpen) return;

    const closePopover = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !planActionRef.current?.contains(target)) {
        setPlanActionPopoverOpen(false);
      }
    };

    document.addEventListener("pointerdown", closePopover);
    return () => document.removeEventListener("pointerdown", closePopover);
  }, [planActionPopoverOpen]);

  useLayoutEffect(() => {
    if (!frameworkPreview || frameworkPreview.placement === "inline" || !frameworkPreviewRef.current) return;

    const previewRect = frameworkPreviewRef.current.getBoundingClientRect();
    const viewportPadding = 16;
    const maxY = Math.max(viewportPadding, window.innerHeight - previewRect.height - viewportPadding);
    const gap = 12;
    const preferredY = frameworkPreview.placement === "below"
      ? frameworkPreview.anchorBottom + gap
      : frameworkPreview.anchorTop - previewRect.height - gap;
    const y = Math.min(Math.max(preferredY, viewportPadding), maxY);

    if (Math.abs(y - frameworkPreview.y) < 1) return;
    setFrameworkPreview((preview) => preview ? { ...preview, y } : preview);
  }, [frameworkPreview]);

  useEffect(() => {
    let cancelled = false;

    const loadInspirationMedia = async () => {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

      try {
        const mediaSnapshot = await getDocs(
          query(
            collection(getFirestore(getFirebaseApp()), "media"),
            where("status", "==", "published"),
            where("type", "==", "Example"),
            where("featured", "==", true),
            limit(6)
          )
        );
        if (cancelled) return;

        setInspirationMedia(
          mediaSnapshot.docs
            .map((mediaDoc) => {
              const data = mediaDoc.data();
              return typeof data.url === "string" && data.url ? { id: mediaDoc.id, url: data.url } : null;
            })
            .filter((item): item is InspirationMedia => item !== null)
        );
      } catch (error) {
        console.error("Failed to load framework inspiration media", error);
      }
    };

    loadInspirationMedia();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.section
      key={block.id ?? index}
      data-ad-framework-section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      style={{
        width: "100%",
        maxWidth: "var(--max-width)",
        marginLeft: "auto",
        marginRight: "auto",
        padding: "clamp(56px, 8vh, 96px) var(--page-pad, 24px)"
      }}
    >
      <style>{`
        [data-ad-framework-section] {
          --framework-outline: var(--border);
        }
        .ad-review-hotspot-hint {
          position: absolute;
          top: 50%;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          border: 1px solid rgba(255, 112, 11, 0.42);
          border-radius: 999px;
          color: #d85d00;
          background: #fff7ed;
          box-shadow: 0 3px 10px rgba(255, 112, 11, 0.12);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 11px;
          font-weight: 650;
          line-height: 1;
          white-space: nowrap;
          pointer-events: none;
          transform: translateY(-50%);
        }
        .ad-review-hotspot-hint--left {
          right: calc(100% + 12px);
        }
        .ad-review-hotspot-hint-arrow {
          color: #ff700b;
          font-size: 15px;
          font-weight: 700;
          line-height: .75;
        }
        @keyframes ad-framework-hotspot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 112, 11, .42); }
          55% { box-shadow: 0 0 0 8px rgba(255, 112, 11, 0); }
        }
        [data-ad-framework-heading] {
          display: grid;
          gap: 8px;
          justify-items: center;
          text-align: center;
        }
        [data-ad-framework-eyebrow] {
          color: var(--accent);
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: var(--eyebrow-letter-spacing);
          line-height: 1.2;
          text-transform: uppercase;
        }
        [data-ad-framework-heading] h2 {
          max-width: 22ch;
          margin: 0;
          color: var(--text);
          font-family: var(--font-secondary, Georgia, serif);
          font-size: var(--font-size-title-3xl);
          font-weight: 300;
          letter-spacing: 0;
          line-height: 1.06;
          text-transform: none;
        }
        [data-ad-framework-heading] p {
          max-width: 58ch;
          margin: 0;
          color: var(--muted);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: var(--font-size-body);
          text-transform: none;
        }
        [data-ad-framework-principles] {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
        }
        [data-ad-framework-principle] {
          padding: 6px 9px;
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--muted);
          background: color-mix(in srgb, var(--surface) 76%, transparent);
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }
        [data-ad-framework-board] {
          padding: 12px;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-xl);
          background: color-mix(in srgb, var(--surface) 86%, var(--muted-surface));
          box-shadow: var(--shadow-sm);
        }
        [data-ad-framework-grid] {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        [data-ad-framework-card] {
          display: flex;
          min-height: 202px;
          flex-direction: column;
          padding: 16px;
          border: 1px solid color-mix(in srgb, var(--framework-accent) 36%, var(--framework-outline));
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--surface) 74%, var(--framework-accent-soft));
          box-shadow: var(--shadow-xs);
        }
        [data-ad-framework-card-top] {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        [data-ad-framework-label] {
          color: var(--framework-accent);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        [data-ad-framework-card] h3 {
          margin: 0;
          color: var(--text);
          font-family: var(--font-secondary, Georgia, serif);
          font-size: clamp(21px, 2vw, 27px);
          font-weight: 400;
          letter-spacing: -0.03em;
          line-height: 1.05;
          text-transform: none !important;
        }
        [data-ad-framework-card] p {
          margin: 8px 0 0;
          color: var(--muted);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 13px;
          line-height: 1.45;
        }
        [data-ad-framework-examples] {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: auto;
          padding-top: 14px;
        }
        [data-ad-framework-example] {
          padding: 4px 6px;
          border: 1px solid color-mix(in srgb, var(--framework-accent) 24%, transparent);
          border-radius: var(--radius-sm);
          color: var(--framework-accent);
          background: var(--framework-accent-soft);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 9px;
          font-weight: 600;
          line-height: 1.2;
        }
        [data-ad-framework-plan] {
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: color-mix(in srgb, var(--surface) 90%, var(--muted-surface));
        }
        [data-ad-framework-plan-top] {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 15px;
          border-bottom: 1px solid var(--border);
        }
        [data-ad-framework-plan-actions] {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        [data-ad-framework-plan-title] {
          color: var(--text);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 17px;
          font-weight: 700;
        }
        [data-ad-framework-plan-title] span {
          margin-right: 6px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        [data-ad-framework-plan-status] {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 16px;
          border: 0;
          border-radius: 999px;
          color: #fff;
          background: var(--accent-color);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 12px;
          font-weight: 500;
          line-height: 1.25;
          box-shadow: var(--shadow-sm);
          cursor: pointer;
        }
        [data-ad-framework-plan-action].is-hotspot {
          border-color: #ff700b;
          animation: ad-framework-hotspot-pulse 2.2s ease-out infinite;
        }
        [data-ad-framework-plan-status].is-hotspot {
          box-shadow: 0 0 0 0 rgba(255, 112, 11, .42);
        }
        [data-ad-framework-request-edits] {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          color: var(--text);
          background: var(--surface);
          box-shadow: var(--shadow-sm);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
        }
        [data-ad-framework-request-edits] svg {
          width: 14px;
          height: 14px;
          color: var(--muted);
        }
        [data-ad-framework-plan-popover] {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 5;
          min-width: 220px;
          max-width: 280px;
          padding: 14px 16px;
          border: 1px solid var(--border-strong);
          border-radius: 12px;
          background: var(--surface);
          box-shadow: 0 8px 28px rgba(0, 0, 0, .14);
          color: var(--text);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
        }
        [data-ad-framework-plan-popover] p,
        [data-ad-framework-inspiration-popover] p {
          margin: 0;
        }
        [data-ad-framework-plan-popover] a,
        [data-ad-framework-inspiration-popover] a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          color: #ff700b;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.25;
          text-decoration: none;
          transition: opacity 150ms ease;
        }
        [data-ad-framework-plan-popover] a:hover,
        [data-ad-framework-inspiration-popover] a:hover {
          opacity: .8;
        }
        [data-ad-framework-plan-popover] a svg,
        [data-ad-framework-inspiration-popover] a svg {
          width: 14px;
          height: 14px;
        }
        [data-ad-framework-inspiration] {
          position: relative;
          padding: 14px 15px 16px;
          border-bottom: 1px solid var(--border);
        }
        [data-ad-framework-inspiration-heading] {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          margin-bottom: 9px;
          color: var(--text);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 14px;
          font-weight: 700;
        }
        [data-ad-framework-inspiration-heading-group] {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        [data-ad-framework-inspiration-callout] {
          position: relative;
          min-width: 150px;
          min-height: 27px;
        }
        [data-ad-framework-inspiration-title] {
          padding: 0;
          border: 0;
          color: inherit;
          background: transparent;
          font: inherit;
          cursor: pointer;
        }
        [data-ad-framework-inspiration-title]:focus-visible,
        [data-ad-framework-inspiration-grid]:focus-visible {
          outline: 2px solid var(--accent-color);
          outline-offset: 3px;
        }
        @keyframes ad-framework-inspiration-pointer {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-3px); }
        }
        [data-ad-framework-inspiration-hotspot] {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          border: 1px solid rgba(255, 112, 11, 0.42);
          border-radius: 999px;
          color: #d85d00;
          background: #fff7ed;
          box-shadow: 0 3px 10px rgba(255, 112, 11, 0.12);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 11px;
          font-weight: 650;
          line-height: 1;
          cursor: pointer;
          animation: ad-framework-inspiration-pointer 2.2s ease-in-out infinite;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        [data-ad-framework-inspiration-hotspot]:hover {
          border-color: #ff700b;
          box-shadow: 0 4px 14px rgba(255, 112, 11, 0.18);
          animation-play-state: paused;
        }
        [data-ad-framework-inspiration-hotspot] span {
          color: #ff700b;
          font-size: 15px;
          font-weight: 700;
          line-height: .75;
        }
        [data-ad-framework-inspiration-popover] {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 6;
          min-width: 220px;
          max-width: 280px;
          padding: 14px 16px;
          border: 1px solid var(--border-strong);
          border-radius: 12px;
          background: var(--surface);
          box-shadow: 0 8px 28px rgba(0, 0, 0, .14);
          color: var(--text);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
        }
        [data-ad-framework-inspiration-grid] {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 6px;
          cursor: pointer;
        }
        [data-ad-framework-media-slot] {
          position: relative;
          min-width: 0;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: linear-gradient(145deg, var(--surface-muted), color-mix(in srgb, var(--accent-color-10) 55%, var(--surface-muted)));
        }
        [data-ad-framework-media-slot] img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        [data-ad-framework-media-fallback] {
          display: grid;
          width: 100%;
          height: 100%;
          place-items: center;
          padding: 5px;
          background: linear-gradient(155deg, rgba(255, 112, 11, .22), rgba(34, 32, 29, .08) 52%, rgba(92, 166, 130, .15));
          color: var(--text);
          font-family: var(--font-secondary, Georgia, serif);
          font-size: 10px;
          line-height: 1;
          text-align: center;
        }
        [data-ad-framework-media-label] {
          position: absolute;
          right: 3px;
          bottom: 3px;
          max-width: calc(100% - 6px);
          padding: 2px 3px;
          overflow: hidden;
          border-radius: 2px;
          background: rgba(10, 10, 10, .72);
          color: #fff;
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .03em;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }
        [data-ad-framework-table-wrap] {
          position: relative;
          overflow-x: auto;
          padding: 14px 0 0;
          scrollbar-width: thin;
        }
        [data-ad-framework-table-title] {
          display: block;
          padding: 0 15px 10px;
          color: var(--muted);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        [data-ad-framework-table] {
          width: 100%;
          min-width: max(820px, calc(240px + (var(--framework-input-count, 4) * 150px)));
          border-collapse: collapse;
          table-layout: fixed;
          color: var(--text);
          font-family: var(--font-primary, system-ui, sans-serif);
        }
        [data-ad-framework-table] th {
          padding: 11px 10px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          color: var(--muted);
          background: color-mix(in srgb, var(--surface-muted) 65%, transparent);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .025em;
          line-height: 1.1;
          text-align: left;
        }
        [data-ad-framework-table] th:not(:first-child), [data-ad-framework-table] td:not(:first-child) {
          border-left: 1px solid var(--border);
        }
        [data-ad-framework-table] td {
          padding: 14px 10px;
          border-bottom: 1px solid var(--border);
          color: var(--muted);
          font-size: 15px;
          font-weight: 600;
          line-height: 1.25;
          vertical-align: top;
        }
        [data-ad-framework-table] tbody tr:last-child td {
          border-bottom: 0;
        }
        [data-ad-framework-table] th:nth-child(1), [data-ad-framework-table] td:nth-child(1) { width: 34px; text-align: center; }
        [data-ad-framework-table] th:nth-child(2), [data-ad-framework-table] td:nth-child(2) { width: 112px; }
        [data-ad-framework-plan-cell] {
          color: var(--framework-accent) !important;
          background: color-mix(in srgb, var(--framework-accent-soft) 76%, var(--surface));
          box-shadow: inset 0 2px 0 var(--framework-accent);
          transition: background-color 160ms ease, box-shadow 160ms ease;
        }
        [data-ad-framework-plan-cell]:hover,
        [data-ad-framework-plan-cell].is-active {
          background: var(--surface);
          box-shadow: inset 0 3px 0 var(--framework-accent), inset 0 0 0 1px color-mix(in srgb, var(--framework-accent) 26%, transparent);
        }
        [data-ad-framework-plan-cell]:focus-visible {
          outline: 2px solid var(--framework-accent);
          outline-offset: -3px;
        }
        [data-ad-framework-cell-label] {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 3px;
          color: var(--framework-accent);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        [data-ad-framework-cell-info] {
          display: inline-flex;
          width: 14px;
          height: 14px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          color: var(--framework-accent);
          opacity: .84;
        }
        [data-ad-framework-cell-info] svg {
          width: 14px;
          height: 14px;
          stroke-width: 1.8;
        }
        [data-ad-framework-cell-placeholder] {
          display: block;
          width: 78%;
          height: 1em;
          border-radius: 3px;
          background: var(--framework-accent);
        }
        [data-ad-framework-cell-preview] {
          position: fixed;
          z-index: 100;
          width: 326px;
          max-width: calc(100vw - 32px);
          pointer-events: none;
        }
        .ad-framework-inspector-frame {
          padding: 7px;
          overflow: hidden;
          box-shadow: var(--product-demo-frame-shadow);
          will-change: backdrop-filter;
        }
        [data-ad-framework-inspector-card] {
          min-height: 0;
          border-color: color-mix(in srgb, var(--framework-accent) 44%, var(--border));
          background: var(--surface-card);
          box-shadow: var(--shadow-xs);
        }
        [data-ad-framework-mobile-inspector] {
          display: none;
        }
        [data-ad-framework-plan-row-faded] {
          opacity: .26;
        }
        [data-ad-framework-plan-row-faded] [data-ad-framework-cell-placeholder] {
          background: var(--framework-accent);
        }
        [data-ad-framework-plan-placeholder-cell] {
          background: color-mix(in srgb, var(--framework-accent-soft) 76%, var(--surface));
          box-shadow: inset 0 2px 0 var(--framework-accent);
        }
        [data-ad-framework-bridge] {
          display: grid;
          justify-items: center;
          padding: 2px 12px 0;
          text-align: center;
        }
        [data-ad-framework-bridge] p,
        [data-ad-framework-next-step] {
          max-width: 58ch;
          margin: 0 auto;
          color: var(--muted);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: var(--font-size-body);
          font-weight: 400;
          line-height: normal;
        }
        [data-ad-framework-next-step] {
          padding: 2px 12px 0;
          text-align: center;
        }
        @media (max-width: 960px) {
          [data-ad-framework-grid] {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 540px) {
          [data-ad-framework-grid] {
            grid-template-columns: 1fr;
          }
          [data-ad-framework-card] {
            min-height: 0;
          }
          [data-ad-framework-inspiration-grid] {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          [data-ad-framework-media-slot] {
            aspect-ratio: 1 / 1.1;
          }
          [data-ad-framework-plan-status] {
            padding: 6px 12px;
            font-size: 12px;
          }
          [data-ad-framework-request-edits] {
            padding: 8px 9px;
            font-size: 11px;
          }
          .ad-review-hotspot-hint--left {
            display: none;
          }
        }
        @media (max-width: 700px) {
          [data-ad-framework-plan-cell] {
            cursor: pointer;
          }
          [data-ad-framework-mobile-inspector] {
            display: block;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-ad-framework-inspiration-hotspot] {
            animation: none;
          }
        }
      `}</style>

      <div className="grid" style={{ gap: 22 }}>
        <div className="grid" style={{ gap: 12, justifyItems: "center" }}>
          <header data-ad-framework-heading>
            {block.eyebrow ? <span data-ad-framework-eyebrow>{block.eyebrow}</span> : null}
            <h2>{block.heading ?? "A framework for ads that learn"}</h2>
            {block.body ? <p>{block.body}</p> : null}
          </header>
          {principles.length ? (
            <div data-ad-framework-principles>
              {principles.map((principle) => <span key={principle} data-ad-framework-principle>{principle}</span>)}
            </div>
          ) : null}
        </div>

        <ProductDemoFrame className="ad-framework-plan-frame">
          <motion.div
            data-ad-framework-plan
            variants={{
              hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: "easeOut" } }
            }}
          >
          <div data-ad-framework-plan-top>
            <span data-ad-framework-plan-title>Brief Plan</span>
            <div ref={planActionRef} data-ad-framework-plan-actions>
              {showPlanActionHint && !planActionPopoverOpen ? (
                <span className="ad-review-hotspot-hint ad-review-hotspot-hint--left" aria-hidden="true">
                  Approve or request edits
                  <span className="ad-review-hotspot-hint-arrow">→</span>
                </span>
              ) : null}
              <button
                type="button"
                data-ad-framework-request-edits
                data-ad-framework-plan-action
                className={showPlanActionHint && !planActionPopoverOpen ? "is-hotspot" : undefined}
                onClick={() => {
                  setShowPlanActionHint(false);
                  setPlanActionPopoverOpen((open) => !open);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Request edits
              </button>
              <button
                type="button"
                data-ad-framework-plan-status
                data-ad-framework-plan-action
                className={showPlanActionHint && !planActionPopoverOpen ? "is-hotspot" : undefined}
                onClick={() => {
                  setShowPlanActionHint(false);
                  setPlanActionPopoverOpen((open) => !open);
                }}
              >
                Approve
              </button>
              <AnimatePresence>
                {planActionPopoverOpen ? (
                  <motion.div
                    data-ad-framework-plan-popover
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 5 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
                  >
                    <p>Request any changes to your plan, or approve it when it feels right. Once you’re happy, we’ll start bringing your ads to life.</p>
                    <a href="#contact">
                      Contact us for a full demo
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </a>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          <div ref={inspirationRef} data-ad-framework-inspiration>
            <div data-ad-framework-inspiration-heading>
              <div data-ad-framework-inspiration-heading-group>
                <button
                  type="button"
                  data-ad-framework-inspiration-title
                  aria-expanded={inspirationPopoverOpen}
                  onClick={() => setInspirationPopoverOpen((open) => !open)}
                >
                  Inspiration
                </button>
                <div data-ad-framework-inspiration-callout>
                  {showInspirationHint && !inspirationPopoverOpen ? (
                    <button
                      type="button"
                      data-ad-framework-inspiration-hotspot
                      onClick={() => {
                        setShowInspirationHint(false);
                        setInspirationPopoverOpen(true);
                      }}
                    >
                      <span aria-hidden="true">←</span>
                      Competitor research
                    </button>
                  ) : null}
                  <AnimatePresence>
                    {inspirationPopoverOpen ? (
                      <motion.div
                        data-ad-framework-inspiration-popover
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 5 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
                      >
                        <p>See how competitors are showing up in your category before production begins. Your plan includes a curated set of competitor ads to review and approve, giving our team clear references for the creative we produce for your brand.</p>
                        <a href="#contact">
                          Contact us for a full demo
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </a>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div
              data-ad-framework-inspiration-grid
              role="button"
              tabIndex={0}
              aria-label="Open competitor research details"
              aria-expanded={inspirationPopoverOpen}
              onClick={() => setInspirationPopoverOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setInspirationPopoverOpen((open) => !open);
              }}
            >
              {Array.from({ length: 6 }, (_, mediaIndex) => {
                const media = inspirationMedia[mediaIndex];
                return (
                  <div key={media?.id ?? mediaFallbacks[mediaIndex]} data-ad-framework-media-slot>
                    {media ? <img src={media.url} alt="" /> : <span data-ad-framework-media-fallback>{mediaFallbacks[mediaIndex]}</span>}
                    <span data-ad-framework-media-label>Inspiration</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div data-ad-framework-table-wrap>
            <span data-ad-framework-table-title>Creative plan</span>
            <table
              data-ad-framework-table
              style={{ "--framework-input-count": planItems.length } as CSSProperties}
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  {planItems.map((item, itemIndex) => <th key={`${planLabel(item, itemIndex)}-${itemIndex}`}>{planLabel(item, itemIndex)}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>01</td>
                  <td>Product</td>
                  {planItems.map((item, itemIndex) => {
                    const accent = frameworkAccents[itemIndex % frameworkAccents.length];
                    const label = planLabel(item, itemIndex);
                    return (
                      <td
                        key={`${label}-${itemIndex}`}
                        data-ad-framework-plan-cell
                        className={frameworkPreview?.index === itemIndex ? "is-active" : undefined}
                        style={{ "--framework-accent": accent.color, "--framework-accent-soft": accent.soft } as CSSProperties}
                        tabIndex={0}
                        aria-label={`${label}: ${planValue(item)}. Hover or focus for framework details.`}
                        onMouseEnter={(event) => showFrameworkPreview(event, item, itemIndex)}
                        onFocus={(event) => showFrameworkPreview(event, item, itemIndex)}
                        onClick={(event) => showFrameworkPreview(event, item, itemIndex)}
                        onMouseLeave={hideFrameworkPreview}
                        onBlur={hideFrameworkPreview}
                      >
                        <span data-ad-framework-cell-label>
                          {label}
                          <span data-ad-framework-cell-info aria-hidden="true"><Info /></span>
                        </span>
                        {planValue(item)}
                      </td>
                    );
                  })}
                </tr>
                <tr data-ad-framework-plan-row-faded aria-hidden="true">
                  <td>02</td>
                  <td>Product</td>
                  {planItems.map((item, itemIndex) => {
                    const accent = frameworkAccents[itemIndex % frameworkAccents.length];
                    const label = planLabel(item, itemIndex);
                    return (
                      <td
                        key={`${label}-${itemIndex}`}
                        data-ad-framework-plan-placeholder-cell
                        style={{ "--framework-accent": accent.color, "--framework-accent-soft": accent.soft } as CSSProperties}
                      >
                        <span data-ad-framework-cell-placeholder />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
            {typeof document !== "undefined"
              ? createPortal(
                  <AnimatePresence>
                    {frameworkPreview && frameworkPreview.placement !== "inline" ? (
                      <motion.div
                        ref={frameworkPreviewRef}
                        data-ad-framework-cell-preview
                        data-placement={frameworkPreview.placement}
                        aria-label={`${frameworkPreview.item.title} framework details`}
                        initial={{ left: frameworkPreview.x, top: frameworkPreview.y }}
                        animate={{ left: frameworkPreview.x, top: frameworkPreview.y }}
                        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 28, mass: 0.72 }}
                      >
                        <motion.div
                          key={`${frameworkPreview.item.title}-${frameworkPreview.index}`}
                          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98, y: frameworkPreview.placement === "above" ? 8 : -8 }}
                          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
                        >
                          <FrameworkPreviewCard item={frameworkPreview.item} index={frameworkPreview.index} />
                        </motion.div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>,
                  document.body
                )
              : null}
          </div>
          </motion.div>
        </ProductDemoFrame>

        <AnimatePresence initial={false}>
          {frameworkPreview?.placement === "inline" ? (
            <motion.div
              data-ad-framework-mobile-inspector
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
            >
              <FrameworkPreviewCard item={frameworkPreview.item} index={frameworkPreview.index} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <p data-ad-framework-next-step>
          Once the plan is approved, we make the ads—then present every finished piece in a single review link.
        </p>
      </div>
    </motion.section>
  );
};
