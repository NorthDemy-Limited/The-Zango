import { NextResponse } from "next/server";
import { getArticles } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.toLowerCase();

    const articles = await getArticles();
    const tagCountMap: Record<string, number> = {};

    articles.forEach((a) => {
      if (a.tags && Array.isArray(a.tags)) {
        a.tags.forEach((tag) => {
          const t = tag.trim();
          if (t) {
            tagCountMap[t] = (tagCountMap[t] || 0) + 1;
          }
        });
      }
    });

    // Provide default editorial tags if database has few
    const DEFAULT_EDITORIAL_TAGS = [
      "Northern Nigeria",
      "Kano",
      "Kaduna",
      "Economy",
      "Agribusiness",
      "Venture Capital",
      "Technology",
      "Governance",
      "Policy",
      "Sahel",
      "Mining & Solid Minerals",
      "Education",
      "Fintech",
      "Renewable Energy",
    ];

    DEFAULT_EDITORIAL_TAGS.forEach((tag) => {
      if (!tagCountMap[tag]) {
        tagCountMap[tag] = 1;
      }
    });

    let tags = Object.entries(tagCountMap).map(([tag, count]) => ({
      tag,
      count,
    }));

    if (query) {
      tags = tags.filter((t) => t.tag.toLowerCase().includes(query));
    }

    tags.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      count: tags.length,
      tags,
    });
  } catch (error: unknown) {
    const err = error as { digest?: string };
    if (err?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Get tags error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch editorial tags" },
      { status: 500 }
    );
  }
}

