import { NextResponse } from "next/server";
import { getArticles, createArticle } from "@/lib/firebase/db";
import { Article } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let articles = await getArticles();

    if (category && category.toLowerCase() !== "all") {
      articles = articles.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.author.name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor get articles error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch desk dispatches" },
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
      readTime,
      isFeatured,
      isTrending,
      isEditorsPick,
      isLatest,
      author,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Title and content are required for dispatch" },
        { status: 400 }
      );
    }

    const cleanSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newArticle: Omit<Article, "id"> = {
      title: title.trim(),
      slug: cleanSlug,
      category: category || "Business",
      coverImage: coverImage || "/assets/hero-featured.jpg",
      excerpt: excerpt?.trim() || title.trim(),
      content,
      publishedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      readTime: readTime || "4 min read",
      isFeatured: !!isFeatured,
      isTrending: !!isTrending,
      isEditorsPick: isEditorsPick !== undefined ? !!isEditorsPick : true,
      isLatest: isLatest !== undefined ? !!isLatest : true,
      views: 0,
      author: author || {
        id: "author-editor",
        name: "Aisha Dahiru",
        slug: "aisha-dahiru",
        role: "Senior Desk Editor",
        avatar: "/assets/social-image-2.png",
      },
    };

    const created = await createArticle(newArticle);

    return NextResponse.json(
      {
        success: true,
        message: "Desk dispatch published live successfully",
        article: created,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor create article error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to publish desk dispatch" },
      { status: 500 }
    );
  }
}

