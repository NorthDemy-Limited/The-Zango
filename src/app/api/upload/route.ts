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
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "the-zango/editorial",
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
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
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

