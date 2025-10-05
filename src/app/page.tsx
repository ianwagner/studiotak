import { BlockRenderer } from "@/components/blocks";
import { fetchHomePage } from "@/lib/sanity/queries";

export const revalidate = 60;

export default async function Home() {
  const data = await fetchHomePage();

  return <BlockRenderer blocks={data.blocks} />;
}
