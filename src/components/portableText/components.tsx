import Link from "next/link";
import type { PortableTextComponents } from "@portabletext/react";

import { gmColors, gmSpacing } from "@/styles/designTokens";
import { typographyMap } from "@/styles/typography";

type LinkMarkValue = {
  href?: string;
  blank?: boolean;
  slug?: string | { current?: string };
  reference?: {
    slug?: { current?: string };
  };
};

const getHrefFromValue = (value: LinkMarkValue | undefined): string | null => {
  if (!value) return null;
  if (value.href) return value.href;

  const slugSource = value.slug ?? value.reference?.slug;

  const slug =
    typeof slugSource === "string" ? slugSource : slugSource?.current;

  if (slug) {
    return slug.startsWith("/") ? slug : `/${slug}`;
  }

  return null;
};

export const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p
        className={[
          typographyMap.body.base,
          typographyMap.flow.relaxed,
          gmColors["gm-color-text-strong"],
        ].join(" ")}
      >
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <h2
        className={[
          typographyMap.headings.h2,
          gmColors["gm-color-text-primary"],
        ].join(" ")}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        className={[
          typographyMap.headings.h3,
          gmColors["gm-color-text-primary"],
        ].join(" ")}
      >
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={[
          gmSpacing["gm-spacing-border-accent"],
          gmColors["gm-color-border-strong"],
          gmSpacing["gm-spacing-indent"],
          typographyMap.body.lead,
          typographyMap.emphasis.italic,
          gmColors["gm-color-text-secondary"],
        ].join(" ")}
      >
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className={typographyMap.emphasis.strong}>{children}</strong>
    ),
    em: ({ children }) => (
      <em className={typographyMap.emphasis.italic}>{children}</em>
    ),
    link: ({ value, children }) => {
      const href = getHrefFromValue(value as LinkMarkValue);
      if (!href) {
        return (
          <span className={typographyMap.link.unresolved}>
            {children}
          </span>
        );
      }

      const isExternal = href.startsWith("http");
      const rel = isExternal ? "noopener noreferrer" : undefined;
      const target = value && "blank" in value && value.blank ? "_blank" : undefined;

      if (isExternal) {
        return (
          <a
            href={href}
            rel={rel}
            target={target ?? "_blank"}
            className={typographyMap.link.inline}
          >
            {children}
          </a>
        );
      }

      return (
        <Link
          href={href}
          className={typographyMap.link.inline}
        >
          {children}
        </Link>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul
        className={[
          "list-disc",
          gmSpacing["gm-spacing-tight-stack"],
          gmSpacing["gm-spacing-indent"],
          typographyMap.body.base,
          gmColors["gm-color-text-strong"],
        ].join(" ")}
      >
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol
        className={[
          "list-decimal",
          gmSpacing["gm-spacing-tight-stack"],
          gmSpacing["gm-spacing-indent"],
          typographyMap.body.base,
          gmColors["gm-color-text-strong"],
        ].join(" ")}
      >
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
};
