import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { localAuthBypassEnabled } from "./localAuthBypass";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let appCheckInitialized = false;
let devAuthPromise: Promise<void> | null = null;

function assertConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing Firebase config env vars: ${missing.join(", ")}`);
  }
}

function initAppCheck(app: FirebaseApp) {
  if (appCheckInitialized) return;
  if (typeof window === "undefined") return;
  if (localAuthBypassEnabled) return;

  const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
  if (debugToken) {
    // Allow local testing without real App Check tokens.
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  if (!siteKey) return;

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true
  });
  appCheckInitialized = true;
}

export function getFirebaseApp(): FirebaseApp {
  assertConfig();
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    initAppCheck(app);
    return app;
  }
  const app = getApp();
  initAppCheck(app);
  return app;
}

// In local development we bypass the full auth flow for the admin UI, but Firebase Storage
// still requires a signed-in user to satisfy security rules. This helper signs in anonymously
// once per session so uploads work when NODE_ENV !== "production".
export async function ensureFirebaseDevAuth(): Promise<void> {
  if (!localAuthBypassEnabled) return;
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
  if (devAuthPromise) return devAuthPromise;

  devAuthPromise = (async () => {
    const auth = getAuth(getFirebaseApp());
    if (auth.currentUser) return;
    await signInAnonymously(auth);
  })().finally(() => {
    devAuthPromise = null;
  });

  return devAuthPromise;
}
