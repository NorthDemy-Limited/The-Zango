import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, User } from "lucide-react";
import { Article } from "@/types";

interface HeroSectionProps {
  featuredArticle: Article;
  latestNews: Article[];
}

export default function HeroSection({ featuredArticle, latestNews }: HeroSectionProps) {
  return (
    <section className="py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Featured Article (Left - 8 cols) */}
          <div className="lg:col-span-8">
            <div className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-neutral-900">
              
              {/* Cover Image */}
              <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px]">
                <Image
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out brightness-90"
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors duration-300" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 sm:p-8 lg:p-10 flex flex-col justify-end text-white">
                  
                  {/* Category / Featured Pill */}
                  <div className="mb-3">
                    <span className="inline-block bg-[#C61D1F] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm shadow-sm">
                      FEATURED
                    </span>
                  </div>

                  {/* Headline with Link */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
                    <Link
                      href={`/article/${featuredArticle.slug}`}
                      className="hover:text-red-100 transition-colors"
                    >
                      {featuredArticle.title}
                    </Link>
                  </h1>

                  {/* Excerpt */}
                  <p className="text-sm sm:text-base text-gray-200 line-clamp-3 leading-relaxed mb-6 max-w-3xl">
                    {featuredArticle.excerpt}
                  </p>

                  {/* Author & Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/20">
                    <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-200 font-medium">
                      <Link
                        href={`/author/${featuredArticle.author.slug || "abdul-rahman"}`}
                        className="flex items-center space-x-1.5 hover:text-white hover:underline transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-gray-300" />
                        <span>By {featuredArticle.author.name}</span>
                      </Link>
                      <span className="text-white/40">•</span>
                      <span className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-300" />
                        <span>{featuredArticle.publishedAt}</span>
                      </span>
                    </div>

                    {/* Read More CTA */}
                    <Link
                      href={`/article/${featuredArticle.slug}`}
                      className="inline-flex items-center space-x-2 bg-white text-[#111111] hover:bg-[#C61D1F] hover:text-white px-4 py-2 rounded-full font-semibold text-xs transition-colors duration-200 cursor-pointer"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Latest News Sidebar (Right - 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E6E8] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              {/* Section Header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#E5E6E8]">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                  <h2 className="text-lg font-bold text-[#000000] tracking-wide uppercase">
                    Latest News
                  </h2>
                </div>
                <Link
                  href="/category/news"
                  className="text-xs font-bold text-[#C61D1F] hover:text-[#A51719] flex items-center space-x-1 uppercase tracking-wider"
                >
                  <span>Live</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C61D1F] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C61D1F]"></span>
                  </span>
                </Link>
              </div>

              {/* Latest News List */}
              <div className="divide-y divide-[#E5E6E8]/70">
                {latestNews.slice(0, 5).map((item) => (
                  <article key={item.id} className="py-3.5 first:pt-0 last:pb-0 group">
                    <Link href={`/article/${item.slug}`} className="flex items-start space-x-3.5">
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.coverImage}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover group-hover:scale-106 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-[#C61D1F] tracking-wide block mb-1">
                          {item.publishedAt}
                        </span>
                        
                        <h3 className="text-[13.5px] sm:text-[14px] font-semibold text-[#000000] group-hover:text-[#C61D1F] transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>

            {/* View All News CTA */}
            <div className="pt-4 mt-4 border-t border-[#E5E6E8]">
              <Link
                href="/category/news"
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#FDF2F2] hover:bg-[#C61D1F] text-[#C61D1F] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors duration-200"
              >
                <span>View All News</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
