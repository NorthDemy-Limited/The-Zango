import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  hasRoleAccess,
  verifySessionToken,
} from "@/lib/auth-session";
import { UserRole } from "@/types";

function getRequiredRolesForPath(pathname: string): UserRole[] | null {
  if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/api/admin")) {
    return ["admin"];
  }
  if (pathname.startsWith("/dashboard/editor") || pathname.startsWith("/api/editor")) {
    return ["admin", "editor"];
  }
  if (
    pathname.startsWith("/dashboard/author") ||
    pathname.startsWith("/api/writer") ||
    pathname.startsWith("/api/upload")
  ) {
    return ["admin", "editor", "writer", "author"];
  }
  if (pathname.startsWith("/dashboard")) {
    return ["admin", "editor", "writer", "author"];
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiredRoles = getRequiredRolesForPath(pathname);

  if (!requiredRoles) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  const isApiRoute = pathname.startsWith("/api/");

  if (!session) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!hasRoleAccess(session.role, requiredRoles)) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: "Forbidden: insufficient newsroom clearance." },
        { status: 403 }
      );
    }
    const fallbackPath =
      session.role === "editor"
        ? "/dashboard/editor"
        : session.role === "writer" || session.role === "author"
        ? "/dashboard/author"
        : "/login?unauthorized=true";
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/editor/:path*",
    "/api/writer/:path*",
    "/api/upload",
  ],
};

