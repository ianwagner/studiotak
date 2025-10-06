"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type {
  AnchorHTMLAttributes,
  CSSProperties,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import Link from "next/link";

import { Section } from "@/components/Section";
import type { NavigationData, NavigationItem } from "@/lib/sanity/navigation";
import type { BlockDensity } from "@/lib/sanity/types";
import type { SiteLogoSet, SiteSettings } from "@/lib/sanity/siteSettings";
import { resolveSpacingToken, resolveTypographyToken } from "@/components/blocks/tokenUtils";
import { gmColors } from "@/styles/designTokens";
import { buttonClassList } from "@/styles/buttons";

const focusRingClass = "focus-ring-token";
const DEFAULT_ITEM_SPACING_TOKEN = "gm-spacing-shell-stack";

const HORIZONTAL_GAP_BY_STACK_CLASS: Record<string, string> = {
  "space-y-12": "md:gap-x-12",
  "space-y-8": "md:gap-x-8",
  "space-y-6": "md:gap-x-6",
  "space-y-5": "md:gap-x-5",
  "space-y-4": "md:gap-x-4",
  "space-y-3": "md:gap-x-3",
  "space-y-2": "md:gap-x-2",
  "space-y-1": "md:gap-x-1",
  "space-y-0": "md:gap-x-0",
};

type HeaderProps = {
  navigation: NavigationData;
  siteSettings: SiteSettings;
  className?: string;
};

type FocusStyle = CSSProperties & { "--focus-ring-color"?: string };

type DropdownHandler = (event: ReactKeyboardEvent<HTMLAnchorElement>, index: number, total: number) => void;

const FALLBACK_FOCUS_COLOR = "var(--color-accent)";

function joinClassNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function toHorizontalGapVariant(stackClass: string | null): string | null {
  if (!stackClass) {
    return null;
  }

  return HORIZONTAL_GAP_BY_STACK_CLASS[stackClass] ?? null;
}

function resolveColorToken(token: string | undefined | null, fallback: keyof typeof gmColors): string {
  if (token && token in gmColors) {
    return gmColors[token as keyof typeof gmColors];
  }

  return gmColors[fallback];
}

function resolveHoverClass(token: string | undefined | null): string | null {
  if (token && token in gmColors) {
    return gmColors[token as keyof typeof gmColors];
  }

  return null;
}

function resolveFocusColor(token: string | undefined | null): string {
  switch (token) {
    case "gm-color-border-strong":
      return "color-mix(in srgb, var(--color-foreground) 20%, transparent)";
    case "gm-color-border-accent":
      return "var(--color-accent)";
    default:
      return FALLBACK_FOCUS_COLOR;
  }
}

function toDimensionAttribute(value: number | null): number | undefined {
  if (typeof value !== "number") {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(Math.round(value), 0);
}

type BrandLinkProps = {
  logos: SiteLogoSet;
  focusStyle: FocusStyle;
  textColorClass: string;
};

const LOGO_IMAGE_CLASS = "h-auto w-auto max-h-12";

function BrandLink({ logos, focusStyle, textColorClass }: BrandLinkProps) {
  const { primary, markOnly, rasterFallbacks, alt, minHeight } = logos;
  const hasPrimary = Boolean(primary);
  const hasMarkOnly = Boolean(markOnly);

  const minHeightStyle: CSSProperties | undefined = minHeight ? { minHeight: `${minHeight}px` } : undefined;

  const primaryPictureClass = joinClassNames("block", hasMarkOnly ? "hidden md:block" : "block");
  const markOnlyPictureClass = joinClassNames("block", hasPrimary ? "md:hidden" : "block");

  const fallbackSources = hasPrimary
    ? rasterFallbacks.map((fallback, index) => (
        <source
          key={`${fallback.url}-${index}`}
          srcSet={fallback.url}
          type={fallback.mimeType ?? undefined}
        />
      ))
    : null;

  return (
    <Link
      href="/"
      className={joinClassNames(
        focusRingClass,
        "inline-flex items-center gap-3 text-lg font-semibold tracking-tight",
        textColorClass,
      )}
      style={focusStyle}
    >
      {hasPrimary ? (
        <picture className={primaryPictureClass}>
          <source srcSet={primary!.url} type={primary!.mimeType ?? undefined} />
          {fallbackSources}
          <img
            src={primary!.url}
            alt={alt}
            width={toDimensionAttribute(primary!.width)}
            height={toDimensionAttribute(primary!.height)}
            className={LOGO_IMAGE_CLASS}
            style={minHeightStyle}
            loading="eager"
            decoding="async"
          />
        </picture>
      ) : null}
      {hasMarkOnly ? (
        <picture className={markOnlyPictureClass}>
          <source srcSet={markOnly!.url} type={markOnly!.mimeType ?? undefined} />
          <img
            src={markOnly!.url}
            alt={hasPrimary ? "" : alt}
            aria-hidden={hasPrimary ? "true" : undefined}
            width={toDimensionAttribute(markOnly!.width)}
            height={toDimensionAttribute(markOnly!.height)}
            className={LOGO_IMAGE_CLASS}
            style={minHeightStyle}
            loading="lazy"
            decoding="async"
          />
        </picture>
      ) : null}
      {!hasPrimary && !hasMarkOnly ? <span>{alt}</span> : null}
    </Link>
  );
}

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

type NavigationLinkProps = {
  item: NavigationItem;
  className: string;
  focusStyle: FocusStyle;
  role?: string;
  dataDropdownIndex?: number;
  onKeyDown?: ReactKeyboardEventHandler;
  children?: ReactNode;
  dataDropdownTrigger?: boolean;
} & Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "aria-expanded" | "aria-haspopup" | "aria-controls" | "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur"
>;

type ReactKeyboardEventHandler = (event: ReactKeyboardEvent<HTMLAnchorElement>) => void;

const NavigationLink = ({
  item,
  className,
  focusStyle,
  role,
  dataDropdownIndex,
  onKeyDown,
  children,
  "aria-controls": ariaControls,
  "aria-expanded": ariaExpanded,
  "aria-haspopup": ariaHaspopup,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  dataDropdownTrigger,
}: NavigationLinkProps) => {
  const { href, label, isExternal, audience, icon } = item;
  const external = isExternal || isExternalHref(href);

  return (
    <Link
      href={href || "#"}
      className={className}
      data-audience={audience ?? undefined}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      style={focusStyle}
      role={role}
      data-dropdown-item={dataDropdownIndex ?? undefined}
      onKeyDown={onKeyDown}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      data-dropdown-trigger={dataDropdownTrigger ? "true" : undefined}
    >
      {icon ? (
        <span aria-hidden className="mr-2 text-sm">
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
      {children}
      {external ? (
        <span aria-hidden className="ml-1 text-xs">
          ↗
        </span>
      ) : null}
    </Link>
  );
};

function createFocusStyle(color: string): FocusStyle {
  return {
    "--focus-ring-color": color || FALLBACK_FOCUS_COLOR,
  } as FocusStyle;
}

function createLinkClasses(
  typographyClass: string,
  textColorClass: string,
  hoverClass: string | null,
  density: BlockDensity,
): string {
  const paddingClass = density === "compact" ? "px-2 py-1.5" : "px-3 py-2";

  return joinClassNames(
    "inline-flex items-center rounded-md transition-colors",
    paddingClass,
    typographyClass,
    textColorClass,
    hoverClass,
    focusRingClass,
  );
}

type DropdownItemProps = {
  item: NavigationItem;
  triggerClassName: string;
  linkClassName: string;
  dropdownSpacingClass: string | null;
  focusStyle: FocusStyle;
  density: BlockDensity;
};

function DropdownItem({
  item,
  triggerClassName,
  linkClassName,
  dropdownSpacingClass,
  focusStyle,
  density,
}: DropdownItemProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLLIElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = `${item.id}-menu`;
  const itemCount = item.children.length;

  const focusTrigger = () => {
    const trigger = containerRef.current?.querySelector<HTMLAnchorElement>(
      "[data-dropdown-trigger=\"true\"]",
    );
    trigger?.focus();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        focusTrigger();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  useEffect(() => () => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
    }
  }, []);

  const focusChild = (index: number) => {
    if (!containerRef.current) {
      return;
    }

    const target = containerRef.current.querySelector<HTMLAnchorElement>(
      `[data-dropdown-item="${index}"]`,
    );

    target?.focus();
  };

  const handleButtonKeyDown = (event: ReactKeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusChild(0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusChild(itemCount - 1));
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      focusTrigger();
    }
  };

  const handleChildKeyDown: DropdownHandler = (event, index, total) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (index + 1) % total;
      focusChild(nextIndex);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = (index - 1 + total) % total;
      focusChild(nextIndex);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      focusTrigger();
    }
  };

  const handleBlur = (event: ReactFocusEvent<HTMLLIElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && containerRef.current?.contains(nextTarget)) {
      return;
    }

    setOpen(false);
  };

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCloseTimeout();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, 120);
  };

  const toggleOpen = () => {
    clearCloseTimeout();
    setOpen((value) => !value);
  };

  const dropdownPadding = density === "compact" ? "p-3" : "p-4";
  const menuVisibility = open ? "flex" : "hidden";
  const desktopVisibility = open ? "md:flex" : "md:hidden";

  const menuClassName = joinClassNames(
    menuVisibility,
    desktopVisibility,
    "flex-col",
    dropdownSpacingClass,
    dropdownPadding,
    "rounded-lg border border-foreground/10 bg-background shadow-lg",
    "md:absolute md:left-0 md:top-full md:z-30 md:min-w-[240px] md:mt-2",
    "mt-2",
  );

  return (
    <li
      ref={containerRef}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
      role="none"
    >
      <div className="flex w-full items-center">
        <NavigationLink
          item={item}
          className={joinClassNames(triggerClassName, "flex-1 gap-1")}
          focusStyle={focusStyle}
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onKeyDown={handleButtonKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          dataDropdownTrigger
        >
          <span aria-hidden className="ml-1 hidden text-xs md:inline">▾</span>
        </NavigationLink>
        <button
          type="button"
          className={joinClassNames(
            "ml-2 inline-flex items-center justify-center rounded-md border border-foreground/10 p-2 text-xs md:hidden",
            focusRingClass,
          )}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          onClick={toggleOpen}
          onFocus={handleMouseEnter}
          style={focusStyle}
        >
          <span aria-hidden>▾</span>
          <span className="sr-only">Toggle submenu for {item.label}</span>
        </button>
      </div>
      <div
        id={menuId}
        role="menu"
        aria-hidden={!open}
        className={menuClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {item.children.map((child, index) => (
          <NavigationLink
            key={child.id}
            item={child}
            className={joinClassNames(linkClassName, "w-full justify-start")}
            focusStyle={focusStyle}
            role="menuitem"
            dataDropdownIndex={index}
            onKeyDown={(event) => handleChildKeyDown(event, index, itemCount)}
          />
        ))}
      </div>
    </li>
  );
}

function renderNavigationLink(
  item: NavigationItem,
  linkClassName: string,
  focusStyle: FocusStyle,
  hoverClass: string | null,
  typographyClass: string,
): ReactNode {
  if (item.isCta) {
    const baseCtaClasses = buttonClassList.primary.filter((className) => !className.startsWith("hover:"));
    const fallbackHover = gmColors["gm-color-hover-surface-accent"];
    const ctaClasses = joinClassNames(
      ...baseCtaClasses,
      focusRingClass,
      hoverClass ?? fallbackHover,
      typographyClass,
    );

    return <NavigationLink item={item} className={ctaClasses} focusStyle={focusStyle} role="menuitem" />;
  }

  if (item.children.length > 0) {
    return null;
  }

  return <NavigationLink item={item} className={linkClassName} focusStyle={focusStyle} role="menuitem" />;
}

export function Header({ navigation, siteSettings, className }: HeaderProps) {
  const {
    anchor,
    items,
    layout,
    theme,
    density,
    itemSpacingToken,
    typographyToken,
    linkColorToken,
    hoverStateToken,
    focusRingToken,
  } = navigation;

  const typographyClass = useMemo(
    () => resolveTypographyToken(typographyToken, "gm-typography-body-sm", "Navigation link"),
    [typographyToken],
  );

  const textColorClass = useMemo(
    () => resolveColorToken(linkColorToken, "gm-color-text-primary"),
    [linkColorToken],
  );

  const hoverClass = useMemo(() => resolveHoverClass(hoverStateToken), [hoverStateToken]);
  const focusColor = useMemo(() => resolveFocusColor(focusRingToken), [focusRingToken]);
  const focusStyle = useMemo(() => createFocusStyle(focusColor), [focusColor]);

  const spacingClass = useMemo(
    () => resolveSpacingToken(itemSpacingToken, DEFAULT_ITEM_SPACING_TOKEN, density, "Navigation items"),
    [itemSpacingToken, density],
  );

  const dropdownSpacingClass = useMemo(
    () => resolveSpacingToken(itemSpacingToken, DEFAULT_ITEM_SPACING_TOKEN, density, "Navigation dropdown"),
    [itemSpacingToken, density],
  );

  const horizontalGapClass = useMemo(() => toHorizontalGapVariant(spacingClass), [spacingClass]);
  const listClassName = useMemo(
    () =>
      joinClassNames(
        "flex flex-col md:flex-row md:items-center",
        spacingClass,
        "md:space-y-0",
        horizontalGapClass,
      ),
    [spacingClass, horizontalGapClass],
  );

  const linkClassName = useMemo(
    () => createLinkClasses(typographyClass, textColorClass, hoverClass, density),
    [typographyClass, textColorClass, hoverClass, density],
  );

  const triggerClassName = useMemo(
    () => joinClassNames(linkClassName, "cursor-pointer select-none"),
    [linkClassName],
  );

  const navDataAttributes = useMemo(
    () => ({
      "data-theme": theme,
      "data-density": density,
      "data-typography-token": typographyToken,
      "data-spacing-token": itemSpacingToken,
      "data-link-color-token": linkColorToken,
      "data-hover-token": hoverStateToken,
      "data-focus-token": focusRingToken,
    }),
    [theme, density, typographyToken, itemSpacingToken, linkColorToken, hoverStateToken, focusRingToken],
  );

  const navPadding = density === "compact" ? "py-3" : "py-4";

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Section as="header" theme={theme} layout={layout} className={joinClassNames("py-0", className)}>
      <nav
        id={anchor ?? undefined}
        aria-label="Primary navigation"
        className={joinClassNames("w-full", navPadding)}
        {...navDataAttributes}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <BrandLink
            logos={siteSettings.logos}
            focusStyle={focusStyle}
            textColorClass={textColorClass}
          />
          <ul className={listClassName} role="menubar">
            {items.map((item) => {
              if (item.children.length > 0 && !item.isCta) {
                return (
                  <DropdownItem
                    key={item.id}
                    item={item}
                    triggerClassName={triggerClassName}
                    linkClassName={linkClassName}
                    dropdownSpacingClass={dropdownSpacingClass}
                    focusStyle={focusStyle}
                    density={density}
                  />
                );
              }

              return (
                <li key={item.id} role="none">
                  {renderNavigationLink(item, linkClassName, focusStyle, hoverClass, typographyClass)}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </Section>
  );
}
