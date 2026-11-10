import { NextResponse } from "next/server";
import { getArticles } from "@/lib/firebase/db";

export async function GET() {
  try {
    const articles = await getArticles();

    const featured = articles.find((a) => a.isFeatured) || articles[0];
    const latestNews = articles.filter((a) => a.isLatest).slice(0, 5);
    const editorsPicks = articles.filter((a) => a.isEditorsPick).slice(0, 4);
    const trending = articles.find((a) => a.isTrending) || articles[2];
    const popular = articles
      .filter((a) => a.isPopular)
      .sort((a, b) => (a.popularRank || 99) - (b.popularRank || 99))
      .slice(0, 4);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sections: {
        featured,
        latestNews,
        editorsPicks,
        trending,
        popular,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to generate home feed" },
      { status: 500 }
    );
  }
}
