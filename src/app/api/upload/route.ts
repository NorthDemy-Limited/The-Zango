import { NextResponse } from "next/server";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If Cloudinary credentials are provided, upload to Cloudinary
    if (isCloudinaryConfigured) {
      const uploadResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "the-zango/editorial",
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result as unknown as Record<string, unknown>);
            else reject(new Error("No result returned from Cloudinary"));
          }
        );
        stream.end(buffer);
      });

      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url as string,
        public_id: uploadResult.public_id as string,
        provider: "cloudinary",
      });
    }

    // Fallback mode while waiting for Cloudinary account keys:
    // Generate inline data URI so editors can test immediately without failing!
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      provider: "local-fallback",
      message: "Uploaded locally (set Cloudinary env variables for production CDN storage)",
    });
  } catch (error: unknown) {
    console.error("Upload handler error:", error);
    const msg = (error as { message?: string })?.message || "Failed to upload image";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}

