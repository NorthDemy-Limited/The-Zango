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

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

export const isFirebaseAdminConfigured = Boolean(projectId && clientEmail && privateKey);

let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchWithRetry(
  url: string,
  init?: RequestInit & { next?: { revalidate?: number } },
  retries = 1
): Promise<Response> {
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

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function getAdminAccessToken(): Promise<string> {
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const signingInput = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = base64UrlEncode(signer.sign(privateKey));
  const assertion = `${signingInput}.${signature}`;

  const res = await fetchWithRetry("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to obtain Firebase Admin OAuth token: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600),
  };
  return data.access_token;
}

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

function toFirestoreValue(val: unknown): FirestoreValue {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    return { mapValue: { fields: toFirestoreFields(val as Record<string, unknown>) } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

function fromFirestoreValue(val: FirestoreValue): unknown {
  if ("stringValue" in val) return val.stringValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return val.doubleValue;
  if ("timestampValue" in val) return val.timestampValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ("mapValue" in val) {
    return fromFirestoreFields(val.mapValue.fields || {});
  }
  return null;
}

function fromFirestoreFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = fromFirestoreValue(v);
  }
  return out;
}

function docsBaseUrl(): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

export async function fsGetDoc(
  collectionName: string,
  docId: string
): Promise<Record<string, unknown> | null> {
  const token = await getAdminAccessToken();
  const url = `${docsBaseUrl()}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`;
  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Firestore GET ${collectionName}/${docId} failed: ${res.status}`);
  }
  const json = (await res.json()) as { name: string; fields?: Record<string, FirestoreValue> };
  return { ...fromFirestoreFields(json.fields || {}), id: docId };
}

export async function fsListDocs(
  collectionName: string,
  revalidateSeconds?: number
): Promise<Array<Record<string, unknown> & { id: string }>> {
  const token = await getAdminAccessToken();
  const docs: Array<Record<string, unknown> & { id: string }> = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${docsBaseUrl()}/${encodeURIComponent(collectionName)}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetchWithRetry(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      ...(revalidateSeconds !== undefined
        ? { next: { revalidate: revalidateSeconds } }
        : { cache: "no-store" as const }),
    });
    if (!res.ok) {
      throw new Error(`Firestore LIST ${collectionName} failed: ${res.status}`);
    }
    const json = (await res.json()) as {
      documents?: Array<{ name: string; fields?: Record<string, FirestoreValue> }>;
      nextPageToken?: string;
    };
    for (const d of json.documents || []) {
      const id = d.name.split("/").pop() || "";
      docs.push({ ...fromFirestoreFields(d.fields || {}), id });
    }
    pageToken = json.nextPageToken;
  } while (pageToken);

  return docs;
}

export async function fsSetDoc(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const token = await getAdminAccessToken();
  const url = `${docsBaseUrl()}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`;
  const res = await fetchWithRetry(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore SET ${collectionName}/${docId} failed: ${res.status} ${text}`);
  }
}

export async function fsUpdateDoc(
  collectionName: string,
  docId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const token = await getAdminAccessToken();
  const cleanFields = toFirestoreFields(updates);
  const fieldPaths = Object.keys(cleanFields);
  if (fieldPaths.length === 0) return;

  const url = new URL(
    `${docsBaseUrl()}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`
  );
  for (const fp of fieldPaths) {
    url.searchParams.append("updateMask.fieldPaths", fp);
  }

  const res = await fetchWithRetry(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: cleanFields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore UPDATE ${collectionName}/${docId} failed: ${res.status} ${text}`);
  }
}

export async function fsAddDoc(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  const token = await getAdminAccessToken();
  const url = `${docsBaseUrl()}/${encodeURIComponent(collectionName)}`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore ADD ${collectionName} failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { name: string };
  return json.name.split("/").pop() || "";
}

export async function fsDeleteDoc(collectionName: string, docId: string): Promise<void> {
  const token = await getAdminAccessToken();
  const url = `${docsBaseUrl()}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`;
  const res = await fetchWithRetry(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Firestore DELETE ${collectionName}/${docId} failed: ${res.status} ${text}`);
  }
}
