import Link from "next/link";
import type { CSSProperties } from "react";

import { buildProductHref, selectProductAsset } from "@/lib/products";
import type { BlockTheme } from "@/lib/sanity/types";
import type { SiteProduct } from "@/lib/sanity/siteSettings";

function joinClassNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

type PoweredByBadgeProps = {
  product: SiteProduct;
  theme: BlockTheme;
  className?: string;
};

export function PoweredByBadge({ product, theme, className }: PoweredByBadgeProps) {
  const href = buildProductHref(product);
  const badgeText = product.badgeText?.trim() || `Powered by ${product.name}`;
  const compactMark = selectProductAsset(product, theme, "compact");
  const accentColor = product.productColor ?? undefined;

  const style: CSSProperties = accentColor
    ? {
        borderColor: accentColor,
      }
    : {};

  const baseClasses = "inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-foreground/5";

  return (
    <Link href={href} className={joinClassNames(baseClasses, className)} style={style}>
      {compactMark ? (
        <img
          src={compactMark.url}
          alt=""
          aria-hidden="true"
          width={typeof compactMark.width === "number" ? compactMark.width : undefined}
          height={typeof compactMark.height === "number" ? compactMark.height : undefined}
          className="h-4 w-auto"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span>{badgeText}</span>
    </Link>
  );
}
