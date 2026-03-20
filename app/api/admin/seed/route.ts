import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { seedPages } from "@/lib/admin/pages";
import { getDb, isAuthorized, firebaseConfigured, unauthorized, missingFirebase, stripUndefined } from "@/lib/adminApi";

const collectionName = "pages";

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  if (!firebaseConfigured()) {
    return missingFirebase();
  }

  try {
    const db = getDb();
    const batch = db.batch();
    for (const page of seedPages) {
      const ref = db.collection(collectionName).doc(page.id);
      batch.set(ref, stripUndefined({ ...page, updatedAt: new Date().toISOString() }), { merge: true });
    }
    await batch.commit();

    // Bust ISR cache for all seeded pages
    for (const page of seedPages) {
      if (page.slug) revalidatePath(page.slug);
    }
    revalidatePath("/");

    const seeded = seedPages.map((p) => p.id);
    return NextResponse.json({ seeded, count: seeded.length });
  } catch (error) {
    console.error("Failed to seed Firestore", error);
    return NextResponse.json({ error: "Failed to seed Firestore." }, { status: 500 });
  }
}
