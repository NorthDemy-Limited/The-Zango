import { NextResponse } from "next/server";
import { getArticles } from "@/lib/firebase/db";
import { CATEGORIES } from "@/data/mock-articles";
import { Category } from "@/types";

// In-memory or dynamic store for added custom desks
let customDesks: Category[] = [];

export async function GET() {
  try {
    const articles = await getArticles();

    const allDesks = [...CATEGORIES, ...customDesks];

    // Compute live stats for all desks
    const computedDesks = allDesks.map((desk) => {
      const deskArticles = articles.filter(
        (a) =>
          a.category.toLowerCase() === desk.name.toLowerCase() ||
          a.category.toLowerCase() === desk.slug.toLowerCase()
      );

      return {
        ...desk,
        count: deskArticles.length > 0 ? deskArticles.length : desk.count,
        latestStory: deskArticles[0]?.title || null,
        status: deskArticles.length > 5 ? "live" : "active",
      };
    });

    return NextResponse.json({
      success: true,
      count: computedDesks.length,
      desks: computedDesks,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Fetch desks error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch editorial desks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, slug } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Desk name is required" },
        { status: 400 }
      );
    }

    const computedSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newDesk: Category = {
      id: `desk-${Date.now()}`,
      name: name.trim(),
      slug: computedSlug,
      description: description?.trim() || `Editorial coverage for ${name.trim()} beat.`,
      count: 0,
      status: "active",
      isLive: false,
    };

    customDesks.push(newDesk);

    return NextResponse.json(
      {
        success: true,
        message: `Desk "${name}" created successfully`,
        desk: newDesk,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create desk error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create editorial desk" },
      { status: 500 }
    );
  }
}

