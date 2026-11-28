import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getFirestore, initializeFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let cleaned = raw.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, "\n");
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

export const isFirebaseAdminConfigured = Boolean(projectId && clientEmail && privateKey);

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

if (isFirebaseAdminConfigured && projectId && clientEmail && privateKey) {
  try {
    adminApp = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
    try {
      adminDb = initializeFirestore(adminApp, { preferRest: true });
    } catch {
      adminDb = getFirestore(adminApp);
    }
    adminAuth = getAuth(adminApp);
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
  }
}

export { adminApp, adminDb, adminAuth };

