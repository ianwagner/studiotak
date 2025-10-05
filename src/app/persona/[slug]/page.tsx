import { notFound } from "next/navigation";

import { PageView } from "@/components/pageViews/PageView";
import { fetchPersonaPageView } from "@/lib/sanity/pageViews";

export const revalidate = 60;

type PageParams = {
  slug: string;
};

type PersonaPageSearchParams = {
  industry?: string;
  page?: string;
};

type PageProps = {
  params: PageParams | Promise<PageParams>;
  searchParams?: PersonaPageSearchParams | Promise<PersonaPageSearchParams>;
};

export default async function PersonaPage({ params, searchParams }: PageProps) {
  const { slug } = await Promise.resolve(params);
  const resolvedSearch = (await Promise.resolve(searchParams)) ?? {};
  const parsedPage = resolvedSearch.page ? Number.parseInt(resolvedSearch.page, 10) : undefined;
  const page = typeof parsedPage === "number" && Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : undefined;

  const view = await fetchPersonaPageView({ slug, industrySlug: resolvedSearch.industry, page });

  if (!view) {
    notFound();
  }

  return <PageView data={view} />;
}
