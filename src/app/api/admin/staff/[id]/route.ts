import { NextResponse } from "next/server";
import { 
  getTeamMembers, 
  updateTeamMemberRole, 
  updateTeamMemberStatus, 
  deleteTeamMember 
} from "@/lib/firebase/db";
import { NewsroomRole } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const PROTECTED_ADMIN_EMAILS = ["usman.bello@thezango.org"];
const PROTECTED_ADMIN_IDS = ["usr-admin-1", "member-1"];

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const members = await getTeamMembers();
    const member = members.find((m) => m.id === id);

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("Admin get staff member error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, status } = body;

    const members = await getTeamMembers();
    const member = members.find((m) => m.id === id);

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Staff member not found" },
        { status: 404 }
      );
    }

    // Guard permanent root admin
    const isRootAdmin =
      PROTECTED_ADMIN_IDS.includes(member.id) ||
      PROTECTED_ADMIN_EMAILS.includes(member.email.toLowerCase());

    if (isRootAdmin) {
      if (role && role !== "admin") {
        return NextResponse.json(
          { success: false, message: "The permanent Bureau Chief role cannot be modified" },
          { status: 403 }
        );
      }
      if (status && status !== "active") {
        return NextResponse.json(
          { success: false, message: "The permanent Bureau Chief must remain active" },
          { status: 403 }
        );
      }
    }

    if (role) {
      if (!["admin", "editor", "writer"].includes(role)) {
        return NextResponse.json(
          { success: false, message: "Invalid role specified" },
          { status: 400 }
        );
      }
      await updateTeamMemberRole(id, role as NewsroomRole);
    }

    if (status) {
      if (!["active", "inactive"].includes(status)) {
        return NextResponse.json(
          { success: false, message: "Status must be 'active' or 'inactive'" },
          { status: 400 }
        );
      }
      await updateTeamMemberStatus(id, status as "active" | "inactive");
    }

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully",
    });
  } catch (error) {
    console.error("Admin update staff member error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const members = await getTeamMembers();
    const member = members.find((m) => m.id === id);

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Staff member not found" },
        { status: 404 }
      );
    }

    // Guard permanent root admin
    if (
      PROTECTED_ADMIN_IDS.includes(member.id) ||
      PROTECTED_ADMIN_EMAILS.includes(member.email.toLowerCase())
    ) {
      return NextResponse.json(
        { success: false, message: "Cannot remove the permanent Bureau Chief" },
        { status: 403 }
      );
    }

    const success = await deleteTeamMember(id);
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to delete staff member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff member removed from newsroom roster",
    });
  } catch (error) {
    console.error("Admin delete staff member error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}

