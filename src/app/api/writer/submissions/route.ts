import { NextResponse } from "next/server";
import { getSubmissions, createSubmission } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorEmail = searchParams.get("authorEmail");
    const authorName = searchParams.get("authorName");
    const status = searchParams.get("status");

    let submissions = await getSubmissions();

    if (authorEmail || authorName) {
      const emailLower = authorEmail?.toLowerCase();
      const nameLower = authorName?.toLowerCase();
      submissions = submissions.filter(
        (s) =>
          (emailLower && s.authorEmail?.toLowerCase() === emailLower) ||
          (nameLower && s.authorName?.toLowerCase() === nameLower)
      );
    }

    if (status && status !== "all") {
      submissions = submissions.filter((s) => s.status.toLowerCase() === status.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Writer get submissions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch writer submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, excerpt, content, category, authorName, authorEmail, coverImage, wordCount, readTime } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Headline and story manuscript body are required" },
        { status: 400 }
      );
    }

    const cleanText = content.replace(/<[^>]*>/g, " ");
    const words = wordCount || cleanText.split(/\s+/).filter(Boolean).length;
    const computedReadTime = readTime || `${Math.max(1, Math.ceil(words / 200))} min read`;

    const newSubmission = await createSubmission({
      title: title.trim(),
      excerpt: excerpt?.trim() || cleanText.slice(0, 150) + "...",
      content,
      category: category || "Technology",
      authorName: authorName || "Fatima Sanusi",
      authorEmail: authorEmail || "fatima.sanusi@thezango.org",
      coverImage: coverImage || "/assets/hero-featured.jpg",
      wordCount: words,
      readTime: computedReadTime,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Manuscript pitch delivered to editorial desk review queue",
        submission: newSubmission,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Writer create submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit story manuscript" },
      { status: 500 }
    );
  }
}

