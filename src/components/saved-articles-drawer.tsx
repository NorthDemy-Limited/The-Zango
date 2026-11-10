"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, X, Trash2, ArrowRight, BookOpen, Clock } from "lucide-react";
import { Article } from "@/types";

interface SavedArticlesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedArticlesDrawer({ isOpen, onClose }: SavedArticlesDrawerProps) {
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchArticles = async () => {
      try {
        const savedSlugs: string[] = JSON.parse(
          localStorage.getItem("thezango_bookmarks") || "[]"
        );
        if (!Array.isArray(savedSlugs) || savedSlugs.length === 0) {
          if (isMounted) {
            setSavedArticles([]);
            setLoading(false);
          }
          return;
        }

        const res = await fetch("/api/articles");
        if (res.ok && isMounted) {
          const data = await res.json();
          const articles: Article[] = data.articles || [];
          const matched = articles.filter((a) => savedSlugs.includes(a.slug));
          setSavedArticles(matched);
        }
      } catch (err) {
        console.warn("Could not load bookmarked articles:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchArticles();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const removeBookmark = (slug: string) => {
    try {
      const savedSlugs: string[] = JSON.parse(
        localStorage.getItem("thezango_bookmarks") || "[]"
      );
      const updated = savedSlugs.filter((s) => s !== slug);
      localStorage.setItem("thezango_bookmarks", JSON.stringify(updated));
      setSavedArticles((prev) => prev.filter((a) => a.slug !== slug));
      window.dispatchEvent(new CustomEvent("thezango_bookmarks_changed"));
    } catch {
      // ignore
    }
  };

  const clearAllBookmarks = () => {
    try {
      localStorage.removeItem("thezango_bookmarks");
      setSavedArticles([]);
      window.dispatchEvent(new CustomEvent("thezango_bookmarks_changed"));
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-5 border-b border-[#E5E6E8] flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#C61D1F] text-white flex items-center justify-center">
                <Bookmark className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Saved Reading List
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {savedArticles.length} {savedArticles.length === 1 ? "story" : "stories"} saved for offline review
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : savedArticles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Your Reading List is Empty</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Tap the bookmark icon on any dispatch across The Zango to save dispatches for quiet reading anytime.
                </p>
              </div>
            ) : (
              savedArticles.map((article) => (
                <div
                  key={article.id}
                  className="group relative bg-white rounded-2xl border border-slate-200/90 p-3 hover:border-slate-300 hover:shadow-sm transition-all flex gap-3"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <Image
                      src={article.coverImage || "/assets/hero-featured.jpg"}
                      alt={article.title}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#C61D1F] uppercase tracking-wider mb-1">
                        <span>{article.category}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            removeBookmark(article.slug);
                          }}
                          className="text-slate-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <Link
                        href={`/article/${article.slug}`}
                        onClick={onClose}
                        className="text-xs font-bold text-slate-900 group-hover:text-[#C61D1F] transition-colors line-clamp-2 leading-snug"
                      >
                        {article.title}
                      </Link>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{article.readTime}</span>
                      <span>•</span>
                      <span>{article.publishedAt}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          {savedArticles.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearAllBookmarks}
                className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-[#000000] hover:bg-[#C61D1F] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>Continue Reading</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
