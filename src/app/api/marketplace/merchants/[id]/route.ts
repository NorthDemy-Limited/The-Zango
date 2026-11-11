import { NextResponse } from "next/server";
import { updateMerchantApplicationStatus, getMerchantApplications } from "@/lib/firebase/db";
import { MerchantApplication } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const merchants = await getMerchantApplications();
    const merchant = merchants.find((m) => m.id === id);

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: "Merchant application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, merchant });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    return NextResponse.json(
      { success: false, message: "Failed to fetch merchant details" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, reviewedBy } = body;

    const validStatuses: MerchantApplication["status"][] = ["pending", "approved", "rejected", "under_review"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updated = await updateMerchantApplicationStatus(id, status, notes, reviewedBy);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Merchant application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Merchant application marked as ${status}`,
      merchant: updated,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Update merchant status error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update merchant status" },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

