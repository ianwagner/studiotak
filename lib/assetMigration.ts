import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, getMetadata, getStorage, ref, updateMetadata, uploadBytes } from "firebase/storage";
import {
  getPublicMediaUploadMetadata,
  prepareImageDataUrl,
  prepareImageFileForUpload,
  PUBLIC_MEDIA_CACHE_CONTROL
} from "./clientImageUpload";
import { ensureFirebaseDevAuth, getFirebaseApp } from "./firebaseClient";
import { localAuthBypassEnabled } from "./localAuthBypass";

const CONVERTIBLE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/bmp"]);
const STORAGE_COLLECTIONS = {
  media: "media",
  pages: "pages",
  components: "components",
  navigation: "navigation",
  siteSettings: "site-settings"
} as const;

type StorageCandidate = {
  fullPath: string;
  sampleUrl: string;
  preserveOriginal: boolean;
  urls: Set<string>;
};

type MigrationOptions = {
  onProgress?: (message: string) => void;
};

type DocumentUpdateCounts = {
  siteSettings: number;
  media: number;
  pages: number;
  components: number;
  navigation: number;
};

export type AssetMigrationSummary = {
  scannedStorageAssets: number;
  migratedStorageAssets: number;
  skippedStorageAssets: number;
  failedStorageAssets: number;
  cacheMetadataUpdated: number;
  cacheMetadataFailed: number;
  convertedNavigationIcons: number;
  updatedDocuments: DocumentUpdateCounts;
  failures: string[];
};

const replaceFileExtension = (value: string, nextExtension: string) =>
  /\.[^.]+$/.test(value) ? value.replace(/\.[^.]+$/, nextExtension) : `${value}${nextExtension}`;

const stripGsPrefix = (bucket: string) => bucket.replace(/^gs:\/\//, "").replace(/\/+$/, "");

const hasConvertibleExtension = (fullPath: string) => /\.(jpe?g|png|bmp)$/i.test(fullPath);

const fileNameFromPath = (fullPath: string) => fullPath.split("/").filter(Boolean).pop() ?? "upload";

const buildWebpPath = (fullPath: string) => replaceFileExtension(fullPath, ".webp");

const isConvertibleDataUrl = (value: string) => /^data:image\/(?:png|jpeg|bmp);/i.test(value);

const extractStoragePathFromUrl = (rawUrl: string, bucket: string): string | null => {
  if (!rawUrl) return null;
  const normalizedBucket = stripGsPrefix(bucket);
  if (!normalizedBucket) return null;

  if (rawUrl.startsWith(`gs://${normalizedBucket}/`)) {
    return decodeURIComponent(rawUrl.slice(`gs://${normalizedBucket}/`.length));
  }

  try {
    const url = new URL(rawUrl);

    if (url.hostname === "firebasestorage.googleapis.com") {
      const prefix = `/v0/b/${normalizedBucket}/o/`;
      if (!url.pathname.startsWith(prefix)) return null;
      return decodeURIComponent(url.pathname.slice(prefix.length));
    }

    if (url.hostname === "storage.googleapis.com") {
      const pathname = url.pathname.replace(/^\/+/, "");
      if (!pathname.startsWith(`${normalizedBucket}/`)) return null;
      return decodeURIComponent(pathname.slice(normalizedBucket.length + 1));
    }
  } catch {
    return null;
  }

  return null;
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const replaceMappedUrl = (url: string | undefined, urlMap: Map<string, string>) => {
  if (!url) return { changed: false, value: url };
  const nextUrl = urlMap.get(url);
  if (!nextUrl || nextUrl === url) return { changed: false, value: url };
  return { changed: true, value: nextUrl };
};

const replaceBlockMediaUrl = <T extends { url?: string }>(media: T | undefined, urlMap: Map<string, string>) => {
  if (!media?.url) return { changed: false, value: media };
  const nextUrl = urlMap.get(media.url);
  if (!nextUrl || nextUrl === media.url) return { changed: false, value: media };
  return {
    changed: true,
    value: { ...media, url: nextUrl }
  };
};

const replacePageAssetUrls = (page: any, urlMap: Map<string, string>) => {
  let changed = false;
  const nextPage = clone(page);

  const socialImage = replaceBlockMediaUrl(nextPage.socialImage, urlMap);
  if (socialImage.changed) {
    nextPage.socialImage = socialImage.value;
    changed = true;
  }

  if (Array.isArray(nextPage.blocks)) {
    nextPage.blocks = nextPage.blocks.map((block: any) => {
      let blockChanged = false;
      let nextBlock = block;

      const media = replaceBlockMediaUrl(block.media, urlMap);
      if (media.changed) {
        nextBlock = { ...nextBlock, media: media.value };
        blockChanged = true;
      }

      const background = replaceBlockMediaUrl(block.background, urlMap);
      if (background.changed) {
        nextBlock = { ...nextBlock, background: background.value };
        blockChanged = true;
      }

      if (Array.isArray(block.items)) {
        const items = block.items.map((item: any) => {
          const icon = replaceBlockMediaUrl(item?.icon, urlMap);
          if (!icon.changed) return item;
          blockChanged = true;
          return { ...item, icon: icon.value };
        });
        if (blockChanged) {
          nextBlock = { ...nextBlock, items };
        }
      }

      if (blockChanged) {
        changed = true;
      }

      return nextBlock;
    });
  }

  return { changed, value: nextPage };
};

const replaceComponentAssetUrls = (component: any, urlMap: Map<string, string>) => {
  const icon = replaceBlockMediaUrl(component.icon, urlMap);
  if (!icon.changed) return { changed: false, value: component };
  return { changed: true, value: { ...component, icon: icon.value } };
};

const replaceSiteSettingsAssetUrls = (settings: any, urlMap: Map<string, string>) => {
  let changed = false;
  const nextSettings = { ...settings };
  for (const key of ["logoUrl", "footerLogoUrl", "notFoundIconUrl", "faviconUrl", "touchIconUrl"] as const) {
    const replacement = replaceMappedUrl(nextSettings[key], urlMap);
    if (!replacement.changed) continue;
    nextSettings[key] = replacement.value;
    changed = true;
  }
  return { changed, value: nextSettings };
};

const addStorageCandidate = (
  candidates: Map<string, StorageCandidate>,
  bucket: string,
  url: string | undefined | null,
  options: { preserveOriginal?: boolean } = {}
) => {
  if (!url?.trim()) return;
  const fullPath = extractStoragePathFromUrl(url, bucket);
  if (!fullPath) return;

  const existing = candidates.get(fullPath);
  if (existing) {
    existing.urls.add(url);
    existing.preserveOriginal = existing.preserveOriginal || Boolean(options.preserveOriginal);
    return;
  }

  candidates.set(fullPath, {
    fullPath,
    sampleUrl: url,
    preserveOriginal: Boolean(options.preserveOriginal),
    urls: new Set([url])
  });
};

const updateProgress = (message: string, onProgress?: (message: string) => void) => {
  if (onProgress) onProgress(message);
};

const convertNavigationIconDataUrl = async (icon: string) => {
  const response = await fetch(icon);
  if (!response.ok) {
    throw new Error(`Failed to read navigation icon (${response.status})`);
  }

  const blob = await response.blob();
  const sourceType = blob.type || "image/png";
  const sourceExtension = sourceType === "image/jpeg" ? ".jpg" : sourceType === "image/bmp" ? ".bmp" : ".png";
  const file = new File([blob], `navigation-icon${sourceExtension}`, { type: sourceType, lastModified: Date.now() });
  const converted = await prepareImageDataUrl(file);
  return converted;
};

export async function migrateUploadedAssetsToWebp(options: MigrationOptions = {}): Promise<AssetMigrationSummary> {
  const report = (message: string) => updateProgress(message, options.onProgress);

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw new Error("Firebase env vars are missing.");
  }

  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error("Firebase Storage bucket is missing.");
  }

  const app = getFirebaseApp();
  await ensureFirebaseDevAuth();

  if (!localAuthBypassEnabled) {
    const auth = getAuth(app);
    if (!auth.currentUser) {
      throw new Error("Sign in to the admin before running the asset migration.");
    }
  }

  const storage = getStorage(app);
  const db = getFirestore(app);
  const now = new Date().toISOString();

  report("Scanning Firestore for existing asset references…");

  const [siteSettingsSnapshot, mediaSnapshot, pagesSnapshot, componentsSnapshot, navigationSnapshot] = await Promise.all([
    getDoc(doc(db, STORAGE_COLLECTIONS.siteSettings, "global")),
    getDocs(collection(db, STORAGE_COLLECTIONS.media)),
    getDocs(collection(db, STORAGE_COLLECTIONS.pages)),
    getDocs(collection(db, STORAGE_COLLECTIONS.components)),
    getDocs(collection(db, STORAGE_COLLECTIONS.navigation))
  ]);

  const candidates = new Map<string, StorageCandidate>();

  if (siteSettingsSnapshot.exists()) {
    const settings = siteSettingsSnapshot.data() as any;
    addStorageCandidate(candidates, bucket, settings.logoUrl);
    addStorageCandidate(candidates, bucket, settings.footerLogoUrl);
    addStorageCandidate(candidates, bucket, settings.notFoundIconUrl);
    addStorageCandidate(candidates, bucket, settings.faviconUrl, { preserveOriginal: true });
    addStorageCandidate(candidates, bucket, settings.touchIconUrl, { preserveOriginal: true });
  }

  mediaSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as any;
    if ((data.mediaType ?? "image") !== "image") return;
    addStorageCandidate(candidates, bucket, data.url);
  });

  componentsSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as any;
    addStorageCandidate(candidates, bucket, data.icon?.url);
  });

  pagesSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as any;
    addStorageCandidate(candidates, bucket, data.socialImage?.url);
    if (!Array.isArray(data.blocks)) return;
    data.blocks.forEach((block: any) => {
      addStorageCandidate(candidates, bucket, block?.media?.url);
      addStorageCandidate(candidates, bucket, block?.background?.url);
      if (!Array.isArray(block?.items)) return;
      block.items.forEach((item: any) => {
        addStorageCandidate(candidates, bucket, item?.icon?.url);
      });
    });
  });

  navigationSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as any;
    addStorageCandidate(candidates, bucket, data.icon);
  });

  const urlMap = new Map<string, string>();
  const failures: string[] = [];
  let migratedStorageAssets = 0;
  let skippedStorageAssets = 0;
  let failedStorageAssets = 0;
  let cacheMetadataUpdated = 0;
  let cacheMetadataFailed = 0;

  const storageCandidates = Array.from(candidates.values());

  for (let index = 0; index < storageCandidates.length; index += 1) {
    const candidate = storageCandidates[index];
    report(`Migrating storage asset ${index + 1}/${storageCandidates.length}: ${candidate.fullPath}`);

    // The files are named with a timestamp, so each version is immutable. Set
    // caching metadata even when the source file is already WebP or must retain
    // its original format (such as a favicon).
    try {
      const currentRef = ref(storage, candidate.fullPath);
      const metadata = await getMetadata(currentRef);
      if (metadata.cacheControl !== PUBLIC_MEDIA_CACHE_CONTROL) {
        await updateMetadata(currentRef, { cacheControl: PUBLIC_MEDIA_CACHE_CONTROL });
        cacheMetadataUpdated += 1;
      }
    } catch (error: any) {
      cacheMetadataFailed += 1;
      failures.push(`${candidate.fullPath}: unable to update cache metadata (${error?.message ?? "Unknown error"})`);
    }

    if (candidate.preserveOriginal) {
      skippedStorageAssets += 1;
      continue;
    }

    if (!hasConvertibleExtension(candidate.fullPath)) {
      skippedStorageAssets += 1;
      continue;
    }

    try {
      const currentRef = ref(storage, candidate.fullPath);
      const metadata = await getMetadata(currentRef);
      const contentType = metadata.contentType ?? "";

      if (!CONVERTIBLE_MIME_TYPES.has(contentType)) {
        skippedStorageAssets += 1;
        continue;
      }

      const response = await fetch(candidate.sampleUrl);
      if (!response.ok) {
        throw new Error(`Download failed with ${response.status}`);
      }

      const blob = await response.blob();
      const sourceFile = new File([blob], fileNameFromPath(candidate.fullPath), {
        type: blob.type || contentType,
        lastModified: Date.now()
      });
      const uploadFile = await prepareImageFileForUpload(sourceFile);

      if (uploadFile === sourceFile || uploadFile.type !== "image/webp") {
        skippedStorageAssets += 1;
        continue;
      }

      const nextPath = buildWebpPath(candidate.fullPath);
      const nextRef = ref(storage, nextPath);
      await uploadBytes(nextRef, uploadFile, {
        ...getPublicMediaUploadMetadata(uploadFile),
        customMetadata: metadata.customMetadata ?? undefined
      });
      const nextUrl = await getDownloadURL(nextRef);

      candidate.urls.forEach((url) => {
        urlMap.set(url, nextUrl);
      });
      migratedStorageAssets += 1;
    } catch (error: any) {
      failedStorageAssets += 1;
      failures.push(`${candidate.fullPath}: ${error?.message ?? "Unknown error"}`);
    }
  }

  const updatedDocuments: DocumentUpdateCounts = {
    siteSettings: 0,
    media: 0,
    pages: 0,
    components: 0,
    navigation: 0
  };
  let convertedNavigationIcons = 0;

  report("Updating Firestore references to migrated assets…");

  if (siteSettingsSnapshot.exists()) {
    const updated = replaceSiteSettingsAssetUrls(siteSettingsSnapshot.data(), urlMap);
    if (updated.changed) {
      await setDoc(doc(db, STORAGE_COLLECTIONS.siteSettings, "global"), { ...updated.value, updatedAt: now }, { merge: true });
      updatedDocuments.siteSettings += 1;
    }
  }

  for (const docSnap of mediaSnapshot.docs) {
    const data = docSnap.data() as any;
    const nextUrl = urlMap.get(data.url);
    if (!nextUrl || nextUrl === data.url) continue;
    await updateDoc(doc(db, STORAGE_COLLECTIONS.media, docSnap.id), {
      url: nextUrl,
      name: replaceFileExtension(data.name ?? fileNameFromPath(extractStoragePathFromUrl(data.url, bucket) ?? "upload"), ".webp")
    });
    updatedDocuments.media += 1;
  }

  for (const docSnap of componentsSnapshot.docs) {
    const updated = replaceComponentAssetUrls(docSnap.data(), urlMap);
    if (!updated.changed) continue;
    await updateDoc(doc(db, STORAGE_COLLECTIONS.components, docSnap.id), {
      ...updated.value,
      updatedAt: now
    });
    updatedDocuments.components += 1;
  }

  for (const docSnap of pagesSnapshot.docs) {
    const updated = replacePageAssetUrls(docSnap.data(), urlMap);
    if (!updated.changed) continue;
    await updateDoc(doc(db, STORAGE_COLLECTIONS.pages, docSnap.id), {
      ...updated.value,
      updatedAt: now
    });
    updatedDocuments.pages += 1;
  }

  for (const docSnap of navigationSnapshot.docs) {
    const data = docSnap.data() as any;
    let changed = false;
    const nextData = { ...data };

    const mappedUrl = urlMap.get(nextData.icon);
    if (mappedUrl && mappedUrl !== nextData.icon) {
      nextData.icon = mappedUrl;
      changed = true;
    } else if (typeof nextData.icon === "string" && isConvertibleDataUrl(nextData.icon)) {
      const converted = await convertNavigationIconDataUrl(nextData.icon);
      if (converted !== nextData.icon) {
        nextData.icon = converted;
        changed = true;
        convertedNavigationIcons += 1;
      }
    }

    if (!changed) continue;
    await updateDoc(doc(db, STORAGE_COLLECTIONS.navigation, docSnap.id), {
      ...nextData,
      updatedAt: now
    });
    updatedDocuments.navigation += 1;
  }

  report("Asset migration complete.");

  return {
    scannedStorageAssets: storageCandidates.length,
    migratedStorageAssets,
    skippedStorageAssets,
    failedStorageAssets,
    cacheMetadataUpdated,
    cacheMetadataFailed,
    convertedNavigationIcons,
    updatedDocuments,
    failures
  };
}
