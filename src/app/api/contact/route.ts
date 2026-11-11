import { NextResponse } from "next/server";
import { createMerchantApplication } from "@/lib/firebase/db";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, phone, category, location } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const isMerchantSubject =
      (subject && /merchant|vendor|marketplace|sell|store|brand|supplier|trade/i.test(subject)) ||
      (message && /merchant|vendor|marketplace|sell products|list my brand|wholesaler/i.test(message));

    let createdMerchant = null;

    if (isMerchantSubject) {
      createdMerchant = await createMerchantApplication({
        businessName: name,
        contactName: name,
        email,
        phone: phone || "Via Contact Desk",
        category: category || "Agro-Commodities & Produce",
        location: location || "Northern Nigeria",
        description: `[Subject: ${subject || "Merchant Inquiry"}] ${message}`,
      });
    }

    // Persist general contact message to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, "inquiries"), {
          name,
          email,
          subject: subject || "General Inquiry",
          message,
          isMerchant: !!isMerchantSubject,
          submittedAt: new Date().toISOString(),
          status: "unread",
        });
      } catch (err) {
        console.warn("Could not save inquiry to Firestore:", err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isMerchantSubject
          ? "Merchant application and inquiry received. Our commercial desk will review your profile."
          : "Message received. Our editorial and support desk will respond shortly.",
        isMerchant: !!isMerchantSubject,
        merchantId: createdMerchant?.id,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Contact API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message." },
      { status: 500 }
    );
  }
}
