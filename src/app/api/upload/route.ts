import { NextResponse } from "next/server";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";
import fs from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided for upload" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "image/jpeg";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Unsupported file type: ${mimeType}. Please upload a JPEG, PNG, WebP, or AVIF image.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File exceeds 5MB maximum size limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const rawExt = file.name ? path.extname(file.name) : "";
    const ext =
      rawExt ||
      (mimeType === "image/png"
        ? ".png"
        : mimeType === "image/webp"
        ? ".webp"
        : mimeType === "image/avif"
        ? ".avif"
        : ".jpg");

    const sanitizedBase = (file.name || "image")
      .replace(rawExt, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 40);

    const uniqueFileName = `${Date.now()}-${sanitizedBase}${ext}`;
    const storagePath = `articles/${year}/${month}/${uniqueFileName}`;

    // 1. Primary: Firebase Storage
    if (storage) {
      try {
        const storageRef = ref(storage, storagePath);
        const uint8 = new Uint8Array(arrayBuffer);
        const snapshot = await uploadBytes(storageRef, uint8, { contentType: mimeType });
        const downloadUrl = await getDownloadURL(snapshot.ref);

        return NextResponse.json({
          success: true,
          url: downloadUrl,
          provider: "firebase-storage",
          path: storagePath,
          size: file.size,
          mimeType,
        });
      } catch (storageErr) {
        console.warn(
          "Notice: Firebase Storage upload fallback (bucket may require console activation):",
          storageErr
        );
      }
    }

    // 2. Secondary: Cloudinary CDN if configured
    if (isCloudinaryConfigured) {
      try {
        const uploadResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `the-zango/editorial/${year}/${month}`,
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
          size: file.size,
          mimeType,
        });
      } catch (cloudErr) {
        console.warn("Cloudinary upload fallback:", cloudErr);
      }
    }

    // 3. Resilient Local Media Storage (/uploads/...)
    // Persists to public/uploads/articles/{year}/{month}
    try {
      const publicUploadsDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "articles",
        String(year),
        month
      );
      await fs.mkdir(publicUploadsDir, { recursive: true });
      const diskFilePath = path.join(publicUploadsDir, uniqueFileName);
      await fs.writeFile(diskFilePath, buffer);

      const publicUrl = `/uploads/articles/${year}/${month}/${uniqueFileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        provider: "local-storage",
        path: publicUrl,
        size: file.size,
        mimeType,
      });
    } catch (diskErr) {
      console.warn("Local disk write error, falling back to data URL:", diskErr);
    }

    // 4. Last-resort inline base64 fallback
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      provider: "inline-fallback",
      size: file.size,
      mimeType,
      message: "Uploaded locally as inline asset.",
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.("NEXT_")) throw error;
    console.error("Upload handler error:", error);
    const msg = (error as { message?: string })?.message || "Failed to upload image";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

