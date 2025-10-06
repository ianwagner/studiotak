import imageUrlBuilder from "@sanity/image-url";
import type { FitMode, SanityImageSource } from "@sanity/image-url/lib/types/types";

import { sanityConfig } from "./config";

const hasProjectDetails = Boolean(sanityConfig.projectId && sanityConfig.dataset);

const builder = hasProjectDetails
  ? imageUrlBuilder({
      projectId: sanityConfig.projectId!,
      dataset: sanityConfig.dataset!,
    })
  : null;

const DIMENSIONS_REGEX = /-(\d+)x(\d+)-/;

type AssetLike = {
  _ref?: string;
  _id?: string;
};

type ImageLike = {
  asset?: AssetLike | string;
  _ref?: string;
  _id?: string;
};

const DEFAULT_ASPECT_RATIO = 16 / 9;

function extractAssetRef(source: SanityImageSource | ImageLike | null | undefined): string | null {
  if (!source) {
    return null;
  }

  if (typeof source === "string") {
    return source;
  }

  if ("asset" in source) {
    const asset = source.asset;
    if (!asset) {
      return null;
    }

    if (typeof asset === "string") {
      return asset;
    }

    return asset._ref ?? asset._id ?? null;
  }

  if ("_ref" in source && typeof source._ref === "string") {
    return source._ref;
  }

  if ("_id" in source && typeof source._id === "string") {
    return source._id;
  }

  return null;
}

export type SanityImageDimensions = {
  width: number;
  height: number;
  aspectRatio: number;
};

export function getSanityImageDimensions(
  source: SanityImageSource | ImageLike | null | undefined,
): SanityImageDimensions | null {
  const ref = extractAssetRef(source);

  if (!ref) {
    return null;
  }

  const match = ref.match(DIMENSIONS_REGEX);

  if (!match) {
    return null;
  }

  const [, widthString, heightString] = match;
  const width = Number.parseInt(widthString, 10);
  const height = Number.parseInt(heightString, 10);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return {
    width,
    height,
    aspectRatio: width / height,
  };
}

type BuildSanityImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
  fit?: FitMode;
  dpr?: number;
};

export type BuiltSanityImage = {
  url: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
};

export function buildSanityImage(
  source: SanityImageSource | ImageLike | null | undefined,
  options: BuildSanityImageOptions = {},
): BuiltSanityImage | null {
  if (!builder || !source) {
    return null;
  }

  const dimensions = getSanityImageDimensions(source);

  let width = options.width ?? dimensions?.width;
  let height = options.height ?? dimensions?.height;

  if (!width && height && dimensions?.width && dimensions.height) {
    width = Math.round(dimensions.width * (height / dimensions.height));
  }

  if (!height && width && dimensions?.width && dimensions.height) {
    height = Math.round(dimensions.height * (width / dimensions.width));
  }

  if (!width && !height && dimensions) {
    width = dimensions.width;
    height = dimensions.height;
  }

  const aspectRatio = width && height ? width / height : dimensions?.aspectRatio ?? DEFAULT_ASPECT_RATIO;

  let image = builder.image(source).auto("format");

  if (options.fit) {
    image = image.fit(options.fit);
  } else {
    image = image.fit("crop");
  }

  if (options.quality) {
    image = image.quality(options.quality);
  }

  if (options.dpr) {
    image = image.dpr(options.dpr);
  }

  if (width && height) {
    image = image.size(width, height);
  } else if (width) {
    image = image.width(width);
  }

  const url = image.url();

  return {
    url,
    width: width ?? undefined,
    height: height ?? undefined,
    aspectRatio,
  };
}
