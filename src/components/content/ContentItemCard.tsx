import { PortableText } from "@portabletext/react";
import Image from "next/image";

import type { ContentItem } from "@/lib/sanity/pageViews";
import {
  gmColors,
  gmRadius,
  gmSpacing,
  gmTypography,
} from "@/styles/designTokens";
import { getContentTypePreset } from "@/styles/contentTypePresets";
import { portableTextComponents } from "@/components/portableText/components";

const joinClassNames = (
  ...classes: Array<string | null | undefined | false>
) => classes.filter(Boolean).join(" ");

const DEFAULT_DIMENSIONS = {
  width: 1600,
  height: 900,
};

const humanizeType = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const spaced = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim();

  if (spaced.length === 0) {
    return "";
  }

  return spaced
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const extractDimensionsFromSanityUrl = (url: string) => {
  const match = url.match(/-(\d+)x(\d+)\.[A-Za-z0-9]+(?:\?|$)/);

  if (!match) {
    return null;
  }

  const [, widthStr, heightStr] = match;

  const width = Number(widthStr);
  const height = Number(heightStr);

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }

  return null;
};

const extractDimensionsFromSvgDataUrl = (url: string) => {
  if (!url.startsWith("data:image/svg")) {
    return null;
  }

  const commaIndex = url.indexOf(",");

  if (commaIndex === -1) {
    return null;
  }

  try {
    const encodedPayload = url.slice(commaIndex + 1);
    const payload = decodeURIComponent(encodedPayload);
    const viewBoxMatch = payload.match(/viewBox="([^"]+)"/i);

    if (!viewBoxMatch) {
      return null;
    }

    const [, viewBox] = viewBoxMatch;
    const parts = viewBox.split(/\s+/);

    if (parts.length !== 4) {
      return null;
    }

    const width = Number(parts[2]);
    const height = Number(parts[3]);

    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height };
    }
  } catch {
    return null;
  }

  return null;
};

const getImageDimensions = (url: string) =>
  extractDimensionsFromSanityUrl(url) ??
  extractDimensionsFromSvgDataUrl(url) ??
  DEFAULT_DIMENSIONS;

type ContentItemCardProps = {
  item: ContentItem;
  className?: string;
  overrideContentTypeLabel?: string | null;
};

export function ContentItemCard({
  item,
  className,
  overrideContentTypeLabel,
}: ContentItemCardProps) {
  const normalizedType = item.type?.toLowerCase();
  const isExampleType = normalizedType === "example";
  const isFeatureType = normalizedType === "feature";
  const preset = getContentTypePreset(isExampleType ? "example" : item.contentType);
  const contentTypeLabel = overrideContentTypeLabel ?? item.contentType?.label ?? null;
  const hasTaxonomyTags = item.industries.length > 0 || item.personas.length > 0;
  const fallbackMediaLabel = contentTypeLabel ?? preset.label;
  const imageAlt =
    typeof item.imageAlt === "string" && item.imageAlt.trim()
      ? item.imageAlt.trim()
      : item.title;

  const portableBody = Array.isArray(item.body) && item.body.length > 0 ? item.body : null;
  const isIconDisplay = item.mediaDisplay === "icon";
  const typeLabel = humanizeType(item.type);
  const showTypeLabel =
    Boolean(typeLabel) &&
    (!contentTypeLabel || typeLabel.toLowerCase() !== contentTypeLabel.toLowerCase());
  const showMetaRow = showTypeLabel || Boolean(contentTypeLabel);

  if (isExampleType) {
    if (!item.imageUrl) {
      return null;
    }

    const { width, height } = getImageDimensions(item.imageUrl);

    return (
      <article className={joinClassNames(...preset.card, className)}>
        <div className="overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={imageAlt}
            width={width}
            height={height}
            sizes="(min-width: 1024px) 320px, (min-width: 768px) 45vw, 90vw"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </article>
    );
  }

  if (isIconDisplay) {
    const baseCardClasses = preset.card.filter((token) => {
      if (!token) {
        return false;
      }

      if (token.includes("space-y-")) {
        return false;
      }

      if (token === "border" || token.startsWith("border-") || token.includes(" border-")) {
        return false;
      }

      if (token.startsWith("shadow")) {
        return false;
      }

      return true;
    });
    const iconCardClasses = joinClassNames(
      ...baseCardClasses,
      gmSpacing["gm-spacing-tight-stack"],
      "flex flex-col items-center text-center",
      className,
    );
    const iconContainerClasses = "relative flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56";
    const iconFallbackClasses = joinClassNames(
      "flex h-full w-full items-center justify-center text-center",
      gmTypography["gm-typography-label-xs"],
      gmColors["gm-color-text-subtle"],
    );
    const iconTitleClasses = joinClassNames(...preset.title, "text-center");
    const iconBodyClasses = joinClassNames(
      gmTypography["gm-typography-body-base"],
      gmColors["gm-color-text-muted"],
      "text-center",
    );

    return (
      <article className={iconCardClasses}>
        <div className={iconContainerClasses}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={imageAlt}
              fill
              sizes="(min-width: 1024px) 224px, (min-width: 768px) 192px, 160px"
              className="h-full w-full object-contain"
              priority={false}
            />
          ) : (
            <div className={iconFallbackClasses}>
              <span>{fallbackMediaLabel}</span>
            </div>
          )}
        </div>
        <h3 className={iconTitleClasses}>{item.title}</h3>
        {portableBody ? (
          <div className={iconBodyClasses}>
            <PortableText value={portableBody} components={portableTextComponents} />
          </div>
        ) : item.contentType?.description ? (
          <p className={iconBodyClasses}>{item.contentType.description}</p>
        ) : null}
      </article>
    );
  }

  if (isFeatureType) {
    return (
      <article className={joinClassNames(...preset.card, className)}>
        <div className={joinClassNames(...preset.mediaWrapper)}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={imageAlt}
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 768px) 45vw, 90vw"
              className="h-full w-full object-cover"
              priority={false}
            />
          ) : (
            <div className={joinClassNames(...preset.mediaFallback)}>
              <span>{fallbackMediaLabel}</span>
            </div>
          )}
        </div>
        <h3 className={joinClassNames(...preset.title)}>{item.title}</h3>
        {portableBody ? (
          <div
            className={joinClassNames(
              gmTypography["gm-typography-body-base"],
              gmColors["gm-color-text-muted"],
            )}
          >
            <PortableText value={portableBody} components={portableTextComponents} />
          </div>
        ) : item.contentType?.description ? (
          <p
            className={joinClassNames(
              gmTypography["gm-typography-body-base"],
              gmColors["gm-color-text-muted"],
            )}
          >
            {item.contentType.description}
          </p>
        ) : null}
      </article>
    );
  }

  return (
    <article className={joinClassNames(...preset.card, className)}>
      <div className={joinClassNames(...preset.mediaWrapper)}>
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 768px) 45vw, 90vw"
            className="h-full w-full object-cover"
            priority={false}
          />
        ) : (
          <div className={joinClassNames(...preset.mediaFallback)}>
            <span>{fallbackMediaLabel}</span>
          </div>
        )}
      </div>
      {showMetaRow ? (
        <header className={joinClassNames(...preset.metaRow)}>
          {showTypeLabel ? (
            <span className={joinClassNames(...preset.typeLabel)}>{typeLabel}</span>
          ) : null}
          {contentTypeLabel ? (
            <span className={joinClassNames(...preset.contentTypeBadge)}>
              {contentTypeLabel}
            </span>
          ) : null}
        </header>
      ) : null}
      <h3 className={joinClassNames(...preset.title)}>{item.title}</h3>
      {hasTaxonomyTags ? (
        <div
          className={joinClassNames(
            "flex flex-wrap",
            gmSpacing["gm-spacing-grid-tight"],
            gmTypography["gm-typography-body-xs"],
            gmColors["gm-color-text-tag"],
          )}
        >
          {item.industries.map((industry) => (
            <span
              key={industry.id}
              className={joinClassNames(
                gmRadius["gm-radius-pill"],
                gmColors["gm-color-surface-chip"],
                gmSpacing["gm-spacing-chip"],
                gmColors["gm-color-text-chip"],
              )}
            >
              {industry.label}
            </span>
          ))}
          {item.personas.map((persona) => (
            <span
              key={persona.id}
              className={joinClassNames(
                gmRadius["gm-radius-pill"],
                gmColors["gm-color-surface-chip"],
                gmSpacing["gm-spacing-chip"],
                gmColors["gm-color-text-chip"],
              )}
            >
              {persona.label}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
