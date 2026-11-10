import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getArticles } from "@/lib/firebase/db";
import { Flame, ArrowLeft, ArrowRight } from "lucide-react";

export const instant = false;

export default async function TrendingPage() {
  const articles = await getArticles();
  const trendingArticles = articles.filter(
    (a) => a.isTrending || a.isPopular || a.isFeatured
  );

  return (
    <div className="py-10 lg:py-16 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#535252] hover:text-[#C61D1F] uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Front Page</span>
          </Link>
        </div>

        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-3">
            <Flame className="w-4 h-4 text-[#C61D1F]" />
            <span>Real-time Velocity</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight mb-4">
            Trending Stories on The Zango
          </h1>
          <p className="text-base sm:text-lg text-[#535252] leading-relaxed">
            The most read, discussed, and shared analyses from across Northern Nigeria and the African continent over the last 48 hours.
          </p>
        </div>

        {/* Trending Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trendingArticles.map((article, idx) => (
            <article
              key={article.id}
              className="group bg-white border border-[#E5E6E8] hover:border-[#C61D1F] rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center font-extrabold text-xs">
                      #{idx + 1}
                    </span>
                    <span className="bg-white/90 text-[#111111] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs">
                      {article.category}
                    </span>
                  </div>
                </div>

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

              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-[#E5E6E8] flex items-center justify-between text-xs">
                  <Link
                    href={`/author/${article.author.slug || "editorial-desk"}`}
                    className="font-semibold text-[#535252] hover:text-[#C61D1F] transition-colors"
                  >
                    By {article.author.name}
                  </Link>
                  <Link
                    href={`/article/${article.slug}`}
                    className="inline-flex items-center space-x-1 text-[#C61D1F] font-bold uppercase tracking-wider hover:underline"
                  >
                    <span>Read Story</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  );
}
