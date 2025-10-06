import { BlockRenderer } from "@/components/blocks";
import { getHomepage } from "@/lib/sanity/pageViews";

export const revalidate = 120;

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const rawPage = searchParams?.page;
  const pageParam = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : undefined;
  const page = Number.isFinite(parsedPage) && (parsedPage ?? 0) > 0 ? parsedPage : undefined;

  const data = await getHomepage({ page });

  return <BlockRenderer blocks={data.blocks} />;
}
