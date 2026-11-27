import { NextResponse } from "next/server";
import { findStaffByIdentifier, updateStaffPassword } from "@/lib/firebase/db";
import { hashPassword, verifyPassword } from "@/lib/auth-passwords";
import {
  attachSessionCookie,
  createSessionToken,
  getSessionFromRequest,
} from "@/lib/auth-session";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required. Please sign in first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { identifier, currentPassword, newPassword, confirmNewPassword } = body;

    const clean = (identifier || session.email || session.username || "").trim().toLowerCase();
    if (!clean) {
      return NextResponse.json(
        { success: false, message: "Identifier is required." },
        { status: 400 }
      );
    }

    // Prevent non-admins from changing another user's password
    const isOwnAccount =
      clean === session.email.toLowerCase() ||
      (session.username && clean === session.username.toLowerCase());
    if (!isOwnAccount && session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: you can only update your own passcode." },
        { status: 403 }
      );
    }

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { success: false, message: "Current password is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { success: false, message: "New password and confirmation do not match." },
        { status: 400 }
      );
    }

    const staff = await findStaffByIdentifier(clean);

    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Newsroom account not found." },
        { status: 404 }
      );
    }

    if (!staff.passwordHash || !staff.passwordSalt) {
      return NextResponse.json(
        { success: false, message: "Account has no password hash configured. Contact an administrator." },
        { status: 400 }
      );
    }

    const isCurrentValid = verifyPassword(currentPassword, staff.passwordHash, staff.passwordSalt);

    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: "Current passcode is incorrect." },
        { status: 401 }
      );
    }

    const { hash, salt } = hashPassword(newPassword);
    await updateStaffPassword(staff.id, hash, salt);

    const response = NextResponse.json({
      success: true,
      message: "Passcode updated successfully. Use your new password on subsequent logins.",
    });

    if (isOwnAccount) {
      const refreshedToken = await createSessionToken({
        id: session.id,
        name: session.name,
        email: session.email,
        username: session.username,
        role: session.role,
        desk: session.desk,
        avatar: session.avatar,
        bio: session.bio,
        badge: session.badge,
        mustChangePassword: false,
      });
      attachSessionCookie(response, refreshedToken);
    }

    return response;
  } catch (error) {
    console.error("Change password route error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update password. Please try again." },
      { status: 500 }
    );
  }
}
