"use client";

import React, { useState, useEffect } from "react";
import { Share2, Bookmark, Check, Copy } from "lucide-react";
import { TwitterIcon, FacebookIcon, LinkedinIcon, WhatsAppIcon } from "@/components/social-icons";
import SavedArticlesDrawer from "@/components/saved-articles-drawer";

interface ArticleReaderToolbarProps {
  title: string;
  slug: string;
}

export default function ArticleReaderToolbar({ title, slug }: ArticleReaderToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
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
        setShowSavedToast(false);
      } else {
        updated = [...saved, slug];
        setIsBookmarked(true);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 4000);
      }
      localStorage.setItem("thezango_bookmarks", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("thezango_bookmarks_changed"));
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

        <div className="flex items-center space-x-2 relative">
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

          {/* WhatsApp Direct Share */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`*${title}*\n\nRead full report on The Zango:\n${articleUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-md bg-[#E8F8EE] hover:bg-[#25D366] text-[#128C7E] hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Share via WhatsApp"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}&via=thezangong&hashtags=TheZango,NorthernNigeria,News`}
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
            title={isBookmarked ? "Saved in Reading List" : "Bookmark this dispatch"}
            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${isBookmarked
                ? "bg-[#FDF2F2] border-[#C61D1F] text-[#C61D1F]"
                : "bg-white border-[#DFDFDF] text-[#707070] hover:text-[#C61D1F]"
              }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
          </button>

          {/* Saved Toast Notification Pill */}
          {showSavedToast && (
            <div className="absolute -top-10 right-0 bg-slate-900 text-white text-[11px] font-bold py-1 px-3 rounded-full shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap z-20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Saved to Reading List</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="text-[#C61D1F] hover:underline ml-1 cursor-pointer"
              >
                View
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Saved Articles Drawer */}
      <SavedArticlesDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

