import { NextResponse } from "next/server";
import { INITIAL_COMMENTS } from "@/data/mock-articles";
import { Comment } from "@/types";
import { fsAddDoc, fsListDocs, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

let localCommentsStore: Comment[] = [...INITIAL_COMMENTS];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    // Check Firebase Firestore
    if (isFirebaseAdminConfigured) {
      try {
        const docs = await fsListDocs("comments");
        if (docs.length > 0) {
          const allComments = docs as unknown as Comment[];
          const filtered = slug ? allComments.filter((c) => c.articleSlug === slug) : allComments;
          return NextResponse.json({ success: true, count: filtered.length, comments: filtered });
        }
      } catch (err: unknown) {
        if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw err;
        console.warn("Could not fetch comments from Firestore, using local store:", err);
      }
    }

    if (!slug) {
      return NextResponse.json({ success: true, count: localCommentsStore.length, comments: localCommentsStore });
    }

    const articleComments = localCommentsStore.filter((c) => c.articleSlug === slug);
    return NextResponse.json({ success: true, count: articleComments.length, comments: articleComments });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    return NextResponse.json({ success: false, message: "Failed to fetch comments" }, { status: 500 });
  }
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
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      likes: 0,
    };

    // Persist to Firestore
    if (isFirebaseAdminConfigured) {
      try {
        const docId = await fsAddDoc("comments", newComment as unknown as Record<string, unknown>);
        newComment.id = docId;
      } catch (err: unknown) {
        if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw err;
        console.warn("Could not save comment to Firestore:", err);
      }
    }

    localCommentsStore = [newComment, ...localCommentsStore];

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    return NextResponse.json({ success: false, message: "Failed to submit comment." }, { status: 500 });
  }
}
