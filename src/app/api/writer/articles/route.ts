import { NextResponse } from "next/server";
import { getArticles } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorName = searchParams.get("authorName");
    const search = searchParams.get("search");

    let articles = await getArticles();

    if (authorName) {
      const nameLower = authorName.toLowerCase();
      articles = articles.filter(
        (a) => a.author.name.toLowerCase().includes(nameLower) || a.isFeatured
      );
    }

    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Writer get articles error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch writer stories" },
      { status: 500 }
    );
  }
}

