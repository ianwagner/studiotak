import groq from "groq";

import { blocksProjection } from "@/lib/sanity/fragments";
import { hasSanityClient, requireSanityClient } from "@/lib/sanity/config";
import type { BlocksDocument } from "@/lib/sanity/types";

const EMPTY_RESULT: BlocksDocument = { blocks: [] };

export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0]{
    title,
    ${blocksProjection}
  }
`;

export async function fetchPageBySlug(slug: string): Promise<BlocksDocument | null> {
  if (!hasSanityClient()) {
    return EMPTY_RESULT;
  }

  const result = await requireSanityClient().fetch<BlocksDocument | null>(pageBySlugQuery, { slug });
  return result;
}
