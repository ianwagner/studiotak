import groq from "groq";

import { blocksProjection } from "@/lib/sanity/fragments";
import { hasSanityClient, requireSanityClient } from "@/lib/sanity/config";
import { appendDefaultFooter, resolveDocumentBlocks } from "@/lib/sanity/pageViews";
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
  if (!result) {
    return null;
  }

  const rawBlocks = (result as { blocks?: unknown }).blocks as Parameters<typeof resolveDocumentBlocks>[0];
  const blocks = await resolveDocumentBlocks(rawBlocks);
  const blocksWithFooter = await appendDefaultFooter(blocks);

  return {
    ...result,
    blocks: blocksWithFooter,
  };
}
