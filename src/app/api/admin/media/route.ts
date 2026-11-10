import { NextResponse } from "next/server";
import { getArticles } from "@/lib/firebase/db";

const EDITORIAL_STOCK_PRESETS = [
  { name: "Headline Hero", url: "/assets/hero-featured.jpg", category: "Featured" },
  { name: "Sahelian Velocity", url: "/assets/trending-hero.jpg", category: "Trending" },
  { name: "Investigative Scope", url: "/assets/experience-banner.png", category: "Investigation" },
  { name: "Digital Innovation", url: "/assets/news-hausa-digital.png", category: "Technology" },
  { name: "Startup Kano Hub", url: "/assets/news-startup-kano.png", category: "Business" },
  { name: "Agro Tech Transition", url: "/assets/news-climate-startup.jpg", category: "Agriculture" },
  { name: "Tomato Jos Agro", url: "/assets/news-tomato-jos.png", category: "Agriculture" },
  { name: "Mining Field Report", url: "/assets/news-mining.png", category: "Energy" },
  { name: "Borno Trade Corridor", url: "/assets/news-borno-trade.png", category: "Trade" },
  { name: "Textile Renaissance", url: "/assets/news-textile.png", category: "Industry" },
  { name: "Islamic Finance Forum", url: "/assets/news-islamic-finance.png", category: "Economy" },
];

export async function GET() {
  try {
    const articles = await getArticles();

    // Extract unique cover images from published articles
    const articleImages = articles
      .filter((a) => a.coverImage)
      .map((a) => ({
        name: a.title.slice(0, 35) + "...",
        url: a.coverImage,
        category: a.category,
      }));

    // Combine presets with existing article images (de-duplicating by URL)
    const seenUrls = new Set<string>();
    const allMedia: typeof EDITORIAL_STOCK_PRESETS = [];

    [...EDITORIAL_STOCK_PRESETS, ...articleImages].forEach((item) => {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        allMedia.push(item);
      }
    });

    return NextResponse.json({
      success: true,
      count: allMedia.length,
      media: allMedia,
    });
  } catch (error: unknown) {
    const err = error as { digest?: string };
    if (err?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Get media error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch editorial media library" },
      { status: 500 }
    );
  }
}

