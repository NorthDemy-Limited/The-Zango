import { NextResponse } from "next/server";
import { fsListDocs, fsSetDoc, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getArticlesServer, getTeamMembersServer } from "@/lib/firebase/admin-db";
import { requireAuth } from "@/lib/auth-session";

export async function GET(request: Request) {
  const authResult = await requireAuth(request, ["admin"]);
  if (authResult.error) return authResult.error;
  try {
    if (!isFirebaseAdminConfigured) {
      return NextResponse.json({
        success: false,
        isConfigured: false,
        message: "Firebase is not configured or credentials are missing",
      });
    }

    const [articlesDocs, subsDocs, teamDocs] = await Promise.all([
      fsListDocs("articles").catch(() => null),
      fsListDocs("submissions").catch(() => null),
      fsListDocs("team_members").catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      isConfigured: true,
      collections: {
        articles: articlesDocs ? articlesDocs.length : 0,
        submissions: subsDocs ? subsDocs.length : 0,
        team_members: teamDocs ? teamDocs.length : 0,
      },
      message: "Firebase connection successful",
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Firebase status check error:", error);
    return NextResponse.json(
      { success: false, message: "Error connecting to Firebase Firestore" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request, ["admin"]);
  if (authResult.error) return authResult.error;
  try {
    if (!isFirebaseAdminConfigured) {
      return NextResponse.json(
        { success: false, message: "Firebase is not configured" },
        { status: 400 }
      );
    }

    // 1. Seed Articles
    const existingArticles = await fsListDocs("articles");
    let seededArticlesCount = 0;

    if (existingArticles.length === 0) {
      const articlesToSeed = await getArticlesServer();
      for (const article of articlesToSeed) {
        await fsSetDoc("articles", article.id, {
          ...(article as unknown as Record<string, unknown>),
          views: article.views || Math.floor(Math.random() * 2000) + 500,
        });
        seededArticlesCount++;
      }
    }

    // 2. Seed Team Members
    const existingTeam = await fsListDocs("team_members");
    let seededTeamCount = 0;

    if (existingTeam.length === 0) {
      const initialTeam = await getTeamMembersServer();
      for (const member of initialTeam) {
        await fsSetDoc("team_members", member.id, member as unknown as Record<string, unknown>);
        seededTeamCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Firebase seed complete",
      seeded: {
        articles: seededArticlesCount,
        team_members: seededTeamCount,
      },
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Firebase seeding error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to seed Firebase data" },
      { status: 500 }
    );
  }
}

