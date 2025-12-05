'use client';

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { ContentItemCard } from "@/components/content";
import type { ContentItem, DisplayBlockType, DisplayBlockView } from "@/lib/sanity/pageViews";
import { gmSpacing } from "@/styles/designTokens";

type DisplayBlockVariant = "section" | "media";

type DisplayBlockProps = {
  block: DisplayBlockView;
  variant?: DisplayBlockVariant;
};

type SplayTransform = {
  x: number;
  rotation: number;
};

const MIN_SPLAY_LIMIT = 2;
const MAX_SPLAY_LIMIT = 8;
const DEFAULT_SPLAY_LIMIT = 5;
const MIN_SPLAY_GAP = -30;
const MAX_SPLAY_GAP = 60;
const DEFAULT_SPLAY_GAP = 8;
const BASE_HORIZONTAL_SPACING = 18;

const clampSplayLimit = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_SPLAY_LIMIT;
  }

  return Math.max(MIN_SPLAY_LIMIT, Math.min(value, MAX_SPLAY_LIMIT));
};

const clampSplayGap = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_SPLAY_GAP;
  }

  return Math.max(MIN_SPLAY_GAP, Math.min(value, MAX_SPLAY_GAP));
};

const ROTATION_SEQUENCE = [-6, 6, -3, 3, -9, 9, -12, 12, -15, 15, 0];

const pseudoRandomFromString = (input: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = (hash * 16777619) >>> 0;
  }

  return hash / 4294967295;
};

const buildDepthMap = (items: ContentItem[]): Map<string, number> => {
  const entries = items.map((item, index) => {
    const key = item.id ?? `splay-item-${index}`;
    return {
      key,
      weight: pseudoRandomFromString(key),
    };
  });

  const sorted = [...entries].sort((a, b) => b.weight - a.weight);
  const map = new Map<string, number>();

  sorted.forEach((entry, order) => {
    map.set(entry.key, 20 + order);
  });

  return map;
};

const buildSplayTransforms = (count: number, gap: number): SplayTransform[] => {
  if (count <= 0) {
    return [];
  }

  const spacing = Math.max(4, BASE_HORIZONTAL_SPACING + gap);
  const centerOffset = (count - 1) / 2;

  return Array.from({ length: count }).map((_, index) => {
    const offsetIndex = index - centerOffset;
    const x = offsetIndex * spacing;
    const rotation = ROTATION_SEQUENCE[index % ROTATION_SEQUENCE.length] ?? 0;

    return {
      x,
      rotation,
    };
  });
};

const GalleryGrid = ({ items, variant }: { items: ContentItem[]; variant: DisplayBlockVariant }) => (
  <div
    className={variant === "media" ? "grid gap-4" : "grid gap-6"}
    style={{
      gridTemplateColumns:
        variant === "media"
          ? "repeat(auto-fit, minmax(min(14rem, 100%), 1fr))"
          : "repeat(auto-fit, minmax(min(18rem, 100%), 1fr))",
    }}
  >
    {items.map((item) => (
      <div key={item.id} className="flex justify-center">
        <div className="w-full max-w-xl">
          <ContentItemCard item={item} />
        </div>
      </div>
    ))}
  </div>
);

const SplayCanvas = ({
  items,
  gap,
  variant,
}: {
  items: ContentItem[];
  gap: number;
  variant: DisplayBlockVariant;
}) => {
  const transforms = useMemo(() => buildSplayTransforms(items.length, gap), [items.length, gap]);
  const depthMap = useMemo(() => buildDepthMap(items), [items]);
  const keyIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item, index) => {
      map.set(item.id ?? `splay-item-${index}`, index);
    });
    return map;
  }, [items]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const minHeight = variant === "media" ? "clamp(18rem, 36vw, 32rem)" : "clamp(24rem, 45vw, 40rem)";
  const cardWidth = variant === "media" ? "clamp(10rem, 18vw, 16rem)" : "clamp(12rem, 22vw, 20rem)";
  const spacing = Math.max(4, BASE_HORIZONTAL_SPACING + gap);
  const HOVER_Z_INDEX = 40;
  const hoveredTransform = useMemo(() => {
    if (!hoveredId) {
      return null;
    }

    const targetIndex = keyIndexMap.get(hoveredId);
    if (typeof targetIndex !== "number" || targetIndex < 0) {
      return null;
    }

    return transforms[targetIndex] ?? null;
  }, [hoveredId, keyIndexMap, transforms]);

  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden" style={{ minHeight }}>
      {items.map((item, index) => {
        const transform = transforms[index];

        if (!transform) {
          return null;
        }

        const itemKey = item.id ?? `splay-item-${index}`;
        const isHovered = hoveredId === itemKey;
        const isDimmed = Boolean(hoveredId) && !isHovered;
        const baseX = transform.x;
        let translateX = baseX;
        let translateY = isHovered ? -6 : 0;
        let scale = isHovered ? 1.04 : 1;

        if (hoveredTransform && !isHovered) {
          const direction = baseX < hoveredTransform.x ? -1 : baseX > hoveredTransform.x ? 1 : 0;
          const distanceFactor = Math.max(1, Math.abs(baseX - hoveredTransform.x) / spacing);
          translateX = baseX + direction * 18 * distanceFactor;
          translateY = 10;
          scale = 0.94;
        }

        const style: CSSProperties = {
          transform: `translate(-50%, -50%) translate(${translateX}%, ${translateY}px) rotate(${transform.rotation}deg) scale(${scale})`,
          zIndex: isHovered ? HOVER_Z_INDEX : depthMap.get(itemKey) ?? 1,
          width: cardWidth,
          transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease",
          opacity: isDimmed ? 0.9 : 1,
        };

        return (
          <div
            key={itemKey}
            className="absolute left-1/2 top-1/2"
            style={style}
            onMouseEnter={() => setHoveredId(itemKey)}
            onMouseLeave={() => setHoveredId((current) => (current === itemKey ? null : current))}
            onFocus={() => setHoveredId(itemKey)}
            onBlur={() => setHoveredId((current) => (current === itemKey ? null : current))}
          >
            <ContentItemCard item={item} />
          </div>
        );
      })}
    </div>
  );
};

export function DisplayBlock({ block, variant = "section" }: DisplayBlockProps) {
  const baseItems = block.items ?? [];
  const displayType: DisplayBlockType = block.displayType === "splay" ? "splay" : "gallery";
  const splayLimit = clampSplayLimit(block.splayLimit);
  const splayGap = clampSplayGap(block.splayGap);
  const items = displayType === "splay" ? baseItems.slice(0, splayLimit) : baseItems;

  if (items.length === 0) {
    return null;
  }

  const wrapperClass =
    variant === "section" ? gmSpacing["gm-spacing-relaxed-stack"] : "flex w-full flex-col gap-4";

  return (
    <div className={wrapperClass}>
      {displayType === "gallery" ? (
        <GalleryGrid items={items} variant={variant} />
      ) : (
        <SplayCanvas items={items} gap={splayGap} variant={variant} />
      )}
    </div>
  );
}
