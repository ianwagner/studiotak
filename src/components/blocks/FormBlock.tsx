'use client';

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { buildSanityImage } from "@/lib/sanity/images";
import type { BlockDensity, BlockTheme, BlockThemeSettings, SanityBlock } from "@/lib/sanity/types";
import { gmColors, gmRadius, gmSpacing, gmTypography } from "@/styles/designTokens";

import { resolveSpacingToken, resolveTypographyToken } from "./tokenUtils";

type HubspotFormDocument = {
  _id?: string;
  title?: string;
  hubspotFormId?: string;
  portalIdOverride?: string | null;
  regionOverride?: string | null;
  successMessage?: string | null;
  notes?: string | null;
};

type FormBlockMediaAsset = {
  _ref?: string;
  _id?: string;
};

type FormBlockMedia = {
  alt?: string;
  asset?: FormBlockMediaAsset | string;
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  imageUrl?: string;
};

const MEDIA_WRAPPER_CLASS = [
  "relative",
  "h-full",
  "min-h-[16rem]",
  "w-full",
  "overflow-hidden",
].join(" ");

const MEDIA_PLACEHOLDER_CLASS = [
  gmColors["gm-color-surface-muted"],
  "flex",
  "h-full",
  "min-h-[16rem]",
  "w-full",
  "items-center",
  "justify-center",
  gmColors["gm-color-text-muted"],
  gmTypography["gm-typography-body-sm"],
  "text-center",
].join(" ");

const FORM_MEDIA_IMAGE_SIZES = "(min-width: 1280px) 35vw, (min-width: 768px) 40vw, 100vw";

declare global {
  interface Window {
    hbspt?: {
      forms?: {
        create: (options: {
          portalId: string;
          formId: string;
          target: string;
          inlineMessage?: string;
          cssClass?: string;
          onFormReady?: (form: HTMLElement) => void;
        }) => void;
      };
    };
  }
}

const scriptPromiseCache = new Map<string, Promise<void>>();

function resolveHubspotHost(region?: string | null): string {
  if (region && region !== "na1") {
    return `js-${region}.hsforms.net`;
  }

  return "js.hsforms.net";
}

function ensureHubspotScript(host: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.hbspt?.forms?.create) {
    return Promise.resolve();
  }

  const scriptSrc = `https://${host}/forms/embed/v2.js`;
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

  if (existing) {
    if (existing.dataset.loaded === "true" && window.hbspt?.forms?.create) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => {
        existing.dataset.loaded = "true";
        resolve();
      });
      existing.addEventListener("error", () => reject(new Error("Failed to load HubSpot forms script")));
    });
  }

  const cached = scriptPromiseCache.get(scriptSrc);
  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.type = "text/javascript";
    script.dataset.host = host;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`Failed to load HubSpot forms script from ${host}`)));

    document.body.appendChild(script);
  });

  scriptPromiseCache.set(scriptSrc, promise);

  return promise.catch((error) => {
    scriptPromiseCache.delete(scriptSrc);
    throw error;
  });
}

function sanitizeMultiline(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function normalizeString(value?: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type FormBlockData = SanityBlock & {
  _type: "formBlock";
  heading?: string;
  body?: string;
  form?: HubspotFormDocument | null;
  media?: FormBlockMedia | null;
  portalId?: string | null;
  region?: string | null;
  density?: BlockDensity;
  theme?: BlockTheme | BlockThemeSettings;
};

type FormBlockProps = {
  block: FormBlockData;
};

export function FormBlock({ block }: FormBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderedSignatureRef = useRef<string | null>(null);
  const [isFormReady, setFormReady] = useState(false);

  const density: BlockDensity = block.density ?? "default";
  const headingClass = resolveTypographyToken(
    "gm-typography-section-heading",
    "gm-typography-section-heading",
    "FormBlock.heading",
  );
  const bodyClass = resolveTypographyToken(
    "gm-typography-body-base",
    "gm-typography-body-base",
    "FormBlock.body",
  );
  const columnStack = resolveSpacingToken(
    "gm-spacing-relaxed-stack",
    "gm-spacing-relaxed-stack",
    density,
    "FormBlock.column",
  );
  const copyStack = resolveSpacingToken(
    "gm-spacing-tight-stack",
    "gm-spacing-tight-stack",
    density,
    "FormBlock.copy",
  );

  const portalId = normalizeString(block.portalId) ?? normalizeString(block.form?.portalIdOverride);
  const formId = normalizeString(block.form?.hubspotFormId);
  const inlineMessage = normalizeString(block.form?.successMessage) ?? undefined;

  const heading = normalizeString(block.heading) ?? "";
  const bodyLines = useMemo(() => sanitizeMultiline(block.body), [block.body]);
  const reactGeneratedId = useId();
  const safeFallbackId = useMemo(
    () => `hubspot-form-${reactGeneratedId.replace(/[:]/g, "-")}`,
    [reactGeneratedId],
  );
  const formContainerId = block._key ? `hubspot-form-${block._key}` : safeFallbackId;
  const region = typeof block.region === "string" && block.region.length > 0 ? block.region : null;
  const scriptHost = resolveHubspotHost(region);
  const signature = useMemo(
    () => (portalId && formId ? `${portalId}:${formId}:${inlineMessage ?? ""}:${scriptHost}` : null),
    [portalId, formId, inlineMessage, scriptHost],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (!signature) {
      container.innerHTML = "";
      renderedSignatureRef.current = null;
      setFormReady(false);
      return;
    }

    if (!portalId || !formId) {
      return;
    }

    if (renderedSignatureRef.current === signature && container.childElementCount > 0) {
      setFormReady(true);
      return;
    }

    renderedSignatureRef.current = signature;
    container.innerHTML = "";
    setFormReady(false);

    let cancelled = false;
    let observer: MutationObserver | null = null;

    const commitFormReady = () => {
      if (cancelled) {
        return;
      }

      requestAnimationFrame(() => {
        if (!cancelled) {
          setFormReady(true);
        }
      });
    };

    const startObserver = () => {
      if (!container || observer) {
        return;
      }

      observer = new MutationObserver(() => {
        if (cancelled) {
          return;
        }

        if (container.childElementCount > 0) {
          commitFormReady();
          observer?.disconnect();
          observer = null;
        }
      });

      observer.observe(container, { childList: true, subtree: true });
    };

    startObserver();

    ensureHubspotScript(scriptHost)
      .then(() => {
        if (cancelled) {
          return;
        }

        if (!window.hbspt?.forms?.create) {
          console.error("[FormBlock] HubSpot forms library not available after loading script.");
          return;
        }

        window.hbspt.forms.create({
          portalId,
          formId,
          target: `#${formContainerId}`,
          cssClass: "hubspot-form",
          // keep HubSpot from injecting light-mode defaults; empty css disables their defaults
          css: "",
          inlineMessage,
          onFormReady: () => {
            if (!cancelled) {
              commitFormReady();
            }
            if (observer) {
              observer.disconnect();
              observer = null;
            }
          },
        });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[FormBlock] Failed to load HubSpot forms script.", error);
        }
      });

    return () => {
      cancelled = true;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
  }, [portalId, formId, inlineMessage, formContainerId, scriptHost, signature]);

  if (!portalId || !formId) {
    return (
      <div
        className={[
          gmSpacing["gm-spacing-shell-stack"],
          gmSpacing["gm-spacing-card"],
          gmColors["gm-color-surface-muted"],
          gmColors["gm-color-text-subtle"],
          gmRadius["gm-radius-base"],
          "border",
          gmColors["gm-color-border-subtle"],
        ].join(" ")}
      >
        <p className={gmTypography["gm-typography-body-sm"]}>
          Form configuration is incomplete. Provide a HubSpot portal ID and form ID in Sanity to render this block.
        </p>
      </div>
    );
  }

  const copyExists = heading.length > 0 || bodyLines.length > 0;
  const mediaAltFallback = heading.length > 0 ? heading : undefined;
  const rootClasses = [
    "grid",
    "w-full",
    "gap-y-8",
    "items-start",
    "md:grid-cols-2",
    "md:items-stretch",
    "md:gap-x-0",
    "transition-opacity",
    "duration-300",
    isFormReady ? "visible opacity-100" : "invisible opacity-0",
  ].join(" ");

  const leftColumnClasses = [
    columnStack,
    "flex",
    "h-full",
    "w-full",
    "flex-col",
    "overflow-y-auto",
    "md:h-full",
  ].join(" ");

  return (
    <div className={rootClasses} aria-hidden={!isFormReady} style={{ height: "90vh", minHeight: "90vh" }}>
      <div className={leftColumnClasses}>
        {isFormReady && copyExists ? (
          <div className={copyStack}>
            {heading.length > 0 ? <h2 className={headingClass}>{heading}</h2> : null}
            {bodyLines.length > 0 ? (
              <div className={bodyClass}>
                {bodyLines.map((line, index) => (
                  <p key={`form-block-body-${index}`} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <div
          className={[
            "relative",
            "flex-1",
            "w-full",
            "overflow-y-auto",
          ].join(" ")}
        >
          <div
            ref={containerRef}
            id={formContainerId}
            className={[
              "hubspot-form-container",
              "w-full",
              "min-h-[20rem]",
              "h-full",
              isFormReady ? "relative" : "absolute inset-0 opacity-0 pointer-events-none",
            ].join(" ")}
            aria-busy={!isFormReady}
          />
        </div>
      </div>
      <div className="h-full w-full overflow-hidden">
        {isFormReady ? <FormBlockMediaContent media={block.media} altFallback={mediaAltFallback} /> : null}
      </div>
    </div>
  );
}

type FormBlockMediaContentProps = {
  media?: FormBlockMedia | null;
  altFallback?: string;
};

function FormBlockMediaContent({ media, altFallback }: FormBlockMediaContentProps) {
  if (!media) {
    return <div className={MEDIA_PLACEHOLDER_CLASS}>Add media to fill the right column.</div>;
  }

  const image =
    buildSanityImage(media, {
      quality: 80,
      fit: "fillmax",
    }) ?? (media.imageUrl ? { url: media.imageUrl } : null);

  if (!image?.url) {
    return (
      <div className={MEDIA_PLACEHOLDER_CLASS}>
        {altFallback ?? media.alt ?? "Add media to fill the right column."}
      </div>
    );
  }

  const altText = media.alt || altFallback || "Illustration";

  return (
    <div className={MEDIA_WRAPPER_CLASS}>
      <Image
        src={image.url}
        alt={altText}
        fill
        className="h-full w-full object-cover"
        sizes={FORM_MEDIA_IMAGE_SIZES}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
