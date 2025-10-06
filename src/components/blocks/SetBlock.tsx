'use client';

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { SetBlockView } from "@/lib/sanity/pageViews";
import {
  gmBreakpoints,
  gmColors,
  gmEffects,
  gmRadius,
  gmSpacing,
  gmTypography,
} from "@/styles/designTokens";

const SET_TYPE_LABELS: Record<SetBlockView["setType"], string> = {
  curatedSet: "Curated Set",
  dynamicSet: "Dynamic Set",
  generated: "Generated",
};

type SetBlockProps = {
  block: SetBlockView;
};

export function SetBlock({ block }: SetBlockProps) {
  const pagination = block.pagination;
  const searchParams = useSearchParams();

  const { prevHref, nextHref } = useMemo(() => {
    if (!pagination) {
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
      prevHref: buildHref(pagination.page - 1),
      nextHref: buildHref(pagination.page + 1),
    };
  }, [pagination, searchParams]);

  if (block.items.length === 0) {
    return null;
  }

  const isDynamic = block.setType === "dynamicSet" && pagination;

  const shouldShowSource = Boolean(
    block.setTitle && (block.resolvedFromFallback || block.setTitle !== block.title),
  );
  const sourceLabel = block.resolvedFromFallback ? "Fallback set" : "Source set";

  return (
    <div className={gmSpacing["gm-spacing-shell-stack"]}>
      <header className={gmSpacing["gm-spacing-tight-stack"]}>
        <div
          className={[
            "flex flex-wrap items-center",
            gmSpacing["gm-spacing-grid"],
          ].join(" ")}
        >
          <h2 className={gmTypography["gm-typography-block-heading"]}>{block.title}</h2>
          <span
            className={[
              gmRadius["gm-radius-pill"],
              gmColors["gm-color-surface-tint"],
              gmSpacing["gm-spacing-pill"],
              gmTypography["gm-typography-label-xs"],
              gmColors["gm-color-text-subtle"],
            ].join(" ")}
          >
            {SET_TYPE_LABELS[block.setType]}
          </span>
        </div>
        {block.description && (
          <p
            className={[
              gmTypography["gm-typography-body-base"],
              gmColors["gm-color-text-muted"],
            ].join(" ")}
          >
            {block.description}
          </p>
        )}
        {shouldShowSource && (
          <p
            className={[
              gmTypography["gm-typography-body-sm"],
              gmColors["gm-color-text-subtle"],
            ].join(" ")}
          >
            {sourceLabel}: {block.setTitle}
          </p>
        )}
      </header>
      <div
        className={[
          "grid",
          gmSpacing["gm-spacing-grid-relaxed"],
          gmBreakpoints["gm-breakpoint-grid-two-column"],
        ].join(" ")}
      >
        {block.items.map((item) => (
          <article
            key={item.id}
            className={[
              gmSpacing["gm-spacing-compact-stack"],
              gmRadius["gm-radius-base"],
              "border",
              gmColors["gm-color-border-subtle"],
              gmColors["gm-color-surface-raised"],
              gmSpacing["gm-spacing-card"],
              "shadow-sm",
              gmColors["gm-color-shadow-subtle"],
            ].join(" ")}
          >
            <div
              className={[
                "flex flex-wrap items-center justify-between",
                gmSpacing["gm-spacing-grid-tight"],
                gmTypography["gm-typography-label-xs"],
                gmColors["gm-color-text-faint"],
              ].join(" ")}
            >
              <span>{item.type}</span>
              {item.contentType?.label && <span>{item.contentType.label}</span>}
            </div>
            <h3
              className={[
                gmTypography["gm-typography-body-lg"],
                gmTypography["gm-typography-strong"],
                gmColors["gm-color-text-primary"],
              ].join(" ")}
            >
              {item.title}
            </h3>
            {(item.industries.length > 0 || item.personas.length > 0) && (
              <div
                className={[
                  "flex flex-wrap",
                  gmSpacing["gm-spacing-grid-tight"],
                  gmTypography["gm-typography-body-xs"],
                  gmColors["gm-color-text-tag"],
                ].join(" ")}
              >
                {item.industries.map((industry) => (
                  <span
                    key={industry.id}
                    className={[
                      gmRadius["gm-radius-pill"],
                      gmColors["gm-color-surface-chip"],
                      gmSpacing["gm-spacing-chip"],
                      gmColors["gm-color-text-chip"],
                    ].join(" ")}
                  >
                    {industry.label}
                  </span>
                ))}
                {item.personas.map((persona) => (
                  <span
                    key={persona.id}
                    className={[
                      gmRadius["gm-radius-pill"],
                      gmColors["gm-color-surface-chip"],
                      gmSpacing["gm-spacing-chip"],
                      gmColors["gm-color-text-chip"],
                    ].join(" ")}
                  >
                    {persona.label}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      {isDynamic ? (
        <div
          className={[
            "flex flex-col",
            gmSpacing["gm-spacing-grid-tight"],
            gmTypography["gm-typography-body-sm"],
            gmColors["gm-color-text-muted"],
            gmBreakpoints["gm-breakpoint-pagination-layout"],
          ].join(" ")}
        >
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className={["flex", gmSpacing["gm-spacing-grid"]].join(" ")}>
            {pagination.hasPrevious ? (
              <Link
                href={prevHref}
                scroll={false}
                className={[
                  gmRadius["gm-radius-base"],
                  "border",
                  gmColors["gm-color-border-strong"],
                  gmSpacing["gm-spacing-pill"],
                  gmTypography["gm-typography-label-xs"],
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
                  gmSpacing["gm-spacing-pill"],
                  gmTypography["gm-typography-label-xs"],
                  gmColors["gm-color-text-faint"],
                  gmEffects["gm-effect-opacity-subdued"],
                ].join(" ")}
              >
                Previous
              </span>
            )}
            {pagination.hasNext ? (
              <Link
                href={nextHref}
                scroll={false}
                className={[
                  gmRadius["gm-radius-base"],
                  "border",
                  gmColors["gm-color-border-strong"],
                  gmSpacing["gm-spacing-pill"],
                  gmTypography["gm-typography-label-xs"],
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
                  gmSpacing["gm-spacing-pill"],
                  gmTypography["gm-typography-label-xs"],
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
