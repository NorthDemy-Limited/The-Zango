import { NextResponse } from "next/server";
import { getArticles, updateArticle, toggleArticleFlag, deleteArticle } from "@/lib/firebase/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const articles = await getArticles();
    const article = articles.find((a) => a.id === id);

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Desk dispatch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, article });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor get article error:", error);
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

    // 1. Toggle placement flags
    if (body.action === "toggleFlag" && body.flag) {
      const validFlags = ["isFeatured", "isTrending", "isEditorsPick", "isLatest"] as const;
      if (!validFlags.includes(body.flag)) {
        return NextResponse.json(
          { success: false, message: "Invalid placement flag identifier" },
          { status: 400 }
        );
      }

      const updated = await toggleArticleFlag(id, body.flag);
      if (!updated) {
        return NextResponse.json(
          { success: false, message: "Dispatch not found or flag update failed" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${body.flag} placement flag`,
        article: updated,
      });
    }

    // 2. Standard article updates
    const updated = await updateArticle(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Dispatch not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Desk dispatch updated successfully",
      article: updated,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor update article error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update desk dispatch" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = await deleteArticle(id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Dispatch not found or deletion failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dispatch removed from editorial index successfully",
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor delete article error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete dispatch" },
      { status: 500 }
    );
  }
}

