import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import debugLog from "../utils/debugLog";

// ✅ Fixed: Correct Firebase config
// Configuration is read from the Vite environment so that sensitive values can
// be provided via a `.env` file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // Bucket is manually created in Google Cloud Storage, not a Firebase-managed
  // bucket, so omit the `.appspot.com` suffix.
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log loaded Firebase configuration to verify environment variables
debugLog('Firebase config', firebaseConfig);

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export services you'll use
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
