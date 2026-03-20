import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorized, getDb, stripUndefined, unauthorized, missingFirebase, firebaseConfigured, findConflictingSlug } from "@/lib/adminApi";
import { normalizePageShape } from "@/lib/pageContent";
import type { PageRecord } from "@/lib/admin/pages";

type RouteContext = { params: Promise<{ id: string }> };

async function getPageDoc(id: string) {
  const db = getDb();
  const snapshot = await db.collection("pages").doc(id).get();
  if (!snapshot.exists) return null;
  return normalizePageShape({ id: snapshot.id, ...snapshot.data() });
}

export async function GET(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const { id } = await context.params;
    const data = await getPageDoc(id);
    if (!data) return NextResponse.json({ error: "Page not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to get page", error);
    return NextResponse.json({ error: "Failed to get page" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.slug) {
      const conflict = await findConflictingSlug(body.slug, id);
      if (conflict) {
        return NextResponse.json(
          { error: `Slug "${body.slug}" is already used by page "${conflict}"` },
          { status: 409 }
        );
      }
    }

    const db = getDb();

    const page: PageRecord = {
      ...body,
      id,
      status: body.status ?? "draft",
      blocks: body.blocks ?? [],
      updatedAt: new Date().toISOString()
    };

    await db.collection("pages").doc(id).set(stripUndefined(page));

    const data = await getPageDoc(id);
    if (page.slug) revalidatePath(page.slug);
    revalidatePath("/");

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to update page", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.slug) {
      const conflict = await findConflictingSlug(body.slug, id);
      if (conflict) {
        return NextResponse.json(
          { error: `Slug "${body.slug}" is already used by page "${conflict}"` },
          { status: 409 }
        );
      }
    }

    const db = getDb();
    const ref = db.collection("pages").doc(id);

    const existing = await ref.get();
    if (!existing.exists) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const updates = stripUndefined({ ...body, updatedAt: new Date().toISOString() });
    await ref.update(updates);

    const data = await getPageDoc(id);
    const slug = data?.slug ?? existing.data()?.slug;
    if (slug) revalidatePath(slug as string);
    revalidatePath("/");

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to patch page", error);
    return NextResponse.json({ error: "Failed to patch page" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const { id } = await context.params;
    const db = getDb();
    const ref = db.collection("pages").doc(id);

    const existing = await ref.get();
    if (!existing.exists) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const slug = existing.data()?.slug;
    await ref.delete();

    if (slug) revalidatePath(slug as string);
    revalidatePath("/");

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete page", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
