import groq from "groq";

export const blocksProjection = groq`
  blocks[]{
    _type,
    _key,
    ...
  }
`;
