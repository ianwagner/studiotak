import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { seedPages } from "@/lib/admin/pages";
import { seedComponents } from "@/lib/admin/components";
import { getDb, isAuthorized, firebaseConfigured, unauthorized, missingFirebase, stripUndefined } from "@/lib/adminApi";

/**
 * GET /api/admin/seed
 *
 * Pull the current state of pages and components from Firestore.
 * Use this before making edits to avoid overwriting changes made via /admin.
 * Optional query param: ?collection=pages|components (default: both)
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  if (!firebaseConfigured()) {
    return missingFirebase();
  }

  try {
    const db = getDb();
    const url = new URL(request.url);
    const collectionFilter = url.searchParams.get("collection");

    const result: Record<string, any> = {};

    if (!collectionFilter || collectionFilter === "pages") {
      const pagesSnapshot = await db.collection("pages").get();
      result.pages = pagesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    if (!collectionFilter || collectionFilter === "components") {
      const componentsSnapshot = await db.collection("components").get();
      result.components = componentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to pull from Firestore", error);
    return NextResponse.json({ error: "Failed to pull from Firestore." }, { status: 500 });
  }
}

/**
 * POST /api/admin/seed
 *
 * Push seed data to Firestore. Uses merge: true so fields not present in
 * seed data are preserved (but fields present in seed data WILL overwrite).
 * Also seeds components.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  if (!firebaseConfigured()) {
    return missingFirebase();
  }

  try {
    // Validate no duplicate slugs in seed data before pushing
    const slugMap = new Map<string, string>();
    const conflicts: string[] = [];
    for (const page of seedPages) {
      const existing = slugMap.get(page.slug);
      if (existing) {
        conflicts.push(`slug "${page.slug}" claimed by "${existing}" and "${page.id}"`);
      }
      slugMap.set(page.slug, page.id);
    }
    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: "Duplicate slugs in seed data", conflicts },
        { status: 400 }
      );
    }

    const db = getDb();
    const batch = db.batch();

    // Seed pages
    for (const page of seedPages) {
      const ref = db.collection("pages").doc(page.id);
      batch.set(ref, stripUndefined({ ...page, updatedAt: new Date().toISOString() }), { merge: true });
    }

    // Seed components
    for (const component of seedComponents) {
      const ref = db.collection("components").doc(component.id);
      batch.set(ref, stripUndefined({ ...component, updatedAt: new Date().toISOString() }), { merge: true });
    }

    await batch.commit();

    // Bust ISR cache for all seeded pages
    for (const page of seedPages) {
      if (page.slug) revalidatePath(page.slug);
    }
    revalidatePath("/");

    const seededPages = seedPages.map((p) => p.id);
    const seededComponents = seedComponents.map((c) => c.id);
    return NextResponse.json({ seededPages, seededComponents, count: seededPages.length + seededComponents.length });
  } catch (error) {
    console.error("Failed to seed Firestore", error);
    return NextResponse.json({ error: "Failed to seed Firestore." }, { status: 500 });
  }
}
