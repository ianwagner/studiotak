import { notFound, redirect } from "next/navigation";

import { PageView } from "@/components/pageViews/PageView";
import { resolveRouteHref } from "@/lib/routes";
import { fetchIndustryPageView, fetchPersonaPageView } from "@/lib/sanity/pageViews";
import { resolveRoute } from "@/lib/sanity/routes";

export const revalidate = 60;

type PageParams = {
  path: string;
};

type CampfireSearchParams = {
  persona?: string;
  industry?: string;
  page?: string;
};

type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<CampfireSearchParams>;
};

function parsePageParam(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function CampfireRoutePage({ params, searchParams }: PageProps) {
  const { path } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const page = parsePageParam(resolvedSearch.page);

  const routeResolution = await resolveRoute({ product: "campfire", path });

  if (!routeResolution) {
    notFound();
  }

  const currentHref = resolveRouteHref({ product: "campfire", path }) ?? `/campfire/${path}`;
  const redirectRef = routeResolution.redirect;
  if (redirectRef) {
    const destination = resolveRouteHref(redirectRef);
    if (destination && destination !== currentHref) {
      redirect(destination);
    }
  }

  const route = routeResolution.route;
  if (!route || !route.target) {
    notFound();
  }

  if (route.target.type === "industryPage") {
    const view = await fetchIndustryPageView({
      slug: route.target.slug,
      personaSlug: resolvedSearch.persona,
      page,
    });

    if (!view) {
      notFound();
    }

    return <PageView data={view} />;
  }

  if (route.target.type === "personaPage") {
    const view = await fetchPersonaPageView({
      slug: route.target.slug,
      industrySlug: resolvedSearch.industry,
      page,
    });

    if (!view) {
      notFound();
    }

    return <PageView data={view} />;
  }

  notFound();
}
