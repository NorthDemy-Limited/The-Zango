import { NextResponse } from "next/server";
import { INITIAL_COMMENTS } from "@/data/mock-articles";
import { Comment } from "@/types";

let localCommentsStore: Comment[] = [...INITIAL_COMMENTS];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ success: true, comments: localCommentsStore });
  }

  const articleComments = localCommentsStore.filter((c) => c.articleSlug === slug);
  return NextResponse.json({ success: true, comments: articleComments });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articleSlug, authorName, content } = body;

    if (!articleSlug || !authorName || !content) {
      return NextResponse.json(
        { success: false, message: "Missing required comment fields." },
        { status: 400 }
      );
    }

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      articleSlug,
      authorName: authorName.trim(),
      content: content.trim(),
      createdAt: "Just now",
      likes: 0,
    };

    localCommentsStore = [newComment, ...localCommentsStore];

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to submit comment." }, { status: 500 });
  }
}
