import { NextResponse } from "next/server";
import { collection, doc, getDocs, getFirestore, updateDoc } from "firebase/firestore";
import { normalizeSlugPath } from "@/lib/pageContent";
import { getFirebaseApp } from "@/lib/firebaseClient";
import { getSiteUrl } from "@/lib/siteUrl";

const collectionName = "pages";
const legacyDomain = "studio-tak.example";

function isAuthorized(request: Request): boolean {
  const token = process.env.SEED_TOKEN;
  if (!token) return true;
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.replace("Bearer ", "") : null;
  return bearer === token;
}

const shouldUpdateCanonical = (canonicalUrl?: string | null): boolean => {
  if (!canonicalUrl?.trim()) return true;
  try {
    const url = new URL(canonicalUrl);
    return url.hostname === "studiotak.co" || canonicalUrl.includes(legacyDomain);
  } catch {
    return false;
  }
};

const buildCanonical = (slug: string, siteBase: string): string => {
  const normalized = normalizeSlugPath(slug);
  return new URL(normalized === "/" ? "/" : normalized, siteBase).toString();
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
    const siteBase = getSiteUrl();
    const db = getFirestore(getFirebaseApp());
    const pagesRef = collection(db, collectionName);
    const snapshot = await getDocs(pagesRef);
    const updates = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() as { slug?: string; canonicalUrl?: string | null };
        if (!data?.slug) return null;
        if (!shouldUpdateCanonical(data.canonicalUrl)) return null;
        const canonicalUrl = buildCanonical(data.slug, siteBase);
        return { id: docSnap.id, canonicalUrl };
      })
      .filter((entry): entry is { id: string; canonicalUrl: string } => Boolean(entry));

    await Promise.all(
      updates.map((update) => updateDoc(doc(db, collectionName, update.id), { canonicalUrl: update.canonicalUrl }))
    );

    return NextResponse.json({
      updated: updates.map((entry) => entry.id),
      count: updates.length,
      total: snapshot.size
    });
  } catch (error) {
    console.error("Failed to migrate canonicals", error);
    return NextResponse.json({ error: "Failed to migrate canonicals." }, { status: 500 });
  }
}
