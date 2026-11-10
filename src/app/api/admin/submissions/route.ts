import { NextResponse } from "next/server";
import { getSubmissions, createSubmission } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const author = searchParams.get("author");

    let submissions = await getSubmissions();

    if (status && status !== "all") {
      submissions = submissions.filter((s) => s.status.toLowerCase() === status.toLowerCase());
    }

    if (category && category !== "all") {
      submissions = submissions.filter((s) => s.category.toLowerCase() === category.toLowerCase());
    }

    if (author) {
      const auth = author.toLowerCase();
      submissions = submissions.filter(
        (s) =>
          s.authorName.toLowerCase().includes(auth) ||
          (s.authorEmail && s.authorEmail.toLowerCase().includes(auth))
      );
    }

    return NextResponse.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Admin get submissions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch review queue submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      excerpt,
      content,
      category,
      authorName,
      authorEmail,
      coverImage,
      tags,
      isBreaking,
      scheduledAt,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Title and content are required for manuscript submission" },
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
      tags: Array.isArray(tags) ? tags : [],
      isBreaking: !!isBreaking,
      scheduledAt: scheduledAt || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Manuscript pitch submitted to editorial review queue",
        submission: newSubmission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create submission" },
      { status: 500 }
    );
  }
}

