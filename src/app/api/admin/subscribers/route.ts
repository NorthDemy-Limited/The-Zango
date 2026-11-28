import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-session";
import { getSubscribersServer, addSubscriberServer } from "@/lib/firebase/admin-db";

export async function GET(request: Request) {
  const authResult = await requireAuth(request, ["admin"]);
  if (authResult.error) return authResult.error;
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    let subscribers = await getSubscribersServer();

    if (query) {
      const q = query.toLowerCase();
      subscribers = subscribers.filter((s) => s.email.toLowerCase().includes(q));
    }

    return NextResponse.json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  } catch (error) {
    console.error("Admin get subscribers error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request, ["admin"]);
  if (authResult.error) return authResult.error;
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required" },
        { status: 400 }
      );
    }

    const subscriber = await addSubscriberServer(email.trim().toLowerCase());

    return NextResponse.json(
      {
        success: true,
        message: "Subscriber added to newsletter roster",
        subscriber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin add subscriber error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add subscriber" },
      { status: 500 }
    );
  }
}

