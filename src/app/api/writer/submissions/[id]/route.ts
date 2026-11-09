import { NextResponse } from "next/server";
import { getSubmissions, updateSubmission, rejectSubmission } from "@/lib/firebase/db";

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
        { success: false, message: "Manuscript not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, submission: sub });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Writer get submission error:", error);
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
    const { action, ...updates } = body;

    if (action === "resubmit") {
      // Re-submit updated manuscript back to the editors
      const updated = await updateSubmission(id, {
        ...updates,
        status: "pending",
      });

      if (!updated) {
        return NextResponse.json(
          { success: false, message: "Manuscript pitch not found or update failed" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Revised manuscript re-submitted to editorial desk review queue",
        submission: updated,
      });
    }

    // Standard draft update
    const updated = await updateSubmission(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Manuscript pitch not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Manuscript draft saved successfully",
      submission: updated,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Writer update submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update manuscript" },
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
        { success: false, message: "Manuscript pitch not found or discard failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Manuscript pitch withdrawn from review queue successfully",
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Writer delete submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to discard manuscript pitch" },
      { status: 500 }
    );
  }
}

