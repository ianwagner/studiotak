"use client";

import { useMemo } from "react";

export type MediaOption = {
  id: string;
  name: string;
  url: string;
  mediaType?: "image" | "video";
};

type MediaSelectProps = {
  options: MediaOption[];
  value: string;
  search: string;
  filterType?: "image" | "video";
  onSearch: (val: string) => void;
  onSelect: (url: string, mediaType?: "image" | "video", name?: string) => void;
  onClose: () => void;
};

export function MediaSelect({ options, value, search, filterType, onSearch, onSelect, onClose }: MediaSelectProps) {
  const filtered = useMemo(
    () =>
      options.filter((opt) => {
        const matchesSearch =
          opt.name.toLowerCase().includes(search.toLowerCase()) ||
          opt.url.toLowerCase().includes(search.toLowerCase());
        const matchesType = !filterType || (opt.mediaType ?? "image") === filterType;
        return matchesSearch && matchesType;
      }),
    [options, search, filterType]
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "min(960px, 100%)",
          maxHeight: "90vh",
          overflow: "hidden",
          padding: 16,
          display: "grid",
          gap: 12,
          border: "1px solid var(--border)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0 }}>Choose media</h3>
          <button className="btn secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <input
          className="input"
          value={search}
          placeholder="Search media…"
          onChange={(e) => onSearch(e.target.value)}
        />
        <div
          style={{
            overflow: "auto",
            padding: "4px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 10
          }}
        >
          {filtered.map((opt) => {
            const isVideo = opt.mediaType === "video" || /\.(mp4|mov|webm|ogg)$/i.test(opt.url);
            return (
              <button
                key={opt.id}
                type="button"
                className={`card${value === opt.url ? " active" : ""}`}
                style={{
                  padding: 8,
                  border: value === opt.url ? "1.5px solid var(--border-strong)" : "1px solid var(--border)",
                  display: "grid",
                  gap: 6
                }}
                onClick={() => onSelect(opt.url, opt.mediaType, opt.name)}
              >
                {isVideo ? (
                  <div style={{ position: "relative", width: "100%", paddingTop: "56%", borderRadius: 8, overflow: "hidden" }}>
                    <video
                      src={opt.url}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      muted
                    />
                  </div>
                ) : (
                  <img
                    src={opt.url}
                    alt={opt.name}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid var(--border)"
                    }}
                  />
                )}
                <span style={{ fontSize: 13, textAlign: "left" }}>{opt.name}</span>
              </button>
            );
          })}
          {!filtered.length ? <span style={{ color: "var(--muted)", fontSize: 13 }}>No matches</span> : null}
        </div>
      </div>
    </div>
  );
}
