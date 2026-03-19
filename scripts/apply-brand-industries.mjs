/**
 * Apply industry tags from campfire-brands.csv to media items.
 * Matches brand codes found in media file names.
 *
 * Usage:
 *   node scripts/apply-brand-industries.mjs            # live run
 *   node scripts/apply-brand-industries.mjs --dry-run   # preview only
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or Application Default Credentials.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");

// --- Load brand CSV ---
const csvPath = resolve(__dirname, "../../../Claude/Context/campfire-brands.csv");
const csvText = readFileSync(csvPath, "utf-8");
const lines = csvText.trim().split("\n").slice(1); // skip header

const brands = new Map();
for (const line of lines) {
  const [code, brand, tag1, tag2, confidence] = line.split(",");
  if (!code || confidence === "exclude") continue;
  const tags = [tag1, tag2].filter(Boolean);
  brands.set(code.toUpperCase(), { brand, tags });
}

console.log(`Loaded ${brands.size} brands from CSV\n`);

// --- Init Firestore ---
if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}
const db = getFirestore();

async function main() {
  const snapshot = await db.collection("media").get();
  let matched = 0;
  let unmatched = 0;
  let skipped = 0;
  const unmatchedNames = [];

  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = (data.name ?? "").toUpperCase();

    // Try to find a brand code at the start of the file name or as a
    // standalone segment (delimited by _ - . or space). This avoids false
    // positives like "SportsClub" matching "PORT".
    // Falls back to matching the full brand name as a substring.
    let found = null;
    for (const [code, info] of brands) {
      const pattern = new RegExp(`(^|[_\\-. ])${code}([_\\-. ]|$)`);
      if (pattern.test(name)) {
        if (!found || code.length > found.code.length) {
          found = { code, ...info };
        }
      }
    }
    if (!found) {
      for (const [code, info] of brands) {
        // Only try brand name fallback for names >= 4 chars to avoid
        // false positives (e.g. "Fi" matching "campfire")
        if (info.brand.length >= 4 && name.includes(info.brand.toUpperCase())) {
          found = { code, ...info };
          break;
        }
      }
    }

    if (!found) {
      unmatched++;
      unmatchedNames.push(data.name);
      continue;
    }

    // Check if already tagged with the same values
    const currentIndustry = Array.isArray(data.industry) ? data.industry : [];
    const newTags = found.tags;
    const alreadyTagged = newTags.every((t) => currentIndustry.includes(t)) && currentIndustry.length === newTags.length;

    if (alreadyTagged) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] ${data.name} → ${found.code} (${found.brand}) → [${newTags.join(", ")}]`);
    } else {
      batch.update(doc.ref, { industry: newTags });
    }
    matched++;
  }

  if (!dryRun && matched > 0) {
    await batch.commit();
  }

  console.log(`\nResults:`);
  console.log(`  ${matched} updated`);
  console.log(`  ${skipped} already correct`);
  console.log(`  ${unmatched} unmatched`);
  if (dryRun) console.log(`  (dry run — no changes written)`);

  if (unmatchedNames.length > 0 && unmatchedNames.length <= 30) {
    console.log(`\nUnmatched files:`);
    unmatchedNames.forEach((n) => console.log(`  - ${n}`));
  } else if (unmatchedNames.length > 30) {
    console.log(`\nFirst 30 unmatched files:`);
    unmatchedNames.slice(0, 30).forEach((n) => console.log(`  - ${n}`));
    console.log(`  ... and ${unmatchedNames.length - 30} more`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
