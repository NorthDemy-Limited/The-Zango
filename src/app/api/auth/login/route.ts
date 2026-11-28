import { NextResponse } from "next/server";
import { findStaffByIdentifierServer } from "@/lib/firebase/admin-db";
import { verifyPassword } from "@/lib/auth-passwords";
import { attachSessionCookie, createSessionToken } from "@/lib/auth-session";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import { UserRole } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return NextResponse.json(
        { success: false, message: "Username or email is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Passcode is required." },
        { status: 400 }
      );
    }

    const clean = identifier.trim().toLowerCase();
    const ip = getClientIp(request);
    const rateKey = `login:${ip}:${clean}`;
    const rate = checkRateLimit(rateKey, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many failed login attempts. Please try again in ${Math.ceil(rate.retryAfterSeconds / 60)} minute(s).`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        }
      );
    }

    const staff = await findStaffByIdentifierServer(clean);

    if (!staff) {
      return NextResponse.json(
        { success: false, message: "No newsroom account found matching those credentials." },
        { status: 401 }
      );
    }

    if (staff.status === "inactive") {
      return NextResponse.json(
        { success: false, message: "This newsroom clearance has been deactivated. Contact the Bureau Chief." },
        { status: 403 }
      );
    }

    // Verify cryptographic scrypt hash (no plaintext fallback in production)
    if (!staff.passwordHash || !staff.passwordSalt) {
      return NextResponse.json(
        {
          success: false,
          message: "This account has no password configured. Contact the Bureau Chief to reset your credentials.",
        },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, staff.passwordHash, staff.passwordSalt);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid clearance passcode." },
        { status: 401 }
      );
    }

    resetRateLimit(rateKey);

    const mappedRole: UserRole = staff.role === "writer" ? "author" : (staff.role as UserRole);
    const badge =
      staff.role === "admin"
        ? "Chief Admin"
        : staff.role === "editor"
        ? "Desk Editor"
        : "Staff Writer";

    const sessionUser = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      username: staff.username || clean,
      role: mappedRole,
      desk: staff.desk,
      avatar: staff.avatar || "/assets/social-image-1.png",
      bio: staff.bio || "",
      badge,
      mustChangePassword: !!staff.mustChangePassword,
    };

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({
      success: true,
      message: "Clearance authenticated successfully.",
      user: sessionUser,
    });

    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("Login verification route error:", error);
    return NextResponse.json(
      { success: false, message: "Internal clearance error occurred." },
      { status: 500 }
    );
  }
}
