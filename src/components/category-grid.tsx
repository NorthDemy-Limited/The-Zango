"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Newspaper,
  FileText,
  Sparkles,
  Store,
} from "lucide-react";
import { CATEGORIES } from "@/data/mock-articles";
import { Category } from "@/types";

interface CategoryGridProps {
  initialCategories?: Category[];
}

export default function CategoryGrid({ initialCategories }: CategoryGridProps = {}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || CATEGORIES);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Active");
  const [isSyncing, setIsSyncing] = useState(false);

  const iconMap: Record<string, React.ElementType> = {
    news: Newspaper,
    features: FileText,
    scope: Sparkles,
    marketplace: Store,
  };

  // Manual or on-demand re-sync handler (never fires automatically on initial mount)
  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
          setLastSyncTime(
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          );
        }
      }
    } catch {
      // Preserve category data on failure
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header with Real-time Sync Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-8 border-b border-[#E5E6E8] gap-4">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-5 bg-[#84CC16] rounded-xs inline-block" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#000000] tracking-wide uppercase">
              Browse by Category
            </h2>

            {/* Real-time Status Badge */}
            <button
              type="button"
              onClick={handleManualSync}
              title="Click to re-sync live desks"
              className="inline-flex items-center space-x-1.5 bg-[#F7FEE7] hover:bg-lime-100 border border-lime-300/80 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#84CC16] shadow-2xs transition-colors cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84CC16]"></span>
              </span>
              <span className="tracking-wider uppercase">{isSyncing ? "Syncing..." : "Live Desks"}</span>
              <span className="text-gray-400 text-[10px] hidden md:inline">• {lastSyncTime}</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-[#535252] uppercase tracking-wider bg-gray-50 px-3 py-1.5 rounded-lg border border-[#E5E6E8]">
              4 Editorial Desks
            </span>

            <Link
              href="/categories"
              className="text-xs font-bold text-[#000000] hover:text-[#84CC16] uppercase tracking-wider transition-colors inline-flex items-center space-x-1"
            >
              <span>Taxonomy Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Categories Grid - 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = iconMap[cat.slug] || Newspaper;
            const isLive = cat.isLive || cat.status === "live" || cat.status === "breaking";
            const targetHref =
              cat.slug === "scope"
                ? "/scope"
                : cat.slug === "marketplace"
                ? "/marketplace"
                : `/category/${cat.slug}`;

            return (
              <Link
                key={cat.id}
                href={targetHref}
                className="group relative bg-white border border-[#E5E6E8] hover:border-[#84CC16] rounded-2xl p-6 text-center shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col items-center justify-between"
              >
                {/* Live Status Tag */}
                <div className="absolute top-2.5 right-2.5 flex items-center space-x-1">
                  {isLive ? (
                    <span className="inline-flex items-center space-x-1 bg-[#F7FEE7] text-[#84CC16] text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] animate-pulse" />
                      <span>{cat.status === "breaking" ? "Breaking" : "Live"}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 bg-gray-100 text-[#707070] text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                {/* Desk Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#F8F9FA] group-hover:bg-[#F7FEE7] flex items-center justify-center text-[#535252] group-hover:text-[#84CC16] transition-colors mb-3 mt-1">
                  <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                </div>

                {/* Desk Title & Count */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#000000] group-hover:text-[#84CC16] transition-colors mb-1">
                    {cat.name}
                  </h3>
                  <div className="flex flex-col items-center space-y-0.5">
                    <span className="text-[11px] font-semibold text-[#111111] bg-gray-50 group-hover:bg-lime-50 px-2 py-0.5 rounded-full transition-colors">
                      {cat.count} {cat.count === 1 ? "story" : "stories"}
                    </span>
                    {cat.lastUpdated && (
                      <span className="text-[10px] text-[#9C9C9C]">
                        {cat.lastUpdated}
                      </span>
                    )}
                  </div>
                </div>

                {/* Active indicator bar */}
                <div className="w-8 h-1 bg-[#84CC16] rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
