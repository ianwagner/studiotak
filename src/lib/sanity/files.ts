import { sanityConfig } from "./config";

type SanityFileAsset = {
  _ref?: string;
  _id?: string;
  url?: string | null;
};

type SanityFileLike =
  | string
  | null
  | undefined
  | {
      asset?: SanityFileAsset | string | null;
      _ref?: string;
      _id?: string;
      url?: string | null;
    };

const FILE_REF_PREFIX = "file-";

function extractFileAssetRef(source: SanityFileLike): string | null {
  if (!source) {
    return null;
  }

  if (typeof source === "string") {
    return source;
  }

  if (typeof source.url === "string" && source.url.length > 0) {
    return source.url;
  }

  if (typeof source.asset === "string") {
    return source.asset;
  }

  if (source.asset && typeof source.asset === "object") {
    if (typeof source.asset.url === "string" && source.asset.url.length > 0) {
      return source.asset.url;
    }

    if (typeof source.asset._ref === "string" && source.asset._ref.length > 0) {
      return source.asset._ref;
    }

    if (typeof source.asset._id === "string" && source.asset._id.length > 0) {
      return source.asset._id;
    }
  }

  if (typeof source._ref === "string" && source._ref.length > 0) {
    return source._ref;
  }

  if (typeof source._id === "string" && source._id.length > 0) {
    return source._id;
  }

  return null;
}

function buildCdnUrlFromRef(ref: string): string | null {
  if (ref.startsWith("http://") || ref.startsWith("https://")) {
    return ref;
  }

  const projectId = sanityConfig.projectId;
  const dataset = sanityConfig.dataset;

  if (!projectId || !dataset) {
    return null;
  }

  const normalized = ref.startsWith(FILE_REF_PREFIX) ? ref.slice(FILE_REF_PREFIX.length) : ref;
  const separatorIndex = normalized.lastIndexOf("-");

  if (separatorIndex <= 0 || separatorIndex === normalized.length - 1) {
    return null;
  }

  const assetId = normalized.slice(0, separatorIndex);
  const extension = normalized.slice(separatorIndex + 1);

  if (!assetId || !extension) {
    return null;
  }

  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${assetId}.${extension}`;
}

export function buildSanityFileUrl(source: SanityFileLike): string | null {
  const ref = extractFileAssetRef(source);

  if (!ref) {
    return null;
  }

  return buildCdnUrlFromRef(ref);
}
