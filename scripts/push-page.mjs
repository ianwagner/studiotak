#!/usr/bin/env node
/**
 * Push a page directly to Firestore without a git commit.
 *
 * Usage:
 *   node scripts/push-page.mjs <page-id>
 *
 * Reads the page from seedPages in lib/admin/pages.ts (via a lightweight
 * dynamic import of the compiled output) and upserts it into the Firestore
 * "pages" collection using firebase-admin with Application Default Credentials.
 *
 * If no <page-id> is given it lists all seed page IDs.
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { execSync } from "child_process";
import { readFileSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Firebase init ──────────────────────────────────────────────────────
const projectId = "studio-tak";

function getDb() {
  if (!getApps().length) {
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (saJson) {
      initializeApp({ credential: cert(JSON.parse(saJson)) });
    } else {
      // Uses Application Default Credentials (gcloud auth application-default login)
      initializeApp({ projectId });
    }
  }
  return getFirestore();
}

// ── Extract seed pages via tsx ──────────────────────────────────────────
function getSeedPages() {
  // Compile and run a tiny TS snippet that imports seedPages and prints JSON
  const tmpDir = join(ROOT, ".tmp-seed");
  mkdirSync(tmpDir, { recursive: true });
  const script = join(tmpDir, "dump.mjs");

  // Use tsx to run TypeScript directly
  const tsScript = join(tmpDir, "dump.ts");
  writeFileSync(
    tsScript,
    `import { seedPages } from "${join(ROOT, "lib/admin/pages").replace(/\\/g, "/")}";
console.log(JSON.stringify(seedPages));`
  );

  try {
    const result = execSync(`npx tsx "${tsScript}"`, {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(result.trim());
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── Strip undefined values (Firestore rejects them) ────────────────────
function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return value;
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  const pageId = process.argv[2];
  const seedPages = getSeedPages();

  if (!pageId) {
    console.log("Available seed pages:");
    seedPages.forEach((p) => console.log(`  ${p.id.padEnd(20)} ${p.slug}`));
    console.log("\nUsage: node scripts/push-page.mjs <page-id>");
    process.exit(0);
  }

  const page = seedPages.find((p) => p.id === pageId);
  if (!page) {
    console.error(`Page "${pageId}" not found in seed data.`);
    console.log("Available:", seedPages.map((p) => p.id).join(", "));
    process.exit(1);
  }

  const db = getDb();
  const cleaned = stripUndefined(page);
  await db.collection("pages").doc(page.id).set(cleaned, { merge: false });

  console.log(`✅ Pushed "${page.id}" (${page.slug}) to Firestore`);
  console.log(`   ${page.blocks.length} blocks, status: ${page.status}`);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
