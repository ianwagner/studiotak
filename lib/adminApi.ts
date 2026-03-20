import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    adminApp = initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Falls back to Application Default Credentials or project ID
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
  }
  return adminApp;
}

export function getDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function isAuthorized(request: Request): boolean {
  const token = process.env.SEED_TOKEN;
  if (!token) return true;
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.replace("Bearer ", "") : null;
  return bearer === token;
}

export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, any>).reduce((acc, [key, val]) => {
      if (val === undefined) return acc;
      (acc as any)[key] = stripUndefined(val);
      return acc;
    }, {} as any) as T;
  }
  return value;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function missingFirebase() {
  return Response.json({ error: "Firebase not configured" }, { status: 400 });
}

export function firebaseConfigured(): boolean {
  return !!(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

/**
 * Check that no other page document uses the given slug.
 * Returns the conflicting page ID if one exists, or null if the slug is available.
 */
export async function findConflictingSlug(slug: string, excludeId: string): Promise<string | null> {
  const db = getDb();
  const snapshot = await db
    .collection("pages")
    .where("slug", "==", slug)
    .limit(10)
    .get();

  for (const doc of snapshot.docs) {
    if (doc.id !== excludeId) return doc.id;
  }
  return null;
}
