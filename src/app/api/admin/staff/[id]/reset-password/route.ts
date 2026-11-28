import { NextResponse } from "next/server";
import {
  getAllUsernamesServer,
  getTeamMembersServer,
  updateStaffPasswordServer,
} from "@/lib/firebase/admin-db";
import {
  generateDefaultPassword,
  generateNextUsername,
  hashPassword,
} from "@/lib/auth-passwords";
import { EmailDispatchResult, sendStaffPasswordResetEmail } from "@/lib/email";
import { requireAuth } from "@/lib/auth-session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const authResult = await requireAuth(request, ["admin"]);
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const members = await getTeamMembersServer();
    const member = members.find(
      (m) => m.id === id || (m as unknown as Record<string, unknown>).internalId === id
    );

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Staff member not found" },
        { status: 404 }
      );
    }

    const tempPassword = generateDefaultPassword();
    const { hash, salt } = hashPassword(tempPassword);

    let assignedUsername = member.username;
    if (!assignedUsername) {
      const existingUsernames = await getAllUsernamesServer();
      assignedUsername = generateNextUsername(member.role, existingUsernames);
    }

    await updateStaffPasswordServer(member.id, hash, salt, {
      mustChangePassword: true,
      username: member.username ? undefined : assignedUsername,
    });

    let emailResult: EmailDispatchResult = { success: true, simulated: true };
    try {
      emailResult = await sendStaffPasswordResetEmail({
        to: member.email,
        name: member.name,
        username: assignedUsername,
        defaultPassword: tempPassword,
        role: member.role,
        desk: member.desk,
      });
    } catch (emailErr) {
      console.warn("Staff password reset email dispatch error:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: emailResult.simulated
        ? `New passcode generated for ${member.name}. SMTP is not configured, so copy and share the credentials below.`
        : `New passcode generated and emailed to ${member.email}.`,
      credentials: {
        username: assignedUsername,
        defaultPassword: tempPassword,
        emailSent: !emailResult.simulated,
        simulated: !!emailResult.simulated,
      },
    });
  } catch (error) {
    console.error("Admin reset staff password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset staff passcode" },
      { status: 500 }
    );
  }
}

