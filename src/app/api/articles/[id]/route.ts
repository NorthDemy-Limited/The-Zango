import { NextResponse } from "next/server";
import {
  getArticlesServer,
  getArticleBySlugServer,
  updateArticleServer,
  deleteArticleServer,
} from "@/lib/firebase/admin-db";
import { requireAuth } from "@/lib/auth-session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const articles = await getArticlesServer();
    let article = articles.find((a) => a.id === id);

    if (!article) {
      article = (await getArticleBySlugServer(id)) || undefined;
    }

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error("Get article by ID error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve article" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authResult = await requireAuth(request, ["admin", "editor"]);
  if (authResult.error) return authResult.error;
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateArticleServer(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Article not found or failed to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Article updated successfully",
      article: updated,
    });
  } catch (error) {
    console.error("Update article by ID error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const authResult = await requireAuth(request, ["admin", "editor"]);
  if (authResult.error) return authResult.error;
  try {
    const { id } = await params;
    const success = await deleteArticleServer(id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Article not found or failed to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Delete article by ID error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete article" },
      { status: 500 }
    );
  }
}

