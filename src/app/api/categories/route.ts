import { NextResponse } from "next/server";
import { getArticles } from "@/lib/firebase/db";
import { CATEGORIES } from "@/data/mock-articles";
import { Category } from "@/types";

let cachedCategories: Category[] | null = null;
let lastCategoriesFetch = 0;
const CATEGORIES_CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET() {
  try {
    const now = Date.now();
    if (cachedCategories && now - lastCategoriesFetch < CATEGORIES_CACHE_TTL) {
      return NextResponse.json({
        success: true,
        timestamp: new Date(lastCategoriesFetch).toISOString(),
        categories: cachedCategories,
        totalDesks: cachedCategories.length,
        cached: true,
      });
    }

    const articles = await getArticles();

    const computedCategories: Category[] = CATEGORIES.map((cat) => {
      const catArticles = articles.filter(
        (a) =>
          a.category.toLowerCase() === cat.slug.toLowerCase() ||
          (cat.slug === "news" && a.isLatest)
      );

      const actualCount = catArticles.length;
      const latestArticle = catArticles[0];

      // Determine real-time status dynamically based on current coverage
      let status: "live" | "active" | "updated" | "breaking" = "active";
      let isLive = false;
      let lastUpdated = "Today";

      if (cat.slug === "news" || catArticles.some((a) => a.isLatest)) {
        status = "breaking";
        isLive = true;
        lastUpdated = "Just now";
      } else if (catArticles.some((a) => a.isTrending)) {
        status = "live";
        isLive = true;
        lastUpdated = "10m ago";
      } else if (actualCount >= 3) {
        status = "updated";
        isLive = true;
        lastUpdated = "25m ago";
      } else {
        status = "active";
        isLive = false;
        lastUpdated = latestArticle ? latestArticle.publishedAt : "Recent";
      }

      return {
        ...cat,
        count: actualCount > 0 ? actualCount : cat.count,
        status,
        lastUpdated,
        isLive,
      };
    });

    cachedCategories = computedCategories;
    lastCategoriesFetch = now;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      categories: computedCategories,
      totalDesks: computedCategories.length,
      totalStories: articles.length,
    });
  } catch {
    return NextResponse.json({
      success: true,
      categories: cachedCategories || CATEGORIES,
      totalDesks: (cachedCategories || CATEGORIES).length,
      fallback: true,
    });
  }
}
