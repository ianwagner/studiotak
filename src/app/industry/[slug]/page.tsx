import { notFound } from "next/navigation";

import { PageView } from "@/components/pageViews/PageView";
import { fetchIndustryPageView } from "@/lib/sanity/pageViews";

export const revalidate = 60;

type PageParams = {
  slug: string;
};

type IndustryPageSearchParams = {
  persona?: string;
  page?: string;
};

type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<IndustryPageSearchParams>;
};

export default async function IndustryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const parsedPage = resolvedSearch.page ? Number.parseInt(resolvedSearch.page, 10) : undefined;
  const page = typeof parsedPage === "number" && Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : undefined;

  const view = await fetchIndustryPageView({ slug, personaSlug: resolvedSearch.persona, page });

  if (!view) {
    notFound();
  }

  return <PageView data={view} />;
}
