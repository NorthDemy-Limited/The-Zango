import { NextResponse } from "next/server";
import { getArticles, getSubmissions } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorEmail = searchParams.get("authorEmail");
    const authorName = searchParams.get("authorName");

    const [articles, submissions] = await Promise.all([
      getArticles(),
      getSubmissions(),
    ]);

    // Filter submissions for this author
    let writerSubmissions = submissions;
    if (authorEmail || authorName) {
      const emailLower = authorEmail?.toLowerCase();
      const nameLower = authorName?.toLowerCase();
      writerSubmissions = submissions.filter(
        (s) =>
          (emailLower && s.authorEmail?.toLowerCase() === emailLower) ||
          (nameLower && s.authorName?.toLowerCase() === nameLower)
      );
    }

    // Filter published articles for this author
    let writerArticles = articles;
    if (authorName) {
      const nameLower = authorName.toLowerCase();
      writerArticles = articles.filter((a) =>
        a.author.name.toLowerCase().includes(nameLower)
      );
    }

    const pendingCount = writerSubmissions.filter((s) => s.status === "pending").length;
    const needsRevisionCount = writerSubmissions.filter((s) => s.status === "needs_revision").length;
    const approvedCount = writerSubmissions.filter((s) => s.status === "approved").length;
    const rejectedCount = writerSubmissions.filter((s) => s.status === "rejected").length;

    const totalSubmitted = writerSubmissions.length;
    const totalProcessed = approvedCount + rejectedCount;
    const acceptanceRate = totalProcessed > 0
      ? `${Math.round((approvedCount / totalProcessed) * 100)}%`
      : totalSubmitted > 0 ? "100%" : "N/A";

    const totalViews = writerArticles.reduce((acc, a) => acc + (a.views || 0), 0);

    // Compute average word count from articles or submissions
    const wordCounts = writerArticles
      .map((a) => {
        const text = (a.content || "").replace(/<[^>]*>/g, " ").trim();
        return text ? text.split(/\s+/).length : 0;
      })
      .filter((w) => w > 0);

    const avgWordCount = wordCounts.length > 0
      ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : 850;

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmitted,
        publishedStories: writerArticles.length,
        pendingReview: pendingCount,
        needsRevision: needsRevisionCount,
        approved: approvedCount,
        totalReads: totalViews,
        acceptanceRate,
        avgWordCount,
      },
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Writer get stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch writer statistics" },
      { status: 500 }
    );
  }
}

