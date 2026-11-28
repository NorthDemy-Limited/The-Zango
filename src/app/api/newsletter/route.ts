import { NextResponse } from "next/server";
import { addSubscriberServer } from "@/lib/firebase/admin-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const subscriber = await addSubscriberServer(email.trim().toLowerCase());

    return NextResponse.json(
      {
        success: true,
        message: "You have successfully subscribed to The Zango Brief!",
        subscriber,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
