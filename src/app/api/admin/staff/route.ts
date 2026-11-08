import { NextResponse } from "next/server";
import { getTeamMembers, createTeamMember } from "@/lib/firebase/db";
import { NewsroomRole } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const desk = searchParams.get("desk");
    const query = searchParams.get("query");

    let members = await getTeamMembers();

    if (role && role !== "all") {
      members = members.filter((m) => m.role === role);
    }

    if (status && status !== "all") {
      members = members.filter((m) => m.status === status);
    }

    if (desk && desk !== "all") {
      members = members.filter((m) => m.desk.toLowerCase() === desk.toLowerCase());
    }

    if (query) {
      const q = query.toLowerCase();
      members = members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.desk.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      count: members.length,
      members,
    });
  } catch (error) {
    console.error("Admin get staff error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch staff members" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, desk, avatar, bio, status } = body;

    if (!name || !name.trim() || !email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name and corporate email are required" },
        { status: 400 }
      );
    }

    if (!["admin", "editor", "writer"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Role must be 'admin', 'editor', or 'writer'" },
        { status: 400 }
      );
    }

    const newMember = await createTeamMember({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role as NewsroomRole,
      desk: desk || "Technology & Digital Economy",
      avatar: avatar || "/assets/social-image-1.png",
      bio: bio?.trim() || "",
      status: (status as "active" | "inactive") || "active",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Newsroom staff member added successfully",
        member: newMember,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create staff error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create staff member" },
      { status: 500 }
    );
  }
}

