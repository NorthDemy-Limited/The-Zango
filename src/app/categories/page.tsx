import React, { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CATEGORIES } from "@/data/mock-articles";
import { getArticles } from "@/lib/firebase/db";
import { 
  ArrowRight, 
  ArrowLeft,
  Newspaper, 
  Briefcase, 
  Cpu, 
  MessageSquareText, 
  Coffee, 
  Trophy, 
  FileText, 
  Landmark, 
  Film, 
  HeartPulse, 
  GraduationCap
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  news: Newspaper,
  business: Briefcase,
  technology: Cpu,
  opinion: MessageSquareText,
  lifestyle: Coffee,
  sports: Trophy,
  features: FileText,
  politics: Landmark,
  entertainment: Film,
  health: HeartPulse,
  education: GraduationCap,
};

async function CategoriesDirectoryList() {
  await connection();
  const articles = await getArticles();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {CATEGORIES.map((cat) => {
        const Icon = iconMap[cat.slug] || Newspaper;
        const catArticles = articles.filter(
          (a) => a.category.toLowerCase() === cat.slug || (cat.slug === "news" && a.isLatest)
        );
        const actualCount = catArticles.length > 0 ? catArticles.length : cat.count;
        const latestArticle = catArticles[0];
        const isLive = cat.isLive || cat.status === "breaking" || cat.status === "live";

        return (
          <div
            key={cat.id}
            className="group bg-white border border-[#E5E6E8] hover:border-[#C61D1F] rounded-3xl p-6 sm:p-8 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FDF2F2] text-[#C61D1F] flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex items-center space-x-2">
                  {isLive && (
                    <span className="inline-flex items-center space-x-1 bg-[#FDF2F2] text-[#C61D1F] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C61D1F] animate-pulse" />
                      <span>Live</span>
                    </span>
                  )}
                  <span className="bg-gray-100 text-[#535252] text-xs font-bold px-3 py-1 rounded-full">
                    {actualCount} {actualCount === 1 ? "Story" : "Stories"}
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#000000] group-hover:text-[#C61D1F] transition-colors mb-2">
                <Link href={`/category/${cat.slug}`}>
                  {cat.name}
                </Link>
              </h2>

              <p className="text-xs sm:text-sm text-[#707070] leading-relaxed mb-6">
                {cat.description}
              </p>

              {latestArticle && (
                <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E5E6E8] mb-4">
                  <span className="text-[10px] font-bold text-[#C61D1F] uppercase tracking-wider block mb-1">
                    Latest Coverage
                  </span>
                  <Link
                    href={`/article/${latestArticle.slug}`}
                    className="text-xs font-bold text-[#111111] hover:text-[#C61D1F] transition-colors line-clamp-1 block"
                  >
                    {latestArticle.title}
                  </Link>
                </div>
              )}
            </div>

            <Link
              href={`/category/${cat.slug}`}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FDF2F2] hover:bg-[#C61D1F] text-[#C61D1F] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 mt-2"
            >
              <span>Explore {cat.name} Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export default function CategoriesDirectoryPage() {
  return (
    <div className="py-10 lg:py-16 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb & Real-time Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#535252] hover:text-[#C61D1F] uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Front Page</span>
          </Link>

          <div className="inline-flex items-center space-x-2 bg-[#FDF2F2] border border-red-200/80 px-3 py-1 rounded-full text-xs font-bold text-[#C61D1F]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C61D1F]"></span>
            </span>
            <span className="uppercase tracking-wider">All 11 Desks Live</span>
            <span className="text-gray-400 font-normal hidden sm:inline">• Real-time Status</span>
          </div>
        </div>

        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-3">
            <span>The Zango Taxonomy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight mb-4">
            Browse All News Desks & Categories
          </h1>
          <p className="text-base sm:text-lg text-[#535252] leading-relaxed">
            Explore comprehensive reporting organized across enterprise sectors, cultural beats, regional public policy, and technology ecosystems with real-time editorial feeds.
          </p>
        </div>

        {/* Category Cards Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          }
        >
          <CategoriesDirectoryList />
        </Suspense>

      </div>
    </div>
  );
}
