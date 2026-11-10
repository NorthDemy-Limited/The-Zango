import { NextResponse } from "next/server";
import { getArticles } from "@/lib/firebase/db";
import { CATEGORIES } from "@/data/mock-articles";
import { Category } from "@/types";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

const customDesks: Category[] = [];

export async function GET() {
  try {
    const articles = await getArticles();

    let allDesks = [...CATEGORIES, ...customDesks];

    // Check Firebase Firestore for stored desks/categories
    if (isFirebaseConfigured && db) {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        if (!catSnap.empty) {
          const firestoreDesks = catSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Category[];
          allDesks = firestoreDesks;
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
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "categories", newDesk.id), newDesk);
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
