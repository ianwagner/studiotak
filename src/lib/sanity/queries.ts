import groq from "groq";

import { blocksProjection } from "@/lib/sanity/fragments";
import { hasSanityClient, requireSanityClient } from "@/lib/sanity/config";
import type { BlocksDocument } from "@/lib/sanity/types";

export const homeQuery = groq`
  *[_type == "home"][0]{
    ${blocksProjection}
  }
`;

export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0]{
    title,
    ${blocksProjection}
  }
`;

const EMPTY_RESULT: BlocksDocument = { blocks: [] };

export async function fetchHomePage(): Promise<BlocksDocument> {
  if (!hasSanityClient()) {
    return EMPTY_RESULT;
  }

  const result = await requireSanityClient().fetch<BlocksDocument | null>(homeQuery);
  return result ?? EMPTY_RESULT;
}

export async function fetchPageBySlug(slug: string): Promise<BlocksDocument | null> {
  if (!hasSanityClient()) {
    return EMPTY_RESULT;
  }

  const result = await requireSanityClient().fetch<BlocksDocument | null>(pageBySlugQuery, { slug });
  return result;
}
