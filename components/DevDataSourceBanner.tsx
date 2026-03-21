"use client";

import { useState } from "react";
import type { PageDataSource } from "@/lib/pageContent";

/**
 * Dev-only banner that shows whether the current page is rendering
 * from Firestore or seed fallback data.
 *
 * Receives data source info as props from the server component
 * so it always reflects the ACTUAL render source (not a separate API call).
 *
 * Only renders when NODE_ENV !== "production".
 */

interface Props {
  source: PageDataSource;
  blockSequence: string;
  blockCount: number;
  pageStatus?: string;
  updatedAt?: string;
}

export function DevDataSourceBanner({ source = "not_found", blockSequence, blockCount, pageStatus, updatedAt }: Props) {
  const [visible, setVisible] = useState(true);

  if (process.env.NODE_ENV === "production") return null;
  if (!visible) return null;

  const colors: Record<string, { bg: string; text: string }> = {
    firestore: { bg: "#065f46", text: "#d1fae5" },
    seed: { bg: "#92400e", text: "#fef3c7" },
    not_found: { bg: "#991b1b", text: "#fecaca" },
  };

  const { bg, text } = colors[source] ?? colors.not_found;

  const warnings: string[] = [];
  if (pageStatus && pageStatus !== "published") {
    warnings.push(`Page status is "${pageStatus}" — it will NOT render on the public site. Set status to "published" to make it visible.`);
  }
  if (source === "seed") {
    warnings.push("Rendering from seed data. Seed blocks may not match Firestore.");
  }

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
        Source: {source.toUpperCase()}
      </div>
      {blockCount > 0 && (
        <div style={{ opacity: 0.85, marginTop: 2 }}>
          {blockCount} blocks: {blockSequence}
        </div>
      )}
      {warnings.map((w, i) => (
        <div key={i} style={{ color: "#fca5a5", marginTop: 2, fontWeight: 600 }}>
          ⚠ {w}
        </div>
      ))}
      {updatedAt && (
        <div style={{ opacity: 0.7, marginTop: 2 }}>
          Updated: {new Date(updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
