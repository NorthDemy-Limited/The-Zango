import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Article } from "@/types";

interface EditorsPicksProps {
  articles: Article[];
}

export default function EditorsPicks({ articles }: EditorsPicksProps) {
  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[#E5E6E8]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#000000] tracking-wide uppercase">
                Editor&apos;s Picks
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#9C9C9C] mt-1 ml-5">
              Handpicks stories, just for you
            </p>
          </div>

          <Link
            href="/category/features"
            className="mt-3 sm:mt-0 inline-flex items-center space-x-1.5 text-xs font-bold text-[#000000] hover:text-[#C61D1F] uppercase tracking-wider transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4-Column Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.slice(0, 4).map((article) => (
            <article
              key={article.id}
              className="group bg-white border border-[#E5E6E8] rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <Link href={`/article/${article.slug}`} className="block relative w-full h-44 overflow-hidden bg-gray-100">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  {article.category && (
                    <span className="absolute top-3 left-3 bg-white/95 text-[#111111] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs">
                      {article.category}
                    </span>
                  )}
                </Link>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <span className="text-[11px] font-medium text-[#9C9C9C] block mb-2">
                    {article.publishedAt}
                  </span>

                  <h3 className="text-[15px] font-bold text-[#000000] group-hover:text-[#C61D1F] transition-colors leading-snug line-clamp-2 mb-2.5">
                    <Link href={`/article/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-[#707070] line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              {/* Read More Footer */}
              <div className="p-4 pt-0 sm:p-5 sm:pt-0">
                <Link
                  href={`/article/${article.slug}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#C61D1F] hover:text-[#A51719] uppercase tracking-wider transition-colors pt-3 border-t border-[#E5E6E8]/60 w-full"
                >
                  <span>Read More</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
