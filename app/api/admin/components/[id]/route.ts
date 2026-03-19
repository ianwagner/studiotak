import { NextResponse } from "next/server";
import { isAuthorized, getDb, stripUndefined, unauthorized, missingFirebase, firebaseConfigured } from "@/lib/adminApi";
import { normalizeComponentShape, type ComponentRecord } from "@/lib/admin/components";

type RouteContext = { params: Promise<{ id: string }> };

async function getComponentDoc(id: string) {
  const db = getDb();
  const snapshot = await db.collection("components").doc(id).get();
  if (!snapshot.exists) return null;
  return normalizeComponentShape({ id: snapshot.id, ...snapshot.data() });
}

export async function GET(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const { id } = await context.params;
    const data = await getComponentDoc(id);
    if (!data) return NextResponse.json({ error: "Component not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to get component", error);
    return NextResponse.json({ error: "Failed to get component" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = getDb();

    const component: ComponentRecord = {
      ...body,
      id,
      updatedAt: new Date().toISOString()
    };

    await db.collection("components").doc(id).set(stripUndefined(component));

    const data = await getComponentDoc(id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to update component", error);
    return NextResponse.json({ error: "Failed to update component" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = getDb();
    const ref = db.collection("components").doc(id);

    const existing = await ref.get();
    if (!existing.exists) return NextResponse.json({ error: "Component not found" }, { status: 404 });

    const updates = stripUndefined({ ...body, updatedAt: new Date().toISOString() });
    await ref.update(updates);

    const data = await getComponentDoc(id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to patch component", error);
    return NextResponse.json({ error: "Failed to patch component" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const { id } = await context.params;
    const db = getDb();
    const ref = db.collection("components").doc(id);

    const existing = await ref.get();
    if (!existing.exists) return NextResponse.json({ error: "Component not found" }, { status: 404 });

    await ref.delete();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete component", error);
    return NextResponse.json({ error: "Failed to delete component" }, { status: 500 });
  }
}
