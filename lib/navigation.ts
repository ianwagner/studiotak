import { collection, getDocs, getFirestore, orderBy, query } from "firebase/firestore";
import type { NavigationItemRecord } from "./admin/navigation";
import { normalizeNavigationShape, seedNavigation } from "./admin/navigation";
import { getFirebaseApp } from "./firebaseClient";

const collectionName = "navigation";

const sortNav = (items: NavigationItemRecord[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label));

export async function getNavigationItems(): Promise<NavigationItemRecord[]> {
  const fallback = sortNav(seedNavigation);
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return fallback;
  }

  try {
    const db = getFirestore(getFirebaseApp());
    const ref = collection(db, collectionName);
    const q = query(ref, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return fallback;
    const records = snapshot.docs.map((doc) => normalizeNavigationShape({ id: doc.id, ...(doc.data() as any) }));
    return sortNav(records);
  } catch (error) {
    console.error("Failed to load navigation from Firestore", error);
    return fallback;
  }
}
