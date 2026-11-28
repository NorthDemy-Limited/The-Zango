import { NextResponse } from "next/server";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  findStaffByIdentifierServer,
  getOrCreateUserProfileServer,
} from "@/lib/firebase/admin-db";
import { attachSessionCookie, createSessionToken } from "@/lib/auth-session";
import { UserRole } from "@/types";

interface FirebaseLookupUser {
  localId: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Firebase ID token is required." },
        { status: 400 }
      );
    }

    let fbUser: FirebaseLookupUser | null = null;

    if (isFirebaseAdminConfigured && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        fbUser = {
          localId: decoded.uid,
          email: decoded.email,
          displayName: decoded.name,
          photoUrl: decoded.picture,
        };
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid or expired Firebase authentication token." },
          { status: 401 }
        );
      }
    } else {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { success: false, message: "Firebase is not configured on the server." },
          { status: 500 }
        );
      }

      const lookupRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      if (!lookupRes.ok) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired Firebase authentication token." },
          { status: 401 }
        );
      }

      const lookupData = (await lookupRes.json()) as { users?: FirebaseLookupUser[] };
      fbUser = lookupData.users?.[0] || null;
    }

    if (!fbUser || !fbUser.localId || !fbUser.email) {
      return NextResponse.json(
        { success: false, message: "Unable to verify Firebase user identity." },
        { status: 401 }
      );
    }

    // Check if the verified email belongs to an active newsroom staff member
    const staff = await findStaffByIdentifierServer(fbUser.email.toLowerCase());
    if (staff) {
      if (staff.status === "inactive") {
        return NextResponse.json(
          { success: false, message: "This newsroom clearance has been deactivated." },
          { status: 403 }
        );
      }

      const mappedRole: UserRole = staff.role === "writer" ? "author" : (staff.role as UserRole);
      const badge =
        staff.role === "admin"
          ? "Chief Admin"
          : staff.role === "editor"
          ? "Desk Editor"
          : "Staff Writer";

      const staffSession = {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        username: staff.username,
        role: mappedRole,
        desk: staff.desk,
        avatar: staff.avatar || fbUser.photoUrl || "/assets/social-image-1.png",
        bio: staff.bio || "",
        badge,
        mustChangePassword: !!staff.mustChangePassword,
      };

      const token = await createSessionToken(staffSession);
      const response = NextResponse.json({ success: true, user: staffSession });
      return attachSessionCookie(response, token);
    }

    // Otherwise sync public reader profile (defaults to "reader")
    const profile = await getOrCreateUserProfileServer(
      {
        uid: fbUser.localId,
        email: fbUser.email,
        displayName: fbUser.displayName || null,
        photoURL: fbUser.photoUrl || null,
      },
      "reader"
    );

    const readerSession = {
      id: fbUser.localId,
      name: profile.displayName,
      email: profile.email,
      role: profile.role,
      desk: profile.desk || "Public Reader",
      avatar: profile.photoURL || "/assets/social-image-3.png",
      bio: profile.bio || "",
      badge:
        profile.role === "admin"
          ? "Chief Admin"
          : profile.role === "editor"
          ? "Desk Editor"
          : profile.role === "reader"
          ? "Reader"
          : "Staff Writer",
      mustChangePassword: false,
    };

    const token = await createSessionToken(readerSession);
    const response = NextResponse.json({ success: true, user: readerSession });
    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("Firebase session exchange error:", error);
    return NextResponse.json(
      { success: false, message: "Could not establish server session." },
      { status: 500 }
    );
  }
}

