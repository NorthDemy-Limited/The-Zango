import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Flame, TrendingUp } from "lucide-react";
import { Article } from "@/types";

interface TrendingPopularProps {
  trendingArticle: Article;
  popularArticles: Article[];
}

export default function TrendingPopular({ trendingArticle, popularArticles }: TrendingPopularProps) {
  return (
    <section className="py-10 bg-[#FAFAFA] border-y border-[#E5E6E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Trending Spotlight (Left - 7 cols) */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between pb-3.5 mb-6 border-b border-[#E5E6E8]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                <h2 className="text-xl font-extrabold text-[#000000] tracking-wide uppercase flex items-center space-x-2">
                  <span>Trending Now</span>
                  <Flame className="w-4 h-4 text-[#C61D1F]" />
                </h2>
              </div>
              <Link
                href="/trending"
                className="text-xs font-bold text-[#000000] hover:text-[#C61D1F] uppercase tracking-wider transition-colors inline-flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <article className="group bg-white rounded-2xl overflow-hidden border border-[#E5E6E8] shadow-xs hover:shadow-lg transition-all duration-300">
              <Link href={`/article/${trendingArticle.slug}`} className="block relative w-full h-[280px] sm:h-[340px] overflow-hidden bg-gray-100">
                <Image
                  src={trendingArticle.coverImage}
                  alt={trendingArticle.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover group-hover:scale-103 transition-transform duration-600 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <span className="absolute top-4 left-4 bg-[#C61D1F] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm shadow-sm">
                  Trending
                </span>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-medium text-gray-300 block mb-1">
                    {trendingArticle.publishedAt}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold leading-tight group-hover:text-red-100 transition-colors">
                    {trendingArticle.title}
                  </h3>
                </div>
              </Link>

              <div className="p-5 sm:p-6">
                <p className="text-sm text-[#535252] leading-relaxed mb-4">
                  {trendingArticle.excerpt}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-[#E5E6E8]">
                  <Link
                    href={`/author/${trendingArticle.author.slug || "fatima-aliyu"}`}
                    className="text-xs font-semibold text-[#707070] hover:text-[#C61D1F] transition-colors"
                  >
                    By {trendingArticle.author.name} • {trendingArticle.readTime}
                  </Link>
                  <Link
                    href={`/article/${trendingArticle.slug}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#C61D1F] hover:text-[#A51719] uppercase tracking-wider"
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          </div>

          {/* Popular List (Right - 5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E6E8] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-[#E5E6E8]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                <h2 className="text-lg font-extrabold text-[#000000] tracking-wide uppercase flex items-center space-x-1.5">
                  <span>Popular On The Zango</span>
                  <TrendingUp className="w-4 h-4 text-[#C61D1F]" />
                </h2>
              </div>
            </div>

            <div className="divide-y divide-[#E5E6E8]">
              {popularArticles.slice(0, 4).map((article, idx) => (
                <div key={article.id} className="py-4 first:pt-0 last:pb-0 flex items-start space-x-4 group">
                  <div className="w-8 h-8 rounded-full bg-[#000000] text-white flex items-center justify-center font-extrabold text-sm shrink-0 group-hover:bg-[#C61D1F] transition-colors shadow-2xs">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-[#9C9C9C] block mb-1">
                      {article.publishedAt}
                    </span>
                    <Link
                      href={`/article/${article.slug}`}
                      className="text-sm font-bold text-[#000000] group-hover:text-[#C61D1F] transition-colors leading-snug line-clamp-2 block"
                    >
                      {article.title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-[#E5E6E8] bg-[#FDF2F2] rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-[#C61D1F] uppercase tracking-wider mb-1">
                Never Miss a Story
              </p>
              <p className="text-xs text-[#535252]">
                Join 25,000+ readers getting our daily briefing.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
