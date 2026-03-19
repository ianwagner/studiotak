import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getDownloadURL, getStorage } from "firebase-admin/storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const CONVERTIBLE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/bmp"]);
const STORAGE_COLLECTIONS = {
  media: "media",
  pages: "pages",
  components: "components",
  navigation: "navigation",
  siteSettings: "site-settings"
};

const stripGsPrefix = (bucket) => bucket.replace(/^gs:\/\//, "").replace(/\/+$/, "");
const replaceFileExtension = (value, nextExtension) =>
  /\.[^.]+$/.test(value) ? value.replace(/\.[^.]+$/, nextExtension) : `${value}${nextExtension}`;
const hasConvertibleExtension = (fullPath) => /\.(jpe?g|png|bmp)$/i.test(fullPath);
const fileNameFromPath = (fullPath) => fullPath.split("/").filter(Boolean).pop() ?? "upload";

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function runPython(code, args = []) {
  return spawnSync("python3", ["-c", code, ...args], { encoding: "utf8" });
}

function ensurePythonWebpSupport() {
  const result = runPython(
    [
      "from PIL import features",
      "import sys",
      "sys.exit(0 if features.check('webp') else 1)"
    ].join("\n")
  );
  if (result.error || result.status !== 0) {
    throw new Error("python3 with Pillow WebP support is required on this machine.");
  }
}

function ensureCredentialsPresent() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;
  const adcPath = path.join(homedir(), ".config", "gcloud", "application_default_credentials.json");
  if (!existsSync(adcPath)) {
    throw new Error(
      "Google application default credentials are missing. Run `gcloud auth application-default login` once, or set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file."
    );
  }
}

function extractStoragePathFromUrl(rawUrl, bucket) {
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
}

function addStorageCandidate(candidates, bucket, url, options = {}) {
  if (!url || !String(url).trim()) return;
  const fullPath = extractStoragePathFromUrl(String(url), bucket);
  if (!fullPath) return;

  const existing = candidates.get(fullPath);
  if (existing) {
    existing.urls.add(String(url));
    existing.preserveOriginal = existing.preserveOriginal || Boolean(options.preserveOriginal);
    return;
  }

  candidates.set(fullPath, {
    fullPath,
    sampleUrl: String(url),
    preserveOriginal: Boolean(options.preserveOriginal),
    urls: new Set([String(url)])
  });
}

function replaceBlockMediaUrl(media, urlMap) {
  if (!media?.url) return { changed: false, value: media };
  const nextUrl = urlMap.get(media.url);
  if (!nextUrl || nextUrl === media.url) return { changed: false, value: media };
  return { changed: true, value: { ...media, url: nextUrl } };
}

function replacePageAssetUrls(page, urlMap) {
  let changed = false;
  const nextPage = structuredClone(page);

  const socialImage = replaceBlockMediaUrl(nextPage.socialImage, urlMap);
  if (socialImage.changed) {
    nextPage.socialImage = socialImage.value;
    changed = true;
  }

  if (Array.isArray(nextPage.blocks)) {
    nextPage.blocks = nextPage.blocks.map((block) => {
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
        const items = block.items.map((item) => {
          const icon = replaceBlockMediaUrl(item?.icon, urlMap);
          if (!icon.changed) return item;
          blockChanged = true;
          return { ...item, icon: icon.value };
        });
        if (blockChanged) {
          nextBlock = { ...nextBlock, items };
        }
      }

      if (blockChanged) changed = true;
      return nextBlock;
    });
  }

  return { changed, value: nextPage };
}

function replaceComponentAssetUrls(component, urlMap) {
  const icon = replaceBlockMediaUrl(component.icon, urlMap);
  if (!icon.changed) return { changed: false, value: component };
  return { changed: true, value: { ...component, icon: icon.value } };
}

function replaceSiteSettingsAssetUrls(settings, urlMap) {
  let changed = false;
  const nextSettings = { ...settings };
  for (const key of ["logoUrl", "footerLogoUrl", "notFoundIconUrl", "faviconUrl", "touchIconUrl"]) {
    const nextUrl = urlMap.get(nextSettings[key]);
    if (!nextUrl || nextUrl === nextSettings[key]) continue;
    nextSettings[key] = nextUrl;
    changed = true;
  }
  return { changed, value: nextSettings };
}

function parseDataUrl(value) {
  const match = String(value).match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function dataUrlForFile(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function convertFileToWebp(inputPath, outputPath) {
  const result = runPython(
    [
      "from PIL import Image",
      "import sys",
      "input_path, output_path = sys.argv[1], sys.argv[2]",
      "image = Image.open(input_path)",
      "if image.mode not in ('RGB', 'RGBA'):",
      "    image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')",
      "image.save(output_path, 'WEBP', quality=82, method=6)"
    ].join("\n"),
    [inputPath, outputPath]
  );
  if (result.error || result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "sips conversion failed");
  }
}

async function withTempDir(run) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "studio-tak-webp-"));
  try {
    return await run(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function migrateNavigationDataUrl(icon) {
  const parsed = parseDataUrl(icon);
  if (!parsed || !CONVERTIBLE_MIME_TYPES.has(parsed.mimeType)) {
    return { changed: false, value: icon };
  }

  return withTempDir(async (tempDir) => {
    const extension =
      parsed.mimeType === "image/jpeg" ? ".jpg" : parsed.mimeType === "image/bmp" ? ".bmp" : ".png";
    const inputPath = path.join(tempDir, `navigation-icon${extension}`);
    const outputPath = path.join(tempDir, "navigation-icon.webp");
    await writeFile(inputPath, parsed.buffer);
    await convertFileToWebp(inputPath, outputPath);
    const [inputStats, outputStats] = await Promise.all([stat(inputPath), stat(outputPath)]);
    if (outputStats.size >= inputStats.size) {
      return { changed: false, value: icon };
    }
    const outputBuffer = await readFile(outputPath);
    return { changed: true, value: dataUrlForFile(outputBuffer, "image/webp") };
  });
}

async function main() {
  loadEnvFile(path.join(repoRoot, ".env.local"));
  ensurePythonWebpSupport();
  ensureCredentialsPresent();

  const bucketName = stripGsPrefix(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!bucketName || !projectId) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local.");
  }

  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket: bucketName
    });
  }

  const db = getFirestore();
  const bucket = getStorage().bucket(bucketName);
  const now = new Date().toISOString();
  const urlMap = new Map();
  const failures = [];
  const summary = {
    scannedStorageAssets: 0,
    migratedStorageAssets: 0,
    skippedStorageAssets: 0,
    failedStorageAssets: 0,
    convertedNavigationIcons: 0,
    updatedDocuments: {
      siteSettings: 0,
      media: 0,
      pages: 0,
      components: 0,
      navigation: 0
    }
  };

  console.log(dryRun ? "Running asset migration dry-run…" : "Running asset migration…");

  const [siteSettingsSnapshot, mediaSnapshot, pagesSnapshot, componentsSnapshot, navigationSnapshot] = await Promise.all([
    db.collection(STORAGE_COLLECTIONS.siteSettings).doc("global").get(),
    db.collection(STORAGE_COLLECTIONS.media).get(),
    db.collection(STORAGE_COLLECTIONS.pages).get(),
    db.collection(STORAGE_COLLECTIONS.components).get(),
    db.collection(STORAGE_COLLECTIONS.navigation).get()
  ]);

  const candidates = new Map();

  if (siteSettingsSnapshot.exists) {
    const settings = siteSettingsSnapshot.data() ?? {};
    addStorageCandidate(candidates, bucketName, settings.logoUrl);
    addStorageCandidate(candidates, bucketName, settings.footerLogoUrl);
    addStorageCandidate(candidates, bucketName, settings.notFoundIconUrl);
    addStorageCandidate(candidates, bucketName, settings.faviconUrl, { preserveOriginal: true });
    addStorageCandidate(candidates, bucketName, settings.touchIconUrl, { preserveOriginal: true });
  }

  mediaSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if ((data.mediaType ?? "image") !== "image") return;
    addStorageCandidate(candidates, bucketName, data.url);
  });

  componentsSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    addStorageCandidate(candidates, bucketName, data.icon?.url);
  });

  pagesSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    addStorageCandidate(candidates, bucketName, data.socialImage?.url);
    if (!Array.isArray(data.blocks)) return;
    data.blocks.forEach((block) => {
      addStorageCandidate(candidates, bucketName, block?.media?.url);
      addStorageCandidate(candidates, bucketName, block?.background?.url);
      if (!Array.isArray(block?.items)) return;
      block.items.forEach((item) => {
        addStorageCandidate(candidates, bucketName, item?.icon?.url);
      });
    });
  });

  navigationSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    addStorageCandidate(candidates, bucketName, data.icon);
  });

  const storageCandidates = Array.from(candidates.values());
  summary.scannedStorageAssets = storageCandidates.length;

  for (let index = 0; index < storageCandidates.length; index += 1) {
    const candidate = storageCandidates[index];
    process.stdout.write(`[${index + 1}/${storageCandidates.length}] ${candidate.fullPath} `);

    if (candidate.preserveOriginal || !hasConvertibleExtension(candidate.fullPath)) {
      summary.skippedStorageAssets += 1;
      console.log("skipped");
      continue;
    }

    try {
      const file = bucket.file(candidate.fullPath);
      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType ?? "";

      if (!CONVERTIBLE_MIME_TYPES.has(contentType)) {
        summary.skippedStorageAssets += 1;
        console.log("skipped");
        continue;
      }

      const converted = await withTempDir(async (tempDir) => {
        const inputPath = path.join(tempDir, fileNameFromPath(candidate.fullPath));
        const outputPath = path.join(tempDir, replaceFileExtension(fileNameFromPath(candidate.fullPath), ".webp"));
        await file.download({ destination: inputPath });
        await convertFileToWebp(inputPath, outputPath);
        const [inputStats, outputStats] = await Promise.all([stat(inputPath), stat(outputPath)]);
        if (outputStats.size >= inputStats.size) {
          return {
            changed: false,
            inputSize: inputStats.size,
            outputSize: outputStats.size
          };
        }

        const nextPath = replaceFileExtension(candidate.fullPath, ".webp");
        const nextFile = bucket.file(nextPath);
        const downloadToken = crypto.randomUUID();

        if (!dryRun) {
          await bucket.upload(outputPath, {
            destination: nextPath,
            metadata: {
              contentType: "image/webp",
              cacheControl: metadata.cacheControl,
              metadata: {
                ...(metadata.metadata ?? {}),
                firebaseStorageDownloadTokens: downloadToken
              }
            }
          });
        }

        return {
          changed: true,
          inputSize: inputStats.size,
          outputSize: outputStats.size,
          nextUrl: dryRun
            ? `dry-run://${bucketName}/${encodeURIComponent(nextPath)}`
            : await getDownloadURL(nextFile)
        };
      });

      if (!converted.changed) {
        summary.skippedStorageAssets += 1;
        console.log("not smaller");
        continue;
      }

      candidate.urls.forEach((url) => urlMap.set(url, converted.nextUrl));
      summary.migratedStorageAssets += 1;
      console.log(`${converted.inputSize} -> ${converted.outputSize}`);
    } catch (error) {
      summary.failedStorageAssets += 1;
      failures.push(`${candidate.fullPath}: ${error.message ?? "Unknown error"}`);
      console.log("failed");
    }
  }

  if (!dryRun) {
    if (siteSettingsSnapshot.exists) {
      const updated = replaceSiteSettingsAssetUrls(siteSettingsSnapshot.data() ?? {}, urlMap);
      if (updated.changed) {
        await siteSettingsSnapshot.ref.set({ ...updated.value, updatedAt: now }, { merge: true });
        summary.updatedDocuments.siteSettings += 1;
      }
    }

    for (const docSnap of mediaSnapshot.docs) {
      const data = docSnap.data();
      const nextUrl = urlMap.get(data.url);
      if (!nextUrl || nextUrl === data.url) continue;
      await docSnap.ref.update({
        url: nextUrl,
        name: replaceFileExtension(
          data.name ?? fileNameFromPath(extractStoragePathFromUrl(data.url, bucketName) ?? "upload"),
          ".webp"
        )
      });
      summary.updatedDocuments.media += 1;
    }

    for (const docSnap of componentsSnapshot.docs) {
      const updated = replaceComponentAssetUrls(docSnap.data(), urlMap);
      if (!updated.changed) continue;
      await docSnap.ref.set({ ...updated.value, updatedAt: now });
      summary.updatedDocuments.components += 1;
    }

    for (const docSnap of pagesSnapshot.docs) {
      const updated = replacePageAssetUrls(docSnap.data(), urlMap);
      if (!updated.changed) continue;
      await docSnap.ref.set({ ...updated.value, updatedAt: now });
      summary.updatedDocuments.pages += 1;
    }

    for (const docSnap of navigationSnapshot.docs) {
      const data = docSnap.data();
      let changed = false;
      const nextData = { ...data };

      const mappedUrl = urlMap.get(nextData.icon);
      if (mappedUrl && mappedUrl !== nextData.icon) {
        nextData.icon = mappedUrl;
        changed = true;
      } else if (typeof nextData.icon === "string" && nextData.icon.startsWith("data:image/")) {
        const migrated = await migrateNavigationDataUrl(nextData.icon);
        if (migrated.changed) {
          nextData.icon = migrated.value;
          changed = true;
          summary.convertedNavigationIcons += 1;
        }
      }

      if (!changed) continue;
      await docSnap.ref.set({ ...nextData, updatedAt: now });
      summary.updatedDocuments.navigation += 1;
    }
  }

  console.log("");
  console.log("Summary");
  console.log(JSON.stringify({ ...summary, failures }, null, 2));
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
