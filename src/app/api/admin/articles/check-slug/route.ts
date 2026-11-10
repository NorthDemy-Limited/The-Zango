import { NextResponse } from "next/server";
import { getArticles } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const excludeId = searchParams.get("excludeId");

    if (!slug || !slug.trim()) {
      return NextResponse.json(
        { success: false, message: "Slug parameter is required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const articles = await getArticles();
    const existing = articles.find(
      (a) => a.slug === cleanSlug && (!excludeId || a.id !== excludeId)
    );

    if (existing) {
      // Suggest an available alternative
      let candidate = `${cleanSlug}-1`;
      let counter = 1;
      while (articles.some((a) => a.slug === candidate && (!excludeId || a.id !== excludeId))) {
        counter++;
        candidate = `${cleanSlug}-${counter}`;
      }

      return NextResponse.json({
        success: true,
        available: false,
        slug: cleanSlug,
        suggestedSlug: candidate,
        existingStoryTitle: existing.title,
        message: `Slug "${cleanSlug}" is already in use by "${existing.title.slice(0, 30)}..."`,
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
      slug: cleanSlug,
      message: `Slug "${cleanSlug}" is available for publication`,
    });
  } catch (error: unknown) {
    const err = error as { digest?: string };
    if (err?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Check slug error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate slug availability" },
      { status: 500 }
    );
  }
}

