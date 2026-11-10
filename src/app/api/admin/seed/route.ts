import { NextResponse } from "next/server";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { ARTICLES } from "@/data/mock-articles";
import { getTeamMembers } from "@/lib/firebase/db";

export async function GET() {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({
        success: false,
        isConfigured: false,
        message: "Firebase is not configured or credentials are missing",
      });
    }

    const [articlesSnap, subsSnap, teamSnap] = await Promise.all([
      getDocs(collection(db, "articles")).catch(() => null),
      getDocs(collection(db, "submissions")).catch(() => null),
      getDocs(collection(db, "team_members")).catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      isConfigured: true,
      collections: {
        articles: articlesSnap ? articlesSnap.size : 0,
        submissions: subsSnap ? subsSnap.size : 0,
        team_members: teamSnap ? teamSnap.size : 0,
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

export async function POST() {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json(
        { success: false, message: "Firebase is not configured" },
        { status: 400 }
      );
    }

    // 1. Seed Articles
    const articlesRef = collection(db, "articles");
    const existingArticles = await getDocs(articlesRef);
    let seededArticlesCount = 0;

    if (existingArticles.empty) {
      for (const article of ARTICLES) {
        await setDoc(doc(db, "articles", article.id), {
          ...article,
          views: article.views || Math.floor(Math.random() * 2000) + 500,
        });
        seededArticlesCount++;
      }
    }

    // 2. Seed Team Members
    const teamRef = collection(db, "team_members");
    const existingTeam = await getDocs(teamRef);
    let seededTeamCount = 0;

    if (existingTeam.empty) {
      const initialTeam = await getTeamMembers();
      for (const member of initialTeam) {
        await setDoc(doc(db, "team_members", member.id), member);
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

