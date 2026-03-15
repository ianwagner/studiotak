const WEBP_MIME_TYPE = "image/webp";
const DEFAULT_WEBP_QUALITY = 0.82;
const CONVERTIBLE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/bmp"]);

type PrepareUploadOptions = {
  preserveOriginalFormat?: boolean;
  quality?: number;
};

const replaceFileExtension = (name: string, nextExtension: string) => {
  const trimmed = name.trim();
  if (!trimmed) return `upload${nextExtension}`;
  return /\.[^.]+$/.test(trimmed) ? trimmed.replace(/\.[^.]+$/, nextExtension) : `${trimmed}${nextExtension}`;
};

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be decoded"));
    image.src = source;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

const readFileAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() ?? "");
    reader.onerror = () => reject(new Error("File could not be read"));
    reader.readAsDataURL(file);
  });

const shouldConvertToWebp = (file: File, options: PrepareUploadOptions) =>
  !options.preserveOriginalFormat && CONVERTIBLE_MIME_TYPES.has(file.type);

export async function prepareImageFileForUpload(file: File, options: PrepareUploadOptions = {}): Promise<File> {
  if (typeof window === "undefined" || !shouldConvertToWebp(file, options)) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (!width || !height) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, WEBP_MIME_TYPE, options.quality ?? DEFAULT_WEBP_QUALITY);
    if (!blob || blob.size === 0 || blob.size >= file.size) {
      return file;
    }

    return new File([blob], replaceFileExtension(file.name, ".webp"), {
      type: WEBP_MIME_TYPE,
      lastModified: file.lastModified
    });
  } catch (error) {
    console.error("Failed to convert image to WebP before upload", error);
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareImageDataUrl(file: File, options: PrepareUploadOptions = {}): Promise<string> {
  const preparedFile = await prepareImageFileForUpload(file, options);
  return readFileAsDataUrl(preparedFile);
}
