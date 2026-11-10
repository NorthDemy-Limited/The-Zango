import { NextResponse } from "next/server";
import { 
  getArticles, 
  getSubscribers, 
  getSubmissions, 
  getTeamMembers, 
  getPlatformMetrics 
} from "@/lib/firebase/db";
import { CATEGORIES } from "@/data/mock-articles";

export async function GET() {
  try {
    const [metrics, articles, subscribers, submissions, teamMembers] = await Promise.all([
      getPlatformMetrics(),
      getArticles(),
      getSubscribers(),
      getSubmissions(),
      getTeamMembers(),
    ]);

    const pendingSubmissions = submissions.filter((s) => s.status === "pending");
    const needsRevisionSubmissions = submissions.filter((s) => s.status === "needs_revision");
    const approvedSubmissions = submissions.filter((s) => s.status === "approved");

    const staffSummary = {
      total: teamMembers.length,
      admins: teamMembers.filter((m) => m.role === "admin").length,
      editors: teamMembers.filter((m) => m.role === "editor").length,
      writers: teamMembers.filter((m) => m.role === "writer").length,
      active: teamMembers.filter((m) => m.status === "active").length,
    };

    return NextResponse.json({
      success: true,
      metrics: {
        totalArticles: articles.length,
        totalViews: metrics.totalViews,
        totalSubscribers: subscribers.length,
        draftCount: metrics.draftCount,
        submissions: {
          total: submissions.length,
          pending: pendingSubmissions.length,
          needsRevision: needsRevisionSubmissions.length,
          approved: approvedSubmissions.length,
        },
        staff: staffSummary,
        totalDesks: CATEGORIES.length,
      },
    });
  } catch (error: unknown) {
    const err = error as { digest?: string };
    if (err?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Failed to fetch admin metrics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch platform metrics" },
      { status: 500 }
    );
  }
}

