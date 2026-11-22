import { NextResponse } from "next/server";
import { findStaffByIdentifier } from "@/lib/firebase/db";
import { verifyPassword } from "@/lib/auth-passwords";
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
    const staff = await findStaffByIdentifier(clean);

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

    // Verify cryptographic scrypt hash
    let isValid = false;
    if (staff.passwordHash && staff.passwordSalt) {
      isValid = verifyPassword(password, staff.passwordHash, staff.passwordSalt);
    } else {
      // Fallback for initial unhashed development accounts
      isValid = password === "password123";
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid clearance passcode." },
        { status: 401 }
      );
    }

    // Role mapping
    const mappedRole: UserRole = staff.role === "writer" ? "author" : (staff.role as UserRole);
    const badge =
      staff.role === "admin"
        ? "Chief Admin"
        : staff.role === "editor"
        ? "Desk Editor"
        : "Staff Writer";

    return NextResponse.json({
      success: true,
      message: "Clearance authenticated successfully.",
      user: {
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
      },
    });
  } catch (error) {
    console.error("Login verification route error:", error);
    return NextResponse.json(
      { success: false, message: "Internal clearance error occurred." },
      { status: 500 }
    );
  }
}

