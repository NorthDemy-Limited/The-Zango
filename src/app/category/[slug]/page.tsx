import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ARTICLES, CATEGORIES } from "@/data/mock-articles";
import { ArrowRight, Calendar, User, Clock, Tag } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    slug: cat.slug,
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();

  const category = CATEGORIES.find((c) => c.slug === normalizedSlug) || {
    id: normalizedSlug,
    name: normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1),
    slug: normalizedSlug,
    description: `Browse all reporting, analyses, and stories categorized under ${normalizedSlug}.`,
    count: 0,
  };

  const articles = ARTICLES.filter(
    (a) => a.category.toLowerCase() === normalizedSlug || (normalizedSlug === "news" && a.isLatest)
  );

  return (
    <div className="py-8 lg:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Header Banner */}
        <div className="bg-[#FDF2F2] border border-red-100 rounded-3xl p-6 sm:p-10 mb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Category Desk</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#000000] mb-3">
              {category.name}
            </h1>
            <p className="text-sm sm:text-base text-[#535252] leading-relaxed mb-4">
              {category.description}
            </p>
            <span className="inline-block bg-white text-[#C61D1F] border border-red-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
              {articles.length} Stories Published
            </span>
          </div>
        </div>

        {/* Stories Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    <span className="font-semibold text-[#535252]">
                      By {article.author.name}
                    </span>
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
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-[#E5E6E8]">
            <p className="text-base font-bold text-[#535252] mb-2">
              No articles currently filed under {category.name}.
            </p>
            <p className="text-xs text-[#9C9C9C] mb-6">
              Check back soon for fresh reporting or explore our other sections.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 bg-[#C61D1F] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#A51719] transition-colors inline-block"
            >
              Return to Front Page
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
