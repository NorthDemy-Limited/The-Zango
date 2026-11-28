import { NextResponse } from "next/server";
import { getSiteSocials, updateSiteSocials } from "@/lib/site-socials";
import { requireAuth } from "@/lib/auth-session";
import { SITE_CONFIG, SiteSocials } from "@/config/site";

function sanitizeUrl(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export async function GET(request: Request) {
  const authResult = await requireAuth(request, ["admin"]);
  if (authResult.error) return authResult.error;

  try {
    const socials = await getSiteSocials();
    return NextResponse.json({ success: true, socials });
  } catch (error) {
    console.error("Admin get socials error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch social links" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAuth(request, ["admin"]);
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const incoming = body?.socials as Partial<SiteSocials> | undefined;
    if (!incoming || typeof incoming !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid socials payload" },
        { status: 400 }
      );
    }

    const current = await getSiteSocials();
    const defaults = SITE_CONFIG.socials;

    const nextSocials: SiteSocials = {
      twitter: {
        name: defaults.twitter.name,
        handle: (incoming.twitter?.handle ?? current.twitter.handle).trim() || defaults.twitter.handle,
        url: sanitizeUrl(incoming.twitter?.url, current.twitter.url),
      },
      linkedin: {
        name: defaults.linkedin.name,
        handle: (incoming.linkedin?.handle ?? current.linkedin.handle).trim() || defaults.linkedin.handle,
        url: sanitizeUrl(incoming.linkedin?.url, current.linkedin.url),
      },
      instagram: {
        name: defaults.instagram.name,
        handle: (incoming.instagram?.handle ?? current.instagram.handle).trim() || defaults.instagram.handle,
        url: sanitizeUrl(incoming.instagram?.url, current.instagram.url),
      },
      facebook: {
        name: defaults.facebook.name,
        handle: (incoming.facebook?.handle ?? current.facebook.handle).trim() || defaults.facebook.handle,
        url: sanitizeUrl(incoming.facebook?.url, current.facebook.url),
      },
      youtube: {
        name: defaults.youtube.name,
        handle: (incoming.youtube?.handle ?? current.youtube.handle).trim() || defaults.youtube.handle,
        url: sanitizeUrl(incoming.youtube?.url, current.youtube.url),
      },
    };

    const saved = await updateSiteSocials(nextSocials);
    return NextResponse.json({
      success: true,
      message: "Social media links updated successfully.",
      socials: saved,
    });
  } catch (error) {
    console.error("Admin update socials error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update social media links" },
      { status: 500 }
    );
  }
}

