import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/blocks";
import { fetchPageBySlug } from "@/lib/sanity/queries";

export const revalidate = 60;

type PageParams = { slug: string };

type PageProps = {
  params: PageParams | Promise<PageParams>;
};

export default async function GenericPage({ params }: PageProps) {
  const { slug } = await Promise.resolve(params);

  const data = await fetchPageBySlug(slug);

  if (!data) {
    notFound();
  }

  return <BlockRenderer blocks={data.blocks} />;
}
