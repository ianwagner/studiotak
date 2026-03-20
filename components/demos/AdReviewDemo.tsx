"use client";

import { useState, useCallback } from "react";
import type { ProductDemoBlock } from "@/lib/admin/pages";

type Status = "pending" | "approved" | "rejected" | "edit_requested";

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "Pending", color: "#4b5563", bg: "#f3f4f6", dot: "#9ca3af" },
  approved: { label: "Approved", color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
  edit_requested: { label: "Edits Requested", color: "#d97706", bg: "#fef3c7", dot: "#f59e0b" },
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
        background: imageUrl
          ? `url(${imageUrl}) center / cover no-repeat`
          : "linear-gradient(145deg, #e8c4a0 0%, #c69060 40%, #a07050 100%)",
      }}
    />
  );
}

/** Popover with a "contact us" CTA */
function DemoPopover({
  open,
  onClose,
  anchorRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 19 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: 0,
          background: "#ffffff",
          border: "1px solid rgba(10,15,26,0.10)",
          borderRadius: 12,
          boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
          padding: "14px 16px",
          zIndex: 20,
          minWidth: 220,
          maxWidth: 280,
        }}
      >
        {children}
      </div>
    </>
  );
}

export default function AdReviewDemo({ block }: { block: ProductDemoBlock }) {
  const data = { ...DEFAULT_DATA, ...block.exampleData };
  const [status, setStatus] = useState<Status>((data.status as Status) ?? "pending");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState(1); // 0 = V1, 1 = V2 (current)
  const [versionPopoverOpen, setVersionPopoverOpen] = useState(false);
  const [copyPopoverOpen, setCopyPopoverOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

  const cfg = STATUS_CONFIG[status];

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
          color: "#ff700b",
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
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        border: "1px solid rgba(10, 15, 26, 0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        padding: "20px 24px",
        maxWidth: 710,
        width: "100%",
        fontFamily: "var(--font-body, system-ui, -apple-system, sans-serif)",
        position: "relative",
      }}
    >
      {/* Header: index + version badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#0b0c10" }}>{data.index}</span>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setVersionPopoverOpen((o) => !o)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#4b5563",
              background: "#f3f4f6",
              borderRadius: 6,
              padding: "3px 8px",
              letterSpacing: "0.02em",
              border: "1px solid transparent",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(10,15,26,0.12)";
              e.currentTarget.style.background = "#eef0f3";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.background = "#f3f4f6";
            }}
          >
            {data.version}
          </button>

          {/* Version switcher popover */}
          <DemoPopover open={versionPopoverOpen} onClose={() => setVersionPopoverOpen(false)}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
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
                    borderColor: activeVersion === i ? "#ff700b" : "rgba(10,15,26,0.10)",
                    background: activeVersion === i ? "#fff5ee" : "#ffffff",
                    color: activeVersion === i ? "#ff700b" : "#4b5563",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>
              Toggle between creative versions to compare iterations side by side.
            </div>
            {demoCta}
          </DemoPopover>
        </div>
      </div>

      {/* Main content: portrait ad + right column (equal widths) */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* 9:16 portrait ad */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
              background: "#f9fafb",
              borderRadius: 10,
              padding: "10px 14px",
              border: "1px solid rgba(10,15,26,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              Primary Copy
            </div>
            <div style={{ fontSize: 14, color: "#1f2937", lineHeight: 1.5 }}>
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
              background: "#f9fafb",
              borderRadius: 10,
              padding: "10px 14px",
              border: "1px solid rgba(10,15,26,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#6b7280",
                marginBottom: 4,
              }}
            >
              Headline
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0b0c10", marginBottom: 10 }}>
              {data.copy?.headline}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#6b7280",
                marginBottom: 4,
              }}
            >
              Description
            </div>
            <div style={{ fontSize: 14, color: "#1f2937" }}>{data.copy?.description}</div>
          </div>

          {/* Edit platform copy button */}
          <div style={{ ...rightContentStyle, display: "flex", justifyContent: "flex-end", position: "relative" }}>
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
                background: "#ffffff",
                border: "1px solid rgba(10,15,26,0.12)",
                borderRadius: 8,
                padding: "7px 14px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              onClick={() => setCopyPopoverOpen((o) => !o)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Edit platform copy
            </button>

            {/* Edit copy popover */}
            <DemoPopover open={copyPopoverOpen} onClose={() => setCopyPopoverOpen(false)}>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                Tailor headlines and descriptions for each Meta placement — Feed, Stories, Reels — right from the review link.
              </div>
              {demoCta}
            </DemoPopover>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(10,15,26,0.08)", margin: "16px 0 12px" }} />

      {/* Status selector */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            color: cfg.color,
            background: "transparent",
            border: "1px solid rgba(10,15,26,0.10)",
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
                background: "#ffffff",
                border: "1px solid rgba(10,15,26,0.10)",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                padding: 4,
                zIndex: 10,
                minWidth: 180,
              }}
            >
              {(Object.entries(STATUS_CONFIG) as [Status, typeof cfg][]).map(([key, val]) => (
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
                    color: val.color,
                    background: status === key ? val.bg : "transparent",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (status !== key) e.currentTarget.style.background = "#f9fafb";
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
              ))}
            </div>
          </>
        )}

        {/* Status change popover */}
        <DemoPopover open={statusPopoverOpen} onClose={() => setStatusPopoverOpen(false)}>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
            Your feedback flows back to us in real time. Approve, request edits, or reject — we act on it immediately.
          </div>
          {demoCta}
        </DemoPopover>
      </div>
    </div>
  );
}
