/**
 * One-time migration: convert media.industry from string → string[]
 *
 * Usage:
 *   node scripts/migrate-industry-to-array.mjs            # live run
 *   node scripts/migrate-industry-to-array.mjs --dry-run   # preview only
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or Application Default Credentials.
 */

import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const dryRun = process.argv.includes("--dry-run");

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}
const db = getFirestore();

async function main() {
  const snapshot = await db.collection("media").get();
  let updated = 0;
  let skipped = 0;

  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const industry = data.industry;

    if (Array.isArray(industry)) {
      skipped++;
      continue;
    }

    const arrayValue =
      typeof industry === "string" && industry.trim()
        ? [industry.trim()]
        : [];

    if (dryRun) {
      console.log(`[dry-run] ${doc.id}: "${industry}" → ${JSON.stringify(arrayValue)}`);
    } else {
      batch.update(doc.ref, { industry: arrayValue });
    }
    updated++;
  }

  if (!dryRun && updated > 0) {
    await batch.commit();
  }

  console.log(`\nDone. ${updated} updated, ${skipped} already arrays.${dryRun ? " (dry run)" : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
