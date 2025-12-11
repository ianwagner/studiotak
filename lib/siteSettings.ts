import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { getFirebaseApp } from "./firebaseClient";

export type SiteSettings = {
  faviconUrl: string;
  touchIconUrl: string;
  logoUrl: string;
  notFoundIconUrl: string;
  updatedAt?: string;
};

export const seedSiteSettings: SiteSettings = {
  faviconUrl: "",
  touchIconUrl: "",
  logoUrl: "",
  notFoundIconUrl: ""
};

const collectionName = "site-settings";
const documentId = "global";
const hasFirebaseConfig = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
let inMemorySettings: SiteSettings | null = null;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const normalizeSettings = (raw: any): SiteSettings => {
  const updatedAt = raw?.updatedAt?.toDate?.()?.toISOString?.() ?? raw?.updatedAt;
  return {
    ...seedSiteSettings,
    ...raw,
    updatedAt
  };
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const fallback = inMemorySettings ?? seedSiteSettings;
  if (!hasFirebaseConfig) {
    return clone(fallback);
  }
  try {
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, collectionName, documentId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      const payload = { ...seedSiteSettings, updatedAt: new Date().toISOString() };
      await setDoc(ref, payload);
      inMemorySettings = payload;
      return clone(payload);
    }
    const settings = normalizeSettings(snapshot.data());
    inMemorySettings = settings;
    return clone(settings);
  } catch (error) {
    console.error("Failed to load site settings from Firestore", error);
    return clone(fallback);
  }
}

export async function saveSiteSettings(values: SiteSettings): Promise<SiteSettings> {
  const payload = { ...seedSiteSettings, ...values, updatedAt: new Date().toISOString() };

  if (!hasFirebaseConfig) {
    throw new Error("Firebase env vars are missing; cannot save site settings.");
  }

  try {
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, collectionName, documentId);
    await setDoc(ref, payload, { merge: true });
    inMemorySettings = payload;
    return clone(payload);
  } catch (error) {
    console.error("Failed to save site settings to Firestore", error);
    inMemorySettings = payload;
    return clone(payload);
  }
}

export const siteSettingsFirebaseReady = hasFirebaseConfig;
