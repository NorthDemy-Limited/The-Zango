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
        { success: false, message: "Dispatch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error("Admin get article error:", error);
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

    // Check if it's a flag toggle request
    if (body.action === "toggleFlag" && body.flag) {
      const validFlags = ["isFeatured", "isTrending", "isEditorsPick", "isLatest"] as const;
      if (!validFlags.includes(body.flag)) {
        return NextResponse.json(
          { success: false, message: "Invalid flag identifier" },
          { status: 400 }
        );
      }

      const updated = await toggleArticleFlag(id, body.flag);
      if (!updated) {
        return NextResponse.json(
          { success: false, message: "Dispatch not found or flag toggle failed" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Toggled ${body.flag} successfully`,
        article: updated,
      });
    }

    // Standard article update
    const updated = await updateArticle(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Dispatch not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dispatch updated successfully",
      article: updated,
    });
  } catch (error) {
    console.error("Admin update article error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update dispatch" },
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
        { success: false, message: "Dispatch not found or delete failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dispatch deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete article error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete dispatch" },
      { status: 500 }
    );
  }
}

