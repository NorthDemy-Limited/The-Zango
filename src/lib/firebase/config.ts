import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDAhMKBFkTlOdJp80S0cS_dVcpB4DzfilM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "the-zango.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-zango",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "the-zango.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "519891525605",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:519891525605:web:1192789731cbf553e2190c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GX8KHD43BE",
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;
let storage: FirebaseStorage | null = null;

const isBuild = process.env.npm_lifecycle_event === "build";
const enableDuringBuild = process.env.FIREBASE_BUILD_CONNECT === "true";

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    if (!isBuild || enableDuringBuild) {
      db = getFirestore(app);
      try {
        storage = getStorage(app);
      } catch (e) {
        console.warn("Storage init warning:", e);
      }
    }
    auth = getAuth(app);
    if (typeof window !== "undefined") {
      isSupported()
        .then((supported) => {
          if (supported && app) {
            analytics = getAnalytics(app);
          }
        })
        .catch(() => {});
    }
  } catch (error) {
    console.warn("Firebase initialization warning (falling back to mock state):", error);
  }
}

export { app, db, auth, analytics, storage };
