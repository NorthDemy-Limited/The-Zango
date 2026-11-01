import { NextResponse } from "next/server";
import { getArticles, createArticle } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const author = searchParams.get("author");
    const query = searchParams.get("query");

    let articles = await getArticles();

    if (category) {
      articles = articles.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (author) {
      articles = articles.filter(
        (a) => a.author.slug === author || a.author.name.toLowerCase() === author.toLowerCase()
      );
    }

    if (query) {
      const q = query.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, count: articles.length, articles });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, category, coverImage, excerpt, authorName } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Title and content are required." },
        { status: 400 }
      );
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newArticle = await createArticle({
      title,
      slug,
      category: category || "Business",
      coverImage: coverImage || "/assets/hero-featured.jpg",
      excerpt: excerpt || content.slice(0, 160) + "...",
      content,
      publishedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      readTime: "4 min read",
      author: {
        id: "api-author",
        name: authorName || "The Zango Bureau",
        slug: "the-zango-bureau",
        role: "Editorial Desk",
      },
    });

    return NextResponse.json({ success: true, article: newArticle }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to create article" }, { status: 500 });
  }
}
