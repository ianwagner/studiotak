import { NextResponse } from "next/server";
import { collection, doc, getDocs, getFirestore, updateDoc } from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebaseClient";

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
      { error: "Firebase env vars missing; cannot migrate Firestore." },
      { status: 400 }
    );
  }

  try {
    const db = getFirestore(getFirebaseApp());
    const mediaRef = collection(db, "media");
    const snapshot = await getDocs(mediaRef);

    const needsUpdate = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      return !data.status;
    });

    await Promise.all(
      needsUpdate.map((docSnap) =>
        updateDoc(doc(db, "media", docSnap.id), { status: "published" })
      )
    );

    return NextResponse.json({
      updated: needsUpdate.length,
      total: snapshot.size,
      message: `Set status: "published" on ${needsUpdate.length} media docs (${snapshot.size} total).`,
    });
  } catch (error) {
    console.error("Failed to migrate media status", error);
    return NextResponse.json({ error: "Failed to migrate media status." }, { status: 500 });
  }
}
