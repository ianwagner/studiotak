import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorized, getDb, stripUndefined, unauthorized, missingFirebase, firebaseConfigured, findConflictingSlug } from "@/lib/adminApi";
import { normalizePageShape } from "@/lib/pageContent";
import type { PageRecord } from "@/lib/admin/pages";

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const db = getDb();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let q: FirebaseFirestore.Query = db.collection("pages");
    if (status) {
      q = q.where("status", "==", status);
    }

    const snapshot = await q.get();
    const data = snapshot.docs
      .map((docSnap) => normalizePageShape({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("Failed to list pages", error);
    return NextResponse.json({ error: "Failed to list pages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const body = await request.json();
    if (!body.id || !body.slug) {
      return NextResponse.json({ error: "id and slug are required" }, { status: 400 });
    }

    const conflict = await findConflictingSlug(body.slug, body.id);
    if (conflict) {
      return NextResponse.json(
        { error: `Slug "${body.slug}" is already used by page "${conflict}"` },
        { status: 409 }
      );
    }

    const db = getDb();
    const page: PageRecord = {
      ...body,
      status: body.status ?? "draft",
      blocks: body.blocks ?? [],
      updatedAt: new Date().toISOString()
    };

    const ref = db.collection("pages").doc(page.id);
    await ref.set(stripUndefined(page));

    const snapshot = await ref.get();
    const data = normalizePageShape({ id: snapshot.id, ...snapshot.data() });

    revalidatePath(page.slug);
    revalidatePath("/");

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Failed to create page", error);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
