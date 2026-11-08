import { NextResponse } from "next/server";
import { getArticles, createArticle } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query");
    const flag = searchParams.get("flag");
    const author = searchParams.get("author");
    const limitParam = searchParams.get("limit");

    let articles = await getArticles();

    if (category && category !== "all") {
      articles = articles.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (query) {
      const q = query.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.author.name.toLowerCase().includes(q)
      );
    }

    if (flag) {
      const f = flag.toLowerCase();
      if (f === "featured") articles = articles.filter((a) => a.isFeatured);
      else if (f === "trending") articles = articles.filter((a) => a.isTrending);
      else if (f === "editorspick" || f === "editors_pick") articles = articles.filter((a) => a.isEditorsPick);
      else if (f === "latest") articles = articles.filter((a) => a.isLatest);
    }

    if (author) {
      const auth = author.toLowerCase();
      articles = articles.filter(
        (a) => a.author.name.toLowerCase().includes(auth) || a.author.slug.includes(auth)
      );
    }

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        articles = articles.slice(0, limit);
      }
    }

    return NextResponse.json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Admin articles fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve dispatches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      category,
      coverImage,
      excerpt,
      content,
      authorName,
      readTime,
      isFeatured,
      isTrending,
      isEditorsPick,
      isLatest,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Story headline is required" },
        { status: 400 }
      );
    }

    const computedSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newArticle = await createArticle({
      title: title.trim(),
      slug: computedSlug,
      category: category || "Business",
      coverImage: coverImage || "/assets/hero-featured.jpg",
      excerpt: excerpt?.trim() || "Editorial dispatch from The Zango Bureau...",
      content: content || title,
      publishedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      readTime: readTime || "4 min read",
      isFeatured: !!isFeatured,
      isTrending: !!isTrending,
      isEditorsPick: !!isEditorsPick,
      isLatest: !!isLatest,
      views: 0,
      author: {
        id: "admin-bureau",
        name: authorName || "The Zango Bureau",
        slug: (authorName || "the-zango-bureau").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        role: "Chief Editorial Desk",
        avatar: "/assets/social-image-1.png",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Story dispatch created successfully",
        article: newArticle,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin article create error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create dispatch" },
      { status: 500 }
    );
  }
}

