import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ slug: string[] }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
    }

    // Sanitize each path segment to prevent directory traversal
    const safeSegments = slug.map((segment) => segment.replace(/[^a-zA-Z0-9_.-]/g, ""));
    const relativePath = path.join(...safeSegments);
    const fullPath = path.join(process.cwd(), "public", "uploads", relativePath);

    // Verify the resolved path is inside public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fullPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const fileBuffer = await fs.readFile(fullPath);

    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".avif": "image/avif",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    };

    const contentType = mimeMap[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}

