import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-session";
import { getArticlesServer } from "@/lib/firebase/admin-db";
import { fsListDocs, fsSetDoc, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { CATEGORIES } from "@/data/mock-articles";
import { Category } from "@/types";

const customDesks: Category[] = [];

export async function GET(request: Request) {
  const authResult = await requireAuth(request, ["admin"]);
  if (authResult.error) return authResult.error;
  try {
    const articles = await getArticlesServer();

    let allDesks = [...CATEGORIES, ...customDesks];

    // Check Firebase Firestore for stored desks/categories
    if (isFirebaseAdminConfigured) {
      try {
        const docs = await fsListDocs("categories");
        if (docs.length > 0) {
          allDesks = docs as unknown as Category[];
        }
      } catch (err: unknown) {
        if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw err;
        console.warn("Could not fetch desks from Firestore, using local store:", err);
      }
    }

    // Compute live stats for all desks based on current articles
    const computedDesks = allDesks.map((desk) => {
      const deskArticles = articles.filter(
        (a) =>
          a.category.toLowerCase() === desk.name.toLowerCase() ||
          a.category.toLowerCase() === desk.slug.toLowerCase()
      );

      return {
        ...desk,
        count: deskArticles.length > 0 ? deskArticles.length : desk.count,
        latestStory: deskArticles[0]?.title || null,
        status: deskArticles.length > 5 ? ("live" as const) : ("active" as const),
      };
    });

    return NextResponse.json({
      success: true,
      count: computedDesks.length,
      desks: computedDesks,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Fetch desks error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch editorial desks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request, ["admin"]);
  if (authResult.error) return authResult.error;
  try {
    const body = await request.json();
    const { name, description, slug } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Desk name is required" },
        { status: 400 }
      );
    }

    const computedSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newDesk: Category = {
      id: `desk-${Date.now()}`,
      name: name.trim(),
      slug: computedSlug,
      description: description?.trim() || `Editorial coverage for ${name.trim()} beat.`,
      count: 0,
      status: "active",
      isLive: false,
    };

    // Persist to Firebase Firestore
    if (isFirebaseAdminConfigured) {
      try {
        await fsSetDoc("categories", newDesk.id, newDesk as unknown as Record<string, unknown>);
      } catch (err: unknown) {
        if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw err;
        console.warn("Could not save desk to Firestore:", err);
      }
    }

    customDesks.push(newDesk);

    return NextResponse.json(
      {
        success: true,
        message: `Desk "${name}" created successfully`,
        desk: newDesk,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Create desk error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create editorial desk" },
      { status: 500 }
    );
  }
}
