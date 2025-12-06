import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/blocks";
import { fetchPageBySlug } from "@/lib/sanity/queries";

export const revalidate = 60;

type PageParams = { slug: string };

export default async function GenericPage({ params }: { params: PageParams }) {
  const { slug } = params;

  const data = await fetchPageBySlug(slug);

  if (!data) {
    notFound();
  }

  return <BlockRenderer blocks={data.blocks} />;
}
