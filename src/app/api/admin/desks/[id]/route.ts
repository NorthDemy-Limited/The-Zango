import { NextResponse } from "next/server";
import { CATEGORIES } from "@/data/mock-articles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const desk = CATEGORIES.find((c) => c.id === id || c.slug === id);

    if (!desk) {
      return NextResponse.json(
        { success: false, message: "Desk not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, desk });
  } catch (error) {
    console.error("Get desk error:", error);
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
    const { name, description, slug } = body;

    const desk = CATEGORIES.find((c) => c.id === id || c.slug === id);

    if (!desk) {
      return NextResponse.json(
        { success: false, message: "Desk not found" },
        { status: 404 }
      );
    }

    if (name) desk.name = name.trim();
    if (description) desk.description = description.trim();
    if (slug) desk.slug = slug.trim();

    return NextResponse.json({
      success: true,
      message: "Desk updated successfully",
      desk,
    });
  } catch (error) {
    console.error("Update desk error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update desk" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const index = CATEGORIES.findIndex((c) => c.id === id || c.slug === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Desk not found" },
        { status: 404 }
      );
    }

    // Do not delete permanent core beats (e.g. news, business)
    if (["news", "business", "technology"].includes(CATEGORIES[index].slug)) {
      return NextResponse.json(
        { success: false, message: "Core pillar desks cannot be removed" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Desk removed successfully`,
    });
  } catch (error) {
    console.error("Delete desk error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete desk" },
      { status: 500 }
    );
  }
}

