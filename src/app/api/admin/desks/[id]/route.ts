import { NextResponse } from "next/server";
import { CATEGORIES } from "@/data/mock-articles";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check Firebase Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docSnap = await getDoc(doc(db, "categories", id));
        if (docSnap.exists()) {
          return NextResponse.json({ success: true, desk: { id: docSnap.id, ...docSnap.data() } });
        }
      } catch (err: unknown) {
        if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw err;
      }
    }

    const desk = CATEGORIES.find((c) => c.id === id || c.slug === id);

    if (!desk) {
      return NextResponse.json(
        { success: false, message: "Desk not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, desk });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Get desk error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, slug } = body;

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name.trim();
    if (description) updates.description = description.trim();
    if (slug) updates.slug = slug.trim();

    // Persist to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, "categories", id), updates);
      } catch (err: unknown) {
        if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw err;
        console.warn("Could not update desk in Firestore:", err);
      }
    }

    const desk = CATEGORIES.find((c) => c.id === id || c.slug === id);
    if (desk) {
      if (name) desk.name = name.trim();
      if (description) desk.description = description.trim();
      if (slug) desk.slug = slug.trim();
    }

    return NextResponse.json({
      success: true,
      message: "Desk updated successfully",
      desk: desk || { id, ...updates },
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Update desk error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update desk" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const index = CATEGORIES.findIndex((c) => c.id === id || c.slug === id);

    if (index !== -1 && ["news", "business", "technology"].includes(CATEGORIES[index].slug)) {
      return NextResponse.json(
        { success: false, message: "Core pillar desks cannot be removed" },
        { status: 403 }
      );
    }

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "categories", id));
      } catch (err: unknown) {
        if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw err;
        console.warn("Could not delete desk from Firestore:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Desk removed successfully",
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Delete desk error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete desk" },
      { status: 500 }
    );
  }
}
