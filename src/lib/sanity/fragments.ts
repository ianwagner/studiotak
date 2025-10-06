import groq from "groq";

export const blocksProjection = groq`
  blocks[]{
    _type,
    _key,
    ...,
    markDefs[]{
      ...,
      _type == "link" => {
        ...,
        "route": route->{
          _id,
          product,
          path
        }
      }
    }
  }
`;
