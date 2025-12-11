import { NextResponse } from "next/server";
import { collection, doc, getDocs, getFirestore, setDoc } from "firebase/firestore";
import { seedPages } from "@/lib/admin/pages";
import { getFirebaseApp } from "@/lib/firebaseClient";

const collectionName = "pages";

function isAuthorized(request: Request): boolean {
  const token = process.env.SEED_TOKEN;
  if (!token) return true;
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.replace("Bearer ", "") : null;
  return bearer === token;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return NextResponse.json(
      { error: "Firebase env vars missing; cannot seed Firestore." },
      { status: 400 }
    );
  }

  try {
    const db = getFirestore(getFirebaseApp());
    const pagesRef = collection(db, collectionName);
    await Promise.all(seedPages.map((page) => setDoc(doc(db, collectionName, page.id), page)));
    const snapshot = await getDocs(pagesRef);
    const seeded = snapshot.docs.map((docSnap) => docSnap.id);
    return NextResponse.json({ seeded, count: seeded.length });
  } catch (error) {
    console.error("Failed to seed Firestore", error);
    return NextResponse.json({ error: "Failed to seed Firestore." }, { status: 500 });
  }
}
