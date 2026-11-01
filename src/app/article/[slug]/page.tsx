import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ARTICLES } from "@/data/mock-articles";
import { Calendar, Clock, Share2, ArrowLeft } from "lucide-react";
import { TwitterIcon, FacebookIcon, LinkedinIcon } from "@/components/social-icons";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = ARTICLES.filter(
    (a) => a.id !== article.id && (a.category === article.category || a.isLatest)
  ).slice(0, 3);

  return (
    <article className="py-8 lg:py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E6E8]">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#535252] hover:text-[#C61D1F] uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <Link
            href={`/category/${article.category.toLowerCase()}`}
            className="inline-block bg-[#FDF2F2] text-[#C61D1F] hover:bg-[#C61D1F] hover:text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm transition-colors"
          >
            {article.category}
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#000000] leading-tight mb-4">
          {article.title}
        </h1>

        {/* Excerpt / Lead */}
        <p className="text-base sm:text-lg text-[#535252] leading-relaxed mb-6 font-normal">
          {article.excerpt}
        </p>

        {/* Author & Publication Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[#E5E6E8] mb-8">
          <div className="flex items-center space-x-3.5">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-[#DFDFDF]">
              {article.author.avatar ? (
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#C61D1F] text-white font-bold text-sm">
                  {article.author.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-[#000000] block">
                {article.author.name}
              </span>
              <span className="text-xs text-[#707070]">
                {article.author.role}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-[#707070]">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#9C9C9C]" />
              <span>{article.publishedAt}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-[#9C9C9C]" />
              <span>{article.readTime}</span>
            </span>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="relative w-full h-[320px] sm:h-[440px] rounded-2xl overflow-hidden mb-10 shadow-md">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div className="prose prose-lg max-w-none text-[#111111] leading-relaxed space-y-6">
          {article.content.split("\n\n").map((para, index) => {
            const trimmed = para.trim();
            if (!trimmed) return null;
            if (trimmed.startsWith("### ")) {
              return (
                <h3 key={index} className="text-xl sm:text-2xl font-bold text-[#000000] pt-4 pb-2 border-b border-[#E5E6E8]/70">
                  {trimmed.replace("### ", "")}
                </h3>
              );
            }
            if (trimmed.startsWith("1. ") || trimmed.startsWith("- ")) {
              return (
                <div key={index} className="bg-gray-50 border-l-4 border-[#C61D1F] p-4 rounded-r-lg my-4 text-sm sm:text-base text-[#535252]">
                  {trimmed}
                </div>
              );
            }
            return (
              <p key={index} className="text-base sm:text-lg text-[#333333] leading-relaxed">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Social Share Bar */}
        <div className="mt-12 pt-6 border-t border-[#E5E6E8] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-[#C61D1F]" />
            <span className="text-xs font-bold text-[#000000] uppercase tracking-wider">
              Share This Story:
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-md bg-[#F5F5F5] hover:bg-[#C61D1F] hover:text-white text-xs font-semibold text-[#535252] flex items-center space-x-1.5 transition-colors"
            >
              <TwitterIcon className="w-3.5 h-3.5" />
              <span>Twitter</span>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-md bg-[#F5F5F5] hover:bg-[#C61D1F] hover:text-white text-xs font-semibold text-[#535252] flex items-center space-x-1.5 transition-colors"
            >
              <FacebookIcon className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-md bg-[#F5F5F5] hover:bg-[#C61D1F] hover:text-white text-xs font-semibold text-[#535252] flex items-center space-x-1.5 transition-colors"
            >
              <LinkedinIcon className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>

        {/* Author Bio Box */}
        <div className="mt-10 p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E6E8] flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border border-[#DFDFDF]">
            {article.author.avatar ? (
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#C61D1F] text-white font-bold text-xl">
                {article.author.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-[#C61D1F] uppercase tracking-wider block mb-1">
              About the Author
            </span>
            <h4 className="text-base font-bold text-[#000000] mb-1">
              {article.author.name}
            </h4>
            <p className="text-xs sm:text-sm text-[#707070] leading-relaxed">
              {article.author.bio || "Staff writer covering Northern Nigeria technology, economy, and society for The Zango."}
            </p>
          </div>
        </div>

        {/* Related Stories */}
        <div className="mt-16 pt-10 border-t border-[#E5E6E8]">
          <div className="flex items-center space-x-2.5 mb-8">
            <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
            <h3 className="text-xl font-extrabold text-[#000000] uppercase tracking-wide">
              Related Stories
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/article/${rel.slug}`}
                className="group block bg-white border border-[#E5E6E8] rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300"
              >
                <div className="relative w-full h-36 bg-gray-100">
                  <Image
                    src={rel.coverImage}
                    alt={rel.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <span className="text-[11px] font-bold text-[#C61D1F] block mb-1">
                    {rel.publishedAt}
                  </span>
                  <h4 className="text-sm font-bold text-[#000000] group-hover:text-[#C61D1F] transition-colors leading-snug line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </article>
  );
}
