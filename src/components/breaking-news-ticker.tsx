"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Article } from "@/types";
import { Flame, ChevronLeft, ChevronRight, X, ArrowUpRight } from "lucide-react";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface BreakingNewsTickerProps {
  initialArticles?: Article[];
}

export default function BreakingNewsTicker({ initialArticles = [] }: BreakingNewsTickerProps) {
  const [articles, setArticles] = useState<Article[]>(() => {
    return initialArticles.filter((a) => a.isBreaking);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with Firestore live snapshots for real-time breaking dispatches
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    try {
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        where("isBreaking", "==", true)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveBreaking: Article[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                ...data,
                id: docSnap.id,
              } as Article;
            });
            setArticles(liveBreaking);
          }
        },
        (error) => {
          console.warn("Firestore breaking news subscription warning:", error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not attach breaking news listener:", err);
    }
  }, []);

  // Auto-advance breaking headlines every 6 seconds
  useEffect(() => {
    if (articles.length <= 1 || isPaused || dismissed) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [articles.length, isPaused, dismissed]);

  if (dismissed || articles.length === 0) {
    return null;
  }

  const safeIndex = articles.length > 0 ? currentIndex % articles.length : 0;
  const currentArticle = articles[safeIndex];
  if (!currentArticle) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  };

  return (
    <div
      role="region"
      aria-label="Breaking News Ticker"
      className="bg-gradient-to-r from-[#881214] via-[#C61D1F] to-[#A51719] text-white shadow-sm border-b border-red-900/30 overflow-hidden select-none transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-2 flex items-center justify-between gap-3 text-xs">
        
        {/* Left: Urgent Indicator Badge */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="font-extrabold tracking-wider uppercase text-[10px] sm:text-[11px] text-white flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>Breaking Dispatch</span>
            </span>
          </div>

          {currentArticle.category && (
            <span className="hidden md:inline-block px-2 py-0.5 rounded-sm bg-white/15 text-[10px] font-bold uppercase tracking-wider text-red-100">
              {currentArticle.category}
            </span>
          )}
        </div>

        {/* Center: Live Headline Link */}
        <div className="flex-1 min-w-0 flex items-center">
          <Link
            href={`/article/${currentArticle.slug}`}
            className="group flex items-center space-x-1.5 truncate text-white hover:text-amber-200 transition-colors"
          >
            <span className="font-bold text-xs sm:text-sm truncate">
              {currentArticle.title}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Right: Controls & Dismiss */}
        <div className="flex items-center space-x-1 shrink-0">
          {articles.length > 1 && (
            <div className="flex items-center space-x-1 bg-black/20 rounded-md p-0.5 mr-1 text-[11px] font-medium">
              <span className="px-1 text-white/80 hidden sm:inline">
                {safeIndex + 1}/{articles.length}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous breaking headline"
                className="p-1 hover:bg-white/20 rounded-sm transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next breaking headline"
                className="p-1 hover:bg-white/20 rounded-sm transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss breaking news banner"
            className="p-1 hover:bg-black/30 rounded-md transition-colors text-white/80 hover:text-white cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
