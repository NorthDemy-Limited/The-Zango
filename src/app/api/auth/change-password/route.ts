import { NextResponse } from "next/server";
import { findStaffByIdentifier, updateStaffPassword } from "@/lib/firebase/db";
import { hashPassword, verifyPassword } from "@/lib/auth-passwords";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, currentPassword, newPassword, confirmNewPassword } = body;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return NextResponse.json(
        { success: false, message: "Identifier is required." },
        { status: 400 }
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

    const clean = identifier.trim().toLowerCase();
    const staff = await findStaffByIdentifier(clean);

    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Newsroom account not found." },
        { status: 404 }
      );
    }

    // Verify current password
    let isCurrentValid = false;
    if (staff.passwordHash && staff.passwordSalt) {
      isCurrentValid = verifyPassword(currentPassword, staff.passwordHash, staff.passwordSalt);
    } else {
      isCurrentValid = currentPassword === "password123";
    }

    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: "Current passcode is incorrect." },
        { status: 401 }
      );
    }

    // Hash new password using Scrypt
    const { hash, salt } = hashPassword(newPassword);

    // Save to persistent storage
    await updateStaffPassword(staff.id, hash, salt);

    return NextResponse.json({
      success: true,
      message: "Passcode updated successfully. Use your new password on subsequent logins.",
    });
  } catch (error) {
    console.error("Change password route error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update password. Please try again." },
      { status: 500 }
    );
  }
}

