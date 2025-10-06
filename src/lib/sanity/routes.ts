import groq from "groq";

import type { RouteReference } from "@/lib/routes";
import { hasSanityClient, requireSanityClient } from "@/lib/sanity/config";

const routeResolutionQuery = groq`
  {
    "route": *[_type == "route" && product == $product && path == $path][0]{
      product,
      path,
      target->{
        _id,
        _type,
        "slug": slug.current
      }
    },
    "redirect": *[_type == "redirect" && product == $product && from == $path][0]{
      "to": to->{
        product,
        path
      }
    }
  }
`;

type RouteTargetDocument = {
  _id?: string;
  _type?: string;
  slug?: string | null;
};

type RouteDocument = {
  product?: string | null;
  path?: string | null;
  target?: RouteTargetDocument | null;
};

type RedirectDocument = {
  to?: RouteReference | null;
};

type RouteResolutionQueryResult = {
  route?: RouteDocument | null;
  redirect?: RedirectDocument | null;
};

export type RouteTarget = {
  id: string;
  type: "industryPage" | "personaPage";
  slug: string;
};

export type RouteRecord = {
  product: string;
  path: string;
  target: RouteTarget | null;
};

export type RouteResolution = {
  route: RouteRecord | null;
  redirect: RouteReference | null;
};

function normalizeRouteTarget(target: RouteTargetDocument | null | undefined): RouteTarget | null {
  if (!target?._id) {
    return null;
  }

  if (target._type !== "industryPage" && target._type !== "personaPage") {
    return null;
  }

  const slug = target.slug?.trim();
  if (!slug) {
    return null;
  }

  return {
    id: target._id,
    type: target._type,
    slug,
  };
}

function normalizeRouteDocument(doc: RouteDocument | null | undefined): RouteRecord | null {
  if (!doc?.product || !doc?.path) {
    return null;
  }

  return {
    product: doc.product,
    path: doc.path,
    target: normalizeRouteTarget(doc.target),
  };
}

function normalizeRedirect(doc: RedirectDocument | null | undefined): RouteReference | null {
  const route = doc?.to;
  if (!route?.path) {
    return null;
  }

  return {
    product: route.product ?? null,
    path: route.path,
  };
}

export async function resolveRoute({
  product,
  path,
}: {
  product: string;
  path: string;
}): Promise<RouteResolution | null> {
  if (!hasSanityClient()) {
    return null;
  }

  const client = requireSanityClient();
  const result = await client.fetch<RouteResolutionQueryResult | null>(routeResolutionQuery, { product, path });

  if (!result) {
    return { route: null, redirect: null };
  }

  return {
    route: normalizeRouteDocument(result.route),
    redirect: normalizeRedirect(result.redirect),
  };
}
