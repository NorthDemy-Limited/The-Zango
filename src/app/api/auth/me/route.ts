import { NextResponse } from "next/server";
import { findStaffByIdentifier } from "@/lib/firebase/db";
import { clearSessionCookie, getSessionFromRequest } from "@/lib/auth-session";
import { UserRole } from "@/types";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    // Re-validate staff accounts against Firestore so revoked/deleted staff cannot retain access
    if (session.role !== "reader") {
      const staff = await findStaffByIdentifier(session.email || session.username || "");
      if (!staff || staff.status === "inactive") {
        const res = NextResponse.json(
          { authenticated: false, user: null, message: "Session is no longer active." },
          { status: 401 }
        );
        return clearSessionCookie(res);
      }

      const mappedRole: UserRole = staff.role === "writer" ? "author" : (staff.role as UserRole);
      const badge =
        staff.role === "admin"
          ? "Chief Admin"
          : staff.role === "editor"
          ? "Desk Editor"
          : "Staff Writer";

      return NextResponse.json({
        authenticated: true,
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          username: staff.username || session.username,
          role: mappedRole,
          desk: staff.desk,
          avatar: staff.avatar || session.avatar || "/assets/social-image-1.png",
          bio: staff.bio || "",
          badge,
          mustChangePassword: !!staff.mustChangePassword,
        },
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        username: session.username,
        role: session.role,
        desk: session.desk,
        avatar: session.avatar,
        bio: session.bio || "",
        badge: session.badge,
        mustChangePassword: !!session.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }
}

