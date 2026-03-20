"use client";

import { useEffect, useState } from "react";

/**
 * Dev-only banner that shows whether the current page is rendering
 * from Firestore or seed fallback data.
 *
 * Only renders when NODE_ENV !== "production".
 * Calls /api/admin/inspect?slug=<current path> on mount.
 */

interface InspectResult {
  source: "firestore" | "seed" | "not_found";
  page?: { id: string; title: string; updatedAt?: string };
  blockCount?: number;
  blockSequence?: string;
}

export function DevDataSourceBanner() {
  const [info, setInfo] = useState<InspectResult | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const slug = window.location.pathname;
    fetch(`/api/admin/inspect?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => setInfo(data))
      .catch(() => setInfo({ source: "not_found" }));
  }, []);

  if (process.env.NODE_ENV === "production") return null;
  if (!info || !visible) return null;

  const colors: Record<string, { bg: string; text: string }> = {
    firestore: { bg: "#065f46", text: "#d1fae5" },
    seed: { bg: "#92400e", text: "#fef3c7" },
    not_found: { bg: "#991b1b", text: "#fecaca" },
  };

  const { bg, text } = colors[info.source] ?? colors.not_found;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        right: 8,
        zIndex: 99999,
        background: bg,
        color: text,
        padding: "6px 12px",
        borderRadius: 6,
        fontSize: 12,
        fontFamily: "monospace",
        lineHeight: 1.4,
        maxWidth: 360,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        cursor: "pointer",
      }}
      onClick={() => setVisible(false)}
      title="Click to dismiss"
    >
      <div style={{ fontWeight: 700 }}>
        Source: {info.source.toUpperCase()}
      </div>
      {info.blockCount != null && (
        <div style={{ opacity: 0.85, marginTop: 2 }}>
          {info.blockCount} blocks: {info.blockSequence}
        </div>
      )}
      {info.page?.updatedAt && (
        <div style={{ opacity: 0.7, marginTop: 2 }}>
          Updated: {new Date(info.page.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
