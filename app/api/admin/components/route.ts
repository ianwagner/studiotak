import { NextResponse } from "next/server";
import { isAuthorized, getDb, stripUndefined, unauthorized, missingFirebase, firebaseConfigured } from "@/lib/adminApi";
import { normalizeComponentShape, type ComponentRecord } from "@/lib/admin/components";

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const db = getDb();
    const snapshot = await db.collection("components").orderBy("title", "asc").get();
    const data = snapshot.docs.map((docSnap) =>
      normalizeComponentShape({ id: docSnap.id, ...docSnap.data() })
    );
    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("Failed to list components", error);
    return NextResponse.json({ error: "Failed to list components" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  if (!firebaseConfigured()) return missingFirebase();

  try {
    const body = await request.json();
    if (!body.id || !body.kind) {
      return NextResponse.json({ error: "id and kind are required" }, { status: 400 });
    }

    const db = getDb();
    const component: ComponentRecord = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    const ref = db.collection("components").doc(component.id);
    await ref.set(stripUndefined(component));

    const snapshot = await ref.get();
    const data = normalizeComponentShape({ id: snapshot.id, ...snapshot.data() });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Failed to create component", error);
    return NextResponse.json({ error: "Failed to create component" }, { status: 500 });
  }
}
