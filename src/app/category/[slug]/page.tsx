import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/data/mock-articles";
import { getArticles } from "@/lib/firebase/db";
import { ArrowRight, ArrowLeft, Tag, Layers } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export const instant = false;

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    slug: cat.slug,
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();

  const allArticles = await getArticles();

  const category = CATEGORIES.find((c) => c.slug === normalizedSlug) || {
    id: normalizedSlug,
    name: normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1),
    slug: normalizedSlug,
    description: `Browse all reporting, analyses, and stories categorized under ${normalizedSlug}.`,
    count: 0,
    status: "active",
    lastUpdated: "Today",
    isLive: false,
  };

  const articles = allArticles.filter(
    (a) => a.category.toLowerCase() === normalizedSlug || (normalizedSlug === "news" && a.isLatest)
  );

  return (
    <div className="py-8 lg:py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/categories"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#535252] hover:text-[#C61D1F] uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse All Desks</span>
          </Link>

          {/* Real-time Desk Status Indicator */}
          <div className="inline-flex items-center space-x-2 bg-[#FDF2F2] border border-red-200/80 px-3 py-1 rounded-full text-xs font-bold text-[#C61D1F]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C61D1F]"></span>
            </span>
            <span className="uppercase tracking-wider">
              {category.status === "breaking" ? "Breaking Coverage Active" : "Live News Desk"}
            </span>
            <span className="text-gray-400 font-normal hidden sm:inline">• Real-time Feed</span>
          </div>
        </div>

        {/* Category Header Banner */}
        <div className="bg-[#FDF2F2] border border-red-100 rounded-3xl p-6 sm:p-10 mb-10 shadow-2xs">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Editorial Desk</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] mb-3 tracking-tight">
              {category.name}
            </h1>
            <p className="text-sm sm:text-base text-[#535252] leading-relaxed mb-6">
              {category.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center space-x-1.5 bg-white text-[#C61D1F] border border-red-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                <span>{articles.length}</span>
                <span>{articles.length === 1 ? "Story Filed" : "Stories Filed"}</span>
              </span>

              <span className="text-xs text-[#707070] font-medium bg-white/80 border border-gray-200 px-3 py-1 rounded-full">
                Updated: {category.lastUpdated || "Live updates active"}
              </span>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {articles.map((article) => (
              <article
                key={article.id}
                className="group bg-white border border-[#E5E6E8] hover:border-[#C61D1F] rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail */}
                  <Link href={`/article/${article.slug}`} className="block relative w-full h-48 overflow-hidden bg-gray-100">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                    />
                    <span className="absolute top-3 left-3 bg-white/90 text-[#111111] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs">
                      {article.category}
                    </span>
                  </Link>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center space-x-2 text-[11px] text-[#9C9C9C] mb-2 font-medium">
                      <span>{article.publishedAt}</span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                    </div>

                    <h2 className="text-base font-bold text-[#000000] group-hover:text-[#C61D1F] transition-colors leading-snug line-clamp-2 mb-2.5">
                      <Link href={`/article/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h2>

                    <p className="text-xs sm:text-sm text-[#707070] line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-[#E5E6E8] flex items-center justify-between text-xs">
                    <Link
                      href={`/author/${article.author.slug}`}
                      className="font-semibold text-[#535252] hover:text-[#C61D1F] transition-colors"
                    >
                      By {article.author.name}
                    </Link>
                    <Link
                      href={`/article/${article.slug}`}
                      className="inline-flex items-center space-x-1 text-[#C61D1F] font-bold uppercase tracking-wider hover:underline"
                    >
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-[#E5E6E8] mb-16">
            <p className="text-base font-bold text-[#535252] mb-2">
              No articles currently filed under {category.name}.
            </p>
            <p className="text-xs text-[#9C9C9C] mb-6">
              Our editorial desk is preparing dispatches for this section.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 bg-[#C61D1F] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#A51719] transition-colors inline-block"
            >
              Return to Front Page
            </Link>
          </div>
        )}

        {/* Quick Desk Switcher Navigation Bar */}
        <div className="pt-8 border-t border-[#E5E6E8]">
          <div className="flex items-center space-x-2 mb-4">
            <Layers className="w-4 h-4 text-[#C61D1F]" />
            <h3 className="text-xs font-bold text-[#000000] uppercase tracking-wider">
              Explore Other Desks
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isCurrent = cat.slug === normalizedSlug;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    isCurrent
                      ? "bg-[#C61D1F] text-white border-[#C61D1F] shadow-xs"
                      : "bg-white text-[#535252] border-[#E5E6E8] hover:border-[#C61D1F] hover:text-[#C61D1F]"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
