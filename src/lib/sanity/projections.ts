import groq from "groq";

export const taxonomyProjection = groq`
  _id,
  label,
  description,
  icon,
  "slug": slug.current,
`;

export const contentProjection = groq`
  _id,
  _type,
  title,
  "status": status,
  "industries": industries[]->{${taxonomyProjection}},
  "personas": personas[]->{${taxonomyProjection}},
  "contentType": contentType->{${taxonomyProjection}},
  "imageUrl": select(
    defined(media.asset) => media.asset->url,
    null
  ),
  "imageAlt": select(
    defined(media.alt) => media.alt,
    null
  ),
  "mediaDisplay": coalesce(mediaDisplay, "image"),
  _createdAt,
  "body": select(
    _type == "feature" => body,
    null
  ),
`;

export const setProjection = groq`
  _id,
  _type,
  title,
  description,
  "items": select(
    _type == "curatedSet" => items[@->status == "approved"]->{${contentProjection}}
  ),
  "limit": select(_type == "dynamicSet" => limit),
  "sortOrder": select(_type == "dynamicSet" => sortOrder),
  "fallbackMode": select(_type == "dynamicSet" => fallbackMode),
  "filters": select(
    _type == "dynamicSet" => {
      "industries": filters.industries[]->_id,
      "personas": filters.personas[]->_id,
      "contentTypes": filters.contentTypes[]->_id,
    }
  ),
  "pins": select(
    _type == "dynamicSet" => pins[@->status == "approved"]->{${contentProjection}}
  ),
  "updatedAt": select(_type == "dynamicSet" => _updatedAt),
  "revision": select(_type == "dynamicSet" => _rev),
`;

