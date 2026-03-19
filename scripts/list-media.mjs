import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) initializeApp({ projectId: "studio-tak" });
const db = getFirestore();

const snap = await db.collection("media").orderBy("uploadedAt", "desc").get();
console.log(`Media library (${snap.size} items):\n`);
snap.docs.forEach(d => {
  const r = d.data();
  console.log(`  ID: ${d.id}`);
  console.log(`  Name: ${r.name}`);
  console.log(`  URL: ${(r.url || "").substring(0, 120)}`);
  console.log(`  Industry: ${r.industry || "(none)"} | Type: ${r.type || "(none)"} | Media: ${r.mediaType || "image"} | Featured: ${!!r.featured}`);
  console.log("");
});
