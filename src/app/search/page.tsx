"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight, Calendar, User, Tag } from "lucide-react";
import { ARTICLES } from "@/data/mock-articles";
import { Article } from "@/types";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [allArticles, setAllArticles] = useState<Article[]>(ARTICLES);

  useEffect(() => {
    async function loadLiveArticles() {
      try {
        const res = await fetch("/api/articles");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.articles) {
            setAllArticles(data.articles);
          }
        }
      } catch (err) {
        // Fallback to initial mock articles
      }
    }
    loadLiveArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allArticles;
    return allArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.author.name.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [query, allArticles]);

  return (
    <div className="py-8 lg:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search The Zango</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#000000] mb-4">
            Search News, Topics & Authors
          </h1>

          {/* Search Input Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by keywords, startup name, climate tech..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-[#DFDFDF] focus:border-[#C61D1F] text-base text-[#111111] placeholder-[#9C9C9C] focus:outline-hidden shadow-xs transition-colors"
            />
            <Search className="w-5 h-5 text-[#9C9C9C] absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-[#707070]">
            <span>
              Found <strong className="text-[#000000]">{filteredArticles.length}</strong> {filteredArticles.length === 1 ? "story" : "stories"}
              {query.trim() && (
                <> for &ldquo;<span className="text-[#C61D1F] font-semibold">{query}</span>&rdquo;</>
              )}
            </span>
          </div>
        </div>

        {/* Results Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
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
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 text-[#111111] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs">
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

                    <p className="text-xs sm:text-sm text-[#707070] line-clamp-3 leading-relaxed mb-4">
                      {article.excerpt}
                    </p>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-gray-100 text-[#535252] px-2 py-0.5 rounded-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-[#E5E6E8] flex items-center justify-between text-xs">
                    <Link
                      href={`/author/${article.author.slug || "editorial-desk"}`}
                      className="font-semibold text-[#535252] hover:text-[#C61D1F] transition-colors flex items-center space-x-1"
                    >
                      <User className="w-3.5 h-3.5 text-[#9C9C9C]" />
                      <span>{article.author.name}</span>
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
        ) : (
          <div className="text-center py-16 bg-[#FAFAFA] rounded-3xl border border-[#E5E6E8] p-8">
            <Search className="w-12 h-12 text-[#9C9C9C] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-[#000000] mb-2">
              No matching dispatches found
            </h3>
            <p className="text-sm text-[#707070] max-w-md mx-auto mb-6">
              We couldn&apos;t find any stories matching your query. Try searching for broader terms like &ldquo;tech&rdquo;, &ldquo;climate&rdquo;, or &ldquo;Kano&rdquo;.
            </p>
            <button
              onClick={() => setQuery("")}
              className="px-5 py-2.5 bg-[#C61D1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#A51719] transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-[#707070]">
          Loading search results...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
