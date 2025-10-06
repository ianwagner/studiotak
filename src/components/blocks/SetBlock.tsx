'use client';

import { useMemo } from "react";
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
  const pagination = block.pagination;
  const searchParams = useSearchParams();
  const activePagination =
    block.setType === "dynamicSet" && pagination && pagination.totalPages > 1 ? pagination : null;
  const density = block.density ?? "default";

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

  if (block.items.length === 0) {
    return null;
  }

  const shouldShowSource = Boolean(
    block.setTitle && (block.resolvedFromFallback || block.setTitle !== block.title),
  );
  const sourceLabel = block.resolvedFromFallback ? "Fallback set" : "Source set";

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
  const contentGridGap = resolveSpacingToken(
    "gm-spacing-grid-relaxed",
    "gm-spacing-grid-relaxed",
    density,
    "SetBlock.contentGrid",
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
        {shouldShowSource ? (
          <p className={[metaClass, gmColors["gm-color-text-subtle"]].join(" ")}>
            {sourceLabel}: {block.setTitle}
          </p>
        ) : null}
      </header>
      <div
        className={["grid", contentGridGap, gmBreakpoints["gm-breakpoint-grid-two-column"]].join(" ")}
      >
        {block.items.map((item) => (
          <ContentItemCard key={item.id} item={item} />
        ))}
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
