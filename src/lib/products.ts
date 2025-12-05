import type { BlockTheme } from "@/lib/sanity/types";
import type { SiteAsset, SiteProduct } from "@/lib/sanity/siteSettings";

type ProductAssetVariant = "wordmark" | "compact";

export function sanitizeProductSlug(slug: string): string {
  return slug.replace(/^\/+/, "").trim();
}

export function buildProductHref(product: SiteProduct): string {
  const cleaned = sanitizeProductSlug(product.slug);
  if (!cleaned) {
    return "#";
  }

  return `/${cleaned}`;
}

export function selectProductAsset(
  product: SiteProduct,
  theme: BlockTheme,
  variant: ProductAssetVariant,
): SiteAsset | null {
  const isDarkTheme = theme === "dark";
  const prefersLight = !isDarkTheme;

  if (variant === "wordmark") {
    const primary = prefersLight ? product.logos.light : product.logos.dark;
    const fallback = prefersLight ? product.logos.dark : product.logos.light;
    return primary ?? fallback ?? null;
  }

  const primaryCompact = prefersLight ? product.logos.compactLight : product.logos.compactDark;
  const fallbackCompact = prefersLight ? product.logos.compactDark : product.logos.compactLight;

  return primaryCompact ?? fallbackCompact ?? selectProductAsset(product, theme, "wordmark");
}

export function isProductNavigable(product: SiteProduct): boolean {
  return typeof product.slug === "string" && sanitizeProductSlug(product.slug).length > 0;
}
