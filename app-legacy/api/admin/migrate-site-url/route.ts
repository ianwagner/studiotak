import { NextResponse } from "next/server";
import { collection, getDocs, getFirestore, updateDoc } from "firebase/firestore";
import { ensureFirebaseDevAuth, getFirebaseApp } from "@/lib/firebaseClient";

const collectionName = "pages";

function isAuthorized(request: Request): boolean {
  const token = process.env.SEED_TOKEN;
  if (!token) return true;
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.replace("Bearer ", "") : null;
  return bearer === token;
}

const buildNextUrl = (current: string, newOrigin: string): string | null => {
  try {
    const parsed = new URL(current);
    return `${newOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return NextResponse.json(
      { error: "Firebase env vars missing; cannot migrate Firestore." },
      { status: 400 }
    );
  }

  try {
    const oldBase = process.env.OLD_SITE_URL ?? "https://studio-tak.example";
    const newBase = process.env.NEW_SITE_URL ?? "https://studiotak.co";
    const oldOrigin = new URL(oldBase).origin;
    const newOrigin = new URL(newBase).origin;

    const db = getFirestore(getFirebaseApp());
    const pagesRef = collection(db, collectionName);
    const snapshot = await getDocs(pagesRef);
    const updates: Promise<void>[] = [];
    const updatedIds: string[] = [];

    await ensureFirebaseDevAuth();

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as { canonicalUrl?: string };
      const canonicalUrl = data.canonicalUrl?.trim();
      if (!canonicalUrl) return;
      let parsed: URL;
      try {
        parsed = new URL(canonicalUrl);
      } catch {
        return;
      }
      if (parsed.origin !== oldOrigin) return;
      const nextUrl = buildNextUrl(canonicalUrl, newOrigin);
      if (!nextUrl || nextUrl === canonicalUrl) return;
      updates.push(updateDoc(docSnap.ref, { canonicalUrl: nextUrl }));
      updatedIds.push(docSnap.id);
    });

    await Promise.all(updates);

    return NextResponse.json({ updated: updatedIds, count: updatedIds.length });
  } catch (error) {
    console.error("Failed to migrate site URLs", error);
    return NextResponse.json({ error: "Failed to migrate site URLs." }, { status: 500 });
  }
}
