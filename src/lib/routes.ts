export type RouteReference = {
  product?: string | null;
  path?: string | null;
};

function normalizeRoutePath(value: string | null | undefined, product: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const cleaned = trimmed.replace(/^\/+/g, "").replace(/\/+/g, "/");

  if (product !== "campfire" && (cleaned === "home" || cleaned === "index")) {
    return '';
  }

  return cleaned;
}

export function resolveRouteHref(route: RouteReference | null | undefined): string | null {
  if (!route) {
    return null;
  }

  const product = route.product ?? "marketing";
  const normalizedPath = normalizeRoutePath(route.path, product);

  if (normalizedPath === null) {
    return null;
  }

  if (product === "campfire") {
    return normalizedPath ? `/campfire/${normalizedPath}` : "/campfire";
  }

  return normalizedPath ? `/${normalizedPath}` : "/";
}
