import { NextResponse } from "next/server";
import { getMerchantApplications, createMerchantApplication } from "@/lib/firebase/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let merchants = await getMerchantApplications();

    if (status && status !== "all") {
      merchants = merchants.filter((m) => m.status.toLowerCase() === status.toLowerCase());
    }

    const pendingCount = merchants.filter((m) => m.status === "pending").length;

    return NextResponse.json({
      success: true,
      count: merchants.length,
      pendingCount,
      merchants,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Get merchants error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch merchant applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessName,
      name,
      contactName,
      email,
      phone,
      category,
      location,
      description,
      message,
      website,
    } = body;

    const finalBusinessName = (businessName || name || "").trim();
    const finalContactName = (contactName || name || "").trim();
    const finalEmail = (email || "").trim();
    const finalPhone = (phone || "").trim();
    const finalCategory = (category || "Agro-Commodities & Produce").trim();
    const finalLocation = (location || "Northern Nigeria").trim();
    const finalDescription = (description || message || "").trim();

    if (!finalBusinessName || !finalEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand/Business Name and Email Address are mandatory to register as a merchant.",
        },
        { status: 400 }
      );
    }

    const newMerchant = await createMerchantApplication({
      businessName: finalBusinessName,
      contactName: finalContactName || finalBusinessName,
      email: finalEmail,
      phone: finalPhone || "Not specified",
      category: finalCategory,
      location: finalLocation,
      description: finalDescription || "Merchant onboarding registration submitted via marketplace portal.",
      website: website?.trim() || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Merchant onboarding application submitted successfully. The Zango Bureau will review your brand within 24 hours.",
        merchant: newMerchant,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Create merchant error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit merchant application" },
      { status: 500 }
    );
  }
}
