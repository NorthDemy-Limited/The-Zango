import { NextResponse } from "next/server";
import { 
  getSubmissions, 
  approveSubmission, 
  requestRevisionSubmission, 
  rejectSubmission, 
  updateSubmission 
} from "@/lib/firebase/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const submissions = await getSubmissions();
    const sub = submissions.find((s) => s.id === id);

    if (!sub) {
      return NextResponse.json(
        { success: false, message: "Manuscript submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, submission: sub });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor get submission error:", error);
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
    const { action, feedbackNotes, ...updates } = body;

    // Action 1: Approve and publish live as a story dispatch
    if (action === "approve") {
      const article = await approveSubmission(id);
      if (!article) {
        return NextResponse.json(
          { success: false, message: "Submission not found or clearance failed" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Manuscript cleared and published as live desk story dispatch",
        article,
      });
    }

    // Action 2: Request revisions with feedback for author
    if (action === "revision") {
      if (!feedbackNotes || !feedbackNotes.trim()) {
        return NextResponse.json(
          { success: false, message: "Editorial guidance notes are required when requesting revisions" },
          { status: 400 }
        );
      }
      const success = await requestRevisionSubmission(id, feedbackNotes.trim());
      if (!success) {
        return NextResponse.json(
          { success: false, message: "Submission not found or failed to deliver feedback" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Editorial revision notes sent back to writer",
      });
    }

    // Action 3: Reject submission
    if (action === "reject") {
      const success = await rejectSubmission(id);
      if (!success) {
        return NextResponse.json(
          { success: false, message: "Submission not found or rejection failed" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Manuscript marked as rejected",
      });
    }

    // Action 4: Standard submission edits (e.g. proofreading or correcting tags before approval)
    const updated = await updateSubmission(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Submission not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission updated successfully",
      submission: updated,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor update submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update submission" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = await rejectSubmission(id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Submission not found or failed to remove" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission removed from desk review queue",
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Editor delete submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete submission" },
      { status: 500 }
    );
  }
}

