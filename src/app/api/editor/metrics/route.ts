import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-session";
import { getArticlesServer, getSubmissionsServer, getPlatformMetricsServer } from "@/lib/firebase/admin-db";
import { CATEGORIES } from "@/data/mock-articles";

export async function GET(request: Request) {
  const authResult = await requireAuth(request, ["admin", "editor"]);
  if (authResult.error) return authResult.error;
  try {
    const { searchParams } = new URL(request.url);
    const desk = searchParams.get("desk");

    const [articles, submissions, platformMetrics] = await Promise.all([
      getArticlesServer(),
      getSubmissionsServer(),
      getPlatformMetricsServer(),
    ]);

    const deskArticles = desk && desk !== "all"
      ? articles.filter((a) => a.category.toLowerCase() === desk.toLowerCase())
      : articles;

    const pendingCount = submissions.filter((s) => s.status === "pending").length;
    const needsRevisionCount = submissions.filter((s) => s.status === "needs_revision").length;
    const approvedCount = submissions.filter((s) => s.status === "approved").length;
    const rejectedCount = submissions.filter((s) => s.status === "rejected").length;

    const totalProcessed = approvedCount + rejectedCount;
    const approvalRate = totalProcessed > 0 ? Math.round((approvedCount / totalProcessed) * 100) : 92;

    return NextResponse.json({
      success: true,
      metrics: {
        totalArticles: articles.length,
        deskArticlesCount: deskArticles.length,
        totalViews: platformMetrics.totalViews,
        pendingSubmissions: pendingCount,
        needsRevisionSubmissions: needsRevisionCount,
        approvedSubmissions: approvedCount,
        rejectedSubmissions: rejectedCount,
        approvalVelocity: `${approvalRate}%`,
        totalDesks: CATEGORIES.length,
      },
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor get metrics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch desk editor metrics" },
      { status: 500 }
    );
  }
}

