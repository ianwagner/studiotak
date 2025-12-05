'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ContentItemCard } from "@/components/content";
import type { SetBlockView } from "@/lib/sanity/pageViews";
import {
  gmBreakpoints,
  gmColors,
  gmEffects,
  gmRadius,
} from "@/styles/designTokens";

import { resolveSpacingToken, resolveTypographyToken } from "./tokenUtils";

type SetBlockProps = {
  block: SetBlockView;
};

export function SetBlock({ block }: SetBlockProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(true);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const pagination = block.pagination;
  const searchParams = useSearchParams();
  const activePagination =
    block.setType === "dynamicSet" && pagination && pagination.totalPages > 1 ? pagination : null;
  const density = block.density ?? "default";
  const isAdGallery = Boolean(block.adGallery);

  const { prevHref, nextHref } = useMemo(() => {
    if (!activePagination) {
      return { prevHref: "", nextHref: "" };
    }

    const baseParams = new URLSearchParams(searchParams ? searchParams.toString() : "");

    const buildHref = (targetPage: number) => {
      const params = new URLSearchParams(baseParams.toString());

      if (targetPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(targetPage));
      }

      const query = params.toString();
      if (!query) {
        return "?";
      }

      return `?${query}`;
    };

    return {
      prevHref: buildHref(activePagination.page - 1),
      nextHref: buildHref(activePagination.page + 1),
    };
  }, [activePagination, searchParams]);

  const containerStack = resolveSpacingToken(
    "gm-spacing-shell-stack",
    "gm-spacing-shell-stack",
    density,
    "SetBlock.container",
  );
  const headerStack = resolveSpacingToken(
    "gm-spacing-tight-stack",
    "gm-spacing-tight-stack",
    density,
    "SetBlock.header",
  );
  const headerGridGap = resolveSpacingToken(
    "gm-spacing-grid",
    "gm-spacing-grid",
    density,
    "SetBlock.headerGrid",
  );
  const paginationStack = resolveSpacingToken(
    "gm-spacing-grid-tight",
    "gm-spacing-grid-tight",
    density,
    "SetBlock.pagination",
  );
  const paginationButtonSpacing = resolveSpacingToken(
    "gm-spacing-pill",
    "gm-spacing-pill",
    density,
    "SetBlock.paginationButton",
  );

  const [itemsPerSlide, setItemsPerSlide] = useState(() => (isAdGallery ? 2 : 1));
  const shouldUseCarousel = isAdGallery || isMobile;
  const effectiveItemsPerSlide = shouldUseCarousel
    ? Math.max(1, isAdGallery ? itemsPerSlide : 1)
    : 1;
  const rawTotalSlides = shouldUseCarousel
    ? Math.ceil(block.items.length / effectiveItemsPerSlide)
    : block.items.length;
  const totalSlides = Math.max(0, rawTotalSlides);

  const desktopColumnClasses = useMemo(() => {
    const baseColumns = gmBreakpoints["gm-breakpoint-grid-two-column"];

    if (totalSlides <= 3) {
      return baseColumns;
    }

    const columns = ["md:grid-cols-2", "lg:grid-cols-3", "xl:grid-cols-4"];

    if (totalSlides >= 5) {
      columns.push(totalSlides >= 6 ? "2xl:grid-cols-6" : "2xl:grid-cols-5");
    }

    return columns.join(" ");
  }, [totalSlides]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = () => {
      setIsMobile(!mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!isAdGallery) {
      setItemsPerSlide((current) => (current === 1 ? current : 1));
      return;
    }

    if (typeof window === "undefined") {
      setItemsPerSlide((current) => (current === 2 ? current : 2));
      return;
    }

    const updateItemsPerSlide = () => {
      const width = window.innerWidth;
      const next = width >= 1024 ? 4 : width >= 768 ? 3 : 2;

      setItemsPerSlide((current) => (current === next ? current : next));
    };

    updateItemsPerSlide();
    window.addEventListener("resize", updateItemsPerSlide);

    return () => {
      window.removeEventListener("resize", updateItemsPerSlide);
    };
  }, [isAdGallery]);

  useEffect(() => {
    setActiveSlide(0);
  }, [shouldUseCarousel, totalSlides]);

  const goToSlide = (index: number) => {
    if (totalSlides === 0) {
      return;
    }

    const next = Math.max(0, Math.min(index, totalSlides - 1));
    setActiveSlide(next);
  };

  const handlePrevious = () => {
    goToSlide(activeSlide - 1);
  };

  const handleNext = () => {
    goToSlide(activeSlide + 1);
  };

  const trackGapClasses = useMemo(() => {
    if (isAdGallery) {
      return [
        "gap-0",
        "md:gap-x-px",
        "md:gap-y-px",
        "lg:gap-x-1",
        "lg:gap-y-1",
        "xl:gap-x-1",
        "xl:gap-y-1",
        "2xl:gap-x-1",
        "2xl:gap-y-1",
      ].join(" ");
    }

    return [
      "gap-0",
      "md:gap-x-px",
      "md:gap-y-px",
      "lg:gap-x-1",
      "lg:gap-y-1",
      "xl:gap-x-1",
      "xl:gap-y-1",
      "2xl:gap-x-1",
      "2xl:gap-y-1",
    ].join(" ");
  }, [isAdGallery]);

  const itemWrapperClasses = useMemo(() => {
    if (isAdGallery) {
      return [
        "flex-shrink-0",
        "w-1/2",
        "md:w-1/3",
        "lg:w-1/4",
        "md:flex-shrink-0",
      ].join(" ");
    }

    return ["w-full", "flex-shrink-0", "md:w-auto", "md:flex-shrink"].join(" ");
  }, [isAdGallery]);

  if (totalSlides === 0) {
    return null;
  }

  const trackStyle = shouldUseCarousel
    ? { transform: `translateX(-${activeSlide * 100}%)` }
    : undefined;

  const titleClass = resolveTypographyToken(
    "gm-typography-block-heading",
    "gm-typography-block-heading",
    "SetBlock.title",
  );
  const labelClass = resolveTypographyToken(
    "gm-typography-label-xs",
    "gm-typography-label-xs",
    "SetBlock.label",
  );
  const bodyClass = resolveTypographyToken(
    "gm-typography-body-base",
    "gm-typography-body-base",
    "SetBlock.body",
  );
  const metaClass = resolveTypographyToken(
    "gm-typography-body-sm",
    "gm-typography-body-sm",
    "SetBlock.meta",
  );

  return (
    <div className={containerStack}>
      <header className={headerStack}>
        <div className={["flex flex-wrap items-center", headerGridGap].join(" ")}>
          <h2 className={titleClass}>{block.title}</h2>
        </div>
        {block.description ? (
          <p className={[bodyClass, gmColors["gm-color-text-muted"]].join(" ")}>
            {block.description}
          </p>
        ) : null}
      </header>
      <div className="relative md:static">
        <div className="overflow-hidden md:overflow-visible">
          <div
            ref={carouselRef}
            className={[
              "flex transition-transform duration-300 ease-out",
              shouldUseCarousel ? "flex-nowrap" : "",
              !isAdGallery ? "md:grid" : "",
              !isAdGallery ? desktopColumnClasses : "",
              trackGapClasses,
            ]
              .filter(Boolean)
              .join(" ")}
            style={trackStyle}
          >
            {block.items.map((item) => (
              <div
                key={item.id}
                className={itemWrapperClasses}
              >
                <ContentItemCard item={item} className="p-0" />
              </div>
            ))}
          </div>
        </div>
        {shouldUseCarousel && totalSlides > 1 ? (
          <div
            className={[
              "mt-4 flex items-center justify-center gap-4",
              isAdGallery ? "" : "md:hidden",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={handlePrevious}
              disabled={activeSlide === 0}
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-full border bg-content transition disabled:cursor-not-allowed",
                gmColors["gm-color-border-subtle"],
                gmColors["gm-color-hover-surface-accent-soft"],
                gmColors["gm-color-text-accent"],
                activeSlide === 0 ? "opacity-40" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="Previous item"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <span
                  key={`indicator-${index}`}
                  aria-hidden="true"
                  className={[
                    "h-2 w-2 rounded-full transition",
                    index === activeSlide
                      ? gmColors["gm-color-surface-accent"]
                      : "bg-foreground/30",
                  ].join(" ")}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeSlide === totalSlides - 1}
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-full border bg-content transition disabled:cursor-not-allowed",
                gmColors["gm-color-border-subtle"],
                gmColors["gm-color-hover-surface-accent-soft"],
                gmColors["gm-color-text-accent"],
                activeSlide === totalSlides - 1 ? "opacity-40" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="Next item"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        ) : null}
      </div>
      {activePagination ? (
        <div
          className={[
            "flex flex-col",
            paginationStack,
            metaClass,
            gmColors["gm-color-text-muted"],
            gmBreakpoints["gm-breakpoint-pagination-layout"],
          ].join(" ")}
        >
          <span>
            Page {activePagination.page} of {activePagination.totalPages}
          </span>
          <div className={["flex", headerGridGap].join(" ")}>
            {activePagination.hasPrevious ? (
              <Link
                href={prevHref}
                scroll={false}
                className={[
                  gmRadius["gm-radius-base"],
                  "border",
                  gmColors["gm-color-border-strong"],
                  paginationButtonSpacing,
                  labelClass,
                  gmColors["gm-color-text-muted"],
                  "transition",
                  gmColors["gm-color-hover-surface-tint"],
                ].join(" ")}
              >
                Previous
              </Link>
            ) : (
              <span
                className={[
                  gmRadius["gm-radius-base"],
                  "border",
                  gmColors["gm-color-border-strong"],
                  paginationButtonSpacing,
                  labelClass,
                  gmColors["gm-color-text-faint"],
                  gmEffects["gm-effect-opacity-subdued"],
                ].join(" ")}
              >
                Previous
              </span>
            )}
            {activePagination.hasNext ? (
              <Link
                href={nextHref}
                scroll={false}
                className={[
                  gmRadius["gm-radius-base"],
                  "border",
                  gmColors["gm-color-border-strong"],
                  paginationButtonSpacing,
                  labelClass,
                  gmColors["gm-color-text-muted"],
                  "transition",
                  gmColors["gm-color-hover-surface-tint"],
                ].join(" ")}
              >
                Next
              </Link>
            ) : (
              <span
                className={[
                  gmRadius["gm-radius-base"],
                  "border",
                  gmColors["gm-color-border-strong"],
                  paginationButtonSpacing,
                  labelClass,
                  gmColors["gm-color-text-faint"],
                  gmEffects["gm-effect-opacity-subdued"],
                ].join(" ")}
              >
                Next
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
