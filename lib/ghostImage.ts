const DEFAULT_WIDTHS = [480, 720, 960, 1200, 1600];

const isGhostImageUrl = (url: URL) =>
  (url.hostname === "storage.ghost.io" || url.hostname.endsWith(".ghost.io")) &&
  url.pathname.includes("/content/images/");

export const getOptimizedGhostImageUrl = (source: string, width: number): string => {
  try {
    const url = new URL(source);
    if (!isGhostImageUrl(url)) return source;

    const [prefix, imagePath] = url.pathname.split("/content/images/");
    if (!imagePath) return source;

    url.pathname = `${prefix}/content/images/size/w${width}/format/webp/${imagePath}`;
    return url.toString();
  } catch {
    return source;
  }
};

export const getGhostImageSrcSet = (source: string, widths: number[] = DEFAULT_WIDTHS): string | undefined => {
  try {
    const url = new URL(source);
    if (!isGhostImageUrl(url)) return undefined;
    return widths.map((width) => `${getOptimizedGhostImageUrl(source, width)} ${width}w`).join(", ");
  } catch {
    return undefined;
  }
};
