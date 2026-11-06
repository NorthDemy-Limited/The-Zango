"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, CheckCircle2, Image as ImageIcon, Loader2, X, RefreshCw } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const PRESET_EDITORIAL_IMAGES = [
  { name: "Headline Hero", url: "/assets/hero-featured.jpg" },
  { name: "Sahelian Velocity", url: "/assets/trending-hero.jpg" },
  { name: "Investigative Scope", url: "/assets/experience-banner.png" },
  { name: "Digital Innovation", url: "/assets/news-hausa-digital.png" },
  { name: "Startup Kano Hub", url: "/assets/news-startup-kano.png" },
  { name: "Agro Tech Transition", url: "/assets/news-climate-startup.jpg" },
];

export default function ImageUploader({
  value,
  onChange,
  label = "Cover Image",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please choose a smaller image.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("Uploading to Cloudinary CDN...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
        setUploadMessage(
          data.provider === "cloudinary"
            ? "Uploaded to Cloudinary CDN!"
            : "Uploaded locally (Cloudinary credentials ready to connect)"
        );
        setTimeout(() => setUploadMessage(null), 3500);
      } else {
        alert(data.message || "Upload failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Network error while uploading image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#535252] uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs font-semibold text-[#C61D1F] hover:underline cursor-pointer flex items-center space-x-1"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{showPresets ? "Hide Editorial Stock" : "Choose from Editorial Stock"}</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Upload Zone & Active Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">

        {/* Preview Tile */}
        <div className="sm:col-span-5 relative h-36 rounded-xl overflow-hidden border border-[#DFDFDF] bg-gray-100 flex items-center justify-center group shadow-2xs">
          {value ? (
            <>
              <Image
                src={value}
                alt="Selected preview"
                fill
                sizes="(max-width: 640px) 100vw, 250px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 bg-white text-[#111111] hover:text-[#C61D1F] rounded-md text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center p-3 text-gray-400">
              <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
              <span className="text-[11px] block">No image selected</span>
            </div>
          )}
        </div>

        {/* Drag-and-Drop Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="sm:col-span-7 border-2 border-dashed border-[#DFDFDF] hover:border-[#C61D1F] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#FAFAFA] hover:bg-[#FDF2F2]/30"
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2 text-[#C61D1F]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-semibold">Uploading image...</span>
            </div>
          ) : (
            <>
              <UploadCloud className="w-7 h-7 text-[#C61D1F] mb-1.5" />
              <span className="text-xs font-bold text-[#111111] block mb-0.5">
                Click to upload or drag image here
              </span>
              <span className="text-[11px] text-[#707070]">
                JPG, PNG, WebP up to 10MB (Cloudinary optimized)
              </span>
            </>
          )}
        </div>

      </div>

      {uploadMessage && (
        <div className="p-2.5 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Preset Editorial Stock Drawer */}
      {showPresets && (
        <div className="p-3 bg-gray-50 border border-[#E5E6E8] rounded-xl animate-in fade-in duration-200">
          <span className="text-[11px] font-bold text-[#707070] uppercase tracking-wider block mb-2">
            Editorial Presets:
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PRESET_EDITORIAL_IMAGES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setShowPresets(false);
                }}
                className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${value === preset.url ? "border-[#C61D1F] ring-2 ring-red-200" : "border-transparent hover:border-gray-400"
                  }`}
              >
                <Image
                  src={preset.url}
                  alt={preset.name}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] text-white py-0.5 px-1 truncate block text-center">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

