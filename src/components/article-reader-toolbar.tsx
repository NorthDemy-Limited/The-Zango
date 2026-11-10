"use client";

import React, { useState, useEffect } from "react";
import { Share2, Bookmark, Check, Copy } from "lucide-react";
import { TwitterIcon, FacebookIcon, LinkedinIcon } from "@/components/social-icons";

interface ArticleReaderToolbarProps {
  title: string;
  slug: string;
}

export default function ArticleReaderToolbar({ title, slug }: ArticleReaderToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = JSON.parse(localStorage.getItem("thezango_bookmarks") || "[]");
      return Array.isArray(saved) && saved.includes(slug);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Scroll progress handler
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleBookmark = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("thezango_bookmarks") || "[]");
      let updated: string[];
      if (saved.includes(slug)) {
        updated = saved.filter((s: string) => s !== slug);
        setIsBookmarked(false);
      } else {
        updated = [...saved, slug];
        setIsBookmarked(true);
      }
      localStorage.setItem("thezango_bookmarks", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `https://thezango.com/article/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }

    // Fallback: copy link
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const articleUrl = typeof window !== "undefined" ? window.location.href : `https://thezango.com/article/${slug}`;

  return (
    <>
      {/* Sticky Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-[#C61D1F] z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Share & Bookmark Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-[#E5E6E8]">
        <div className="flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-[#C61D1F]" />
          <span className="text-xs font-bold text-[#000000] uppercase tracking-wider">
            Share Story:
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Web Share / Copy Link Button */}
          <button
            onClick={handleShare}
            className="px-3.5 py-1.5 rounded-md bg-[#000000] hover:bg-[#C61D1F] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-300" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-md bg-[#F5F5F5] hover:bg-[#C61D1F] hover:text-white text-xs font-semibold text-[#535252] flex items-center space-x-1.5 transition-colors"
            title="Share on X (Twitter)"
          >
            <TwitterIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Post</span>
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-md bg-[#F5F5F5] hover:bg-[#C61D1F] hover:text-white text-xs font-semibold text-[#535252] flex items-center space-x-1.5 transition-colors"
            title="Share on Facebook"
          >
            <FacebookIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </a>

          {/* LinkedIn */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-md bg-[#F5F5F5] hover:bg-[#C61D1F] hover:text-white text-xs font-semibold text-[#535252] flex items-center space-x-1.5 transition-colors"
            title="Share on LinkedIn"
          >
            <LinkedinIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </a>

          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            aria-label="Bookmark story"
            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${isBookmarked
                ? "bg-[#FDF2F2] border-[#C61D1F] text-[#C61D1F]"
                : "bg-white border-[#DFDFDF] text-[#707070] hover:text-[#C61D1F]"
              }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>
    </>
  );
}

