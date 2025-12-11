import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let appCheckInitialized = false;

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
