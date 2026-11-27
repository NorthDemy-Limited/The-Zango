import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { UserRole } from "@/types";

export const SESSION_COOKIE_NAME = "thezango_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  desk: string;
  avatar: string;
  bio?: string;
  badge: string;
  mustChangePassword?: boolean;
  exp: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getSessionSecret(): string {
  const configured =
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (configured && configured.length >= 16) {
    return configured;
  }

  // Deterministic fallback derived from project config so deployments without
  // AUTH_SESSION_SECRET do not crash, while still signing tokens with HMAC-SHA256.
  const projectSeed =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "thezango-local-dev";

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[Auth Security] AUTH_SESSION_SECRET is not set in environment variables. Set a strong 32+ character AUTH_SESSION_SECRET in production."
    );
  }

  return `thezango-hmac-key::${projectSeed}`;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(): Promise<CryptoKey> {
  const secretBytes = textEncoder.encode(getSessionSecret());
  return crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  user: Omit<SessionUser, "exp">,
  ttlSeconds: number = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const payload: SessionUser = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = toBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(encodedPayload)
  );
  const encodedSignature = toBase64Url(new Uint8Array(signatureBuffer));
  return `${encodedPayload}.${encodedSignature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token || typeof token !== "string") return null;

  const dotIndex = token.indexOf(".");
  if (dotIndex <= 0) return null;

  const encodedPayload = token.slice(0, dotIndex);
  const encodedSignature = token.slice(dotIndex + 1);
  if (!encodedPayload || !encodedSignature) return null;

  try {
    const key = await importHmacKey();
    const signatureBytes = fromBase64Url(encodedSignature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer as ArrayBuffer,
      textEncoder.encode(encodedPayload)
    );

    if (!isValid) return null;

    const payloadJson = textDecoder.decode(fromBase64Url(encodedPayload));
    const parsed = JSON.parse(payloadJson) as SessionUser;

    if (!parsed || !parsed.id || !parsed.email || !parsed.role || !parsed.exp) {
      return null;
    }

    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function attachSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(eqIdx + 1).trim());
    }
  }
  return null;
}

export async function getSessionFromRequest(request: Request): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get("cookie");
  const token = parseCookieHeader(cookieHeader, SESSION_COOKIE_NAME);
  return verifySessionToken(token);
}

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function hasRoleAccess(userRole: UserRole | undefined | null, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  if (userRole === "admin") return true;
  if (userRole === "editor") {
    return (
      allowedRoles.includes("editor") ||
      allowedRoles.includes("writer") ||
      allowedRoles.includes("author")
    );
  }
  if (userRole === "writer" || userRole === "author") {
    return allowedRoles.includes("writer") || allowedRoles.includes("author");
  }
  return allowedRoles.includes(userRole);
}

export async function requireAuth(
  request: Request,
  allowedRoles: UserRole[]
): Promise<{ session: SessionUser; error?: never } | { session?: never; error: NextResponse }> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }

  if (!hasRoleAccess(session.role, allowedRoles)) {
    return {
      error: NextResponse.json(
        { success: false, message: "Forbidden: insufficient newsroom clearance." },
        { status: 403 }
      ),
    };
  }

  return { session };
}

