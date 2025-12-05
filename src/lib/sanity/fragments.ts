import groq from "groq";

import { setProjection } from "./projections";

const SHARED_BLOCK_MAX_DEPTH = 3;

const MARK_DEFS_SELECTION = `
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
}`.trim();

const SET_BLOCK_SELECTION = groq`
_type == "setBlock" => {
  set->{${setProjection}},
  "fallbackSet": fallbackSet->{${setProjection}}
}`.trim();

const DISPLAY_BLOCK_SELECTION = groq`
_type == "displayBlock" => {
  set->{${setProjection}},
  "fallbackSet": fallbackSet->{${setProjection}}
}`.trim();

const SPLIT_BLOCK_DISPLAY_SELECTION = groq`
_type == "splitBlock" => {
  display{
    ...,
    set->{${setProjection}},
    "fallbackSet": fallbackSet->{${setProjection}}
  }
}`.trim();

const FORM_BLOCK_SELECTION = groq`
_type == "formBlock" => {
  form->{
    _id,
    title,
    hubspotFormId,
    portalIdOverride,
    regionOverride,
    successMessage,
    notes
  },
  "portalId": coalesce(form->portalIdOverride, *[_type == "siteSettings"][0].hubspotPortalId),
  "region": coalesce(form->regionOverride, *[_type == "siteSettings"][0].hubspotRegion, "na1")
}`.trim();

function buildBlockSelections(depth: number): string {
  const selections = [
    "_type",
    "_key",
    "...",
    MARK_DEFS_SELECTION,
    SET_BLOCK_SELECTION,
    DISPLAY_BLOCK_SELECTION,
    SPLIT_BLOCK_DISPLAY_SELECTION,
    FORM_BLOCK_SELECTION,
  ];

  if (depth > 0) {
    selections.push(
      groq`
_type == "sharedBlockReference" => {
  sharedBlock->{
    _id,
    internalTitle,
    description,
    blocks[]{
      ${buildBlockSelections(depth - 1)}
    }
  }
}`.trim(),
    );
  }

  return selections.join(",\n");
}

export const blocksProjection = groq`
  blocks[]{
    ${buildBlockSelections(SHARED_BLOCK_MAX_DEPTH)}
  }
`;
