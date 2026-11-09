import { NextResponse } from "next/server";
import { getSubmissions, createSubmission } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let submissions = await getSubmissions();

    if (status && status !== "all") {
      submissions = submissions.filter((s) => s.status.toLowerCase() === status.toLowerCase());
    }

    if (category && category !== "all") {
      submissions = submissions.filter((s) => s.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      submissions = submissions.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.authorName.toLowerCase().includes(q) ||
          s.excerpt.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor get submissions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch desk submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, excerpt, content, category, authorName, authorEmail, coverImage } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Title and content are required for manuscript pitch" },
        { status: 400 }
      );
    }

    const cleanText = content.replace(/<[^>]*>/g, " ");
    const words = cleanText.split(/\s+/).filter(Boolean).length;
    const computedReadTime = body.readTime || `${Math.max(1, Math.ceil(words / 200))} min read`;

    const newSubmission = await createSubmission({
      title: title.trim(),
      excerpt: excerpt?.trim() || cleanText.slice(0, 150) + "...",
      content,
      category: category || "Business",
      authorName: authorName || "Correspondent",
      authorEmail: authorEmail || "correspondent@thezango.org",
      coverImage: coverImage || "/assets/hero-featured.jpg",
      wordCount: words,
      readTime: computedReadTime,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Manuscript successfully added to review queue",
        submission: newSubmission,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor create submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to register submission" },
      { status: 500 }
    );
  }
}

