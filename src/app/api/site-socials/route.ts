import { NextResponse } from "next/server";
import { getSiteSocials } from "@/lib/firebase/db";

export async function GET() {
  try {
    const socials = await getSiteSocials();
    return NextResponse.json({ success: true, socials });
  } catch (error) {
    console.error("Get site socials error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load site socials" },
      { status: 500 }
    );
  }
}

