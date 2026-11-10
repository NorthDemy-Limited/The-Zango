import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AUTHORS } from "@/data/mock-articles";
import { getArticles } from "@/lib/firebase/db";
import { MapPin, ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/social-icons";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export const instant = false;

export async function generateStaticParams() {
  return AUTHORS.map((author) => ({
    slug: author.slug,
  }));
}

export default async function AuthorProfilePage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = AUTHORS.find((a) => a.slug === slug);

  if (!author) {
    notFound();
  }

  const allArticles = await getArticles();
  const authorArticles = allArticles.filter(
    (a) => a.author.slug === author.slug || a.author.name === author.name
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

        {/* Author Header Card */}
        <div className="bg-[#FAFAFA] border border-[#E5E6E8] rounded-3xl p-6 sm:p-10 mb-12 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            
            {/* Avatar */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shrink-0 border-3 border-[#C61D1F] shadow-md bg-white">
              {author.avatar ? (
                <Image
                  src={author.avatar}
                  alt={author.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#C61D1F] text-white font-extrabold text-3xl">
                  {author.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="inline-flex items-center space-x-1 bg-[#FDF2F2] text-[#C61D1F] text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Staff Journalist</span>
                </span>

                {author.location && (
                  <span className="inline-flex items-center space-x-1 text-xs text-[#707070]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{author.location}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#000000] mb-1">
                {author.name}
              </h1>

              <p className="text-xs sm:text-sm font-semibold text-[#C61D1F] uppercase tracking-wide mb-3">
                {author.role}
              </p>

              <p className="text-sm text-[#535252] leading-relaxed max-w-2xl mb-4">
                {author.bio}
              </p>

              {/* Social links */}
              <div className="flex items-center justify-center sm:justify-start space-x-3 pt-2">
                {author.twitter && (
                  <a
                    href={`https://twitter.com/${author.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white border border-[#DFDFDF] hover:border-[#C61D1F] text-[#535252] hover:text-[#C61D1F] transition-colors flex items-center space-x-1.5 text-xs font-semibold"
                  >
                    <TwitterIcon className="w-3.5 h-3.5" />
                    <span>{author.twitter}</span>
                  </a>
                )}
                {author.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${author.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white border border-[#DFDFDF] hover:border-[#C61D1F] text-[#535252] hover:text-[#C61D1F] transition-colors flex items-center space-x-1.5 text-xs font-semibold"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            </div>

            {/* Stat Box */}
            <div className="border-t sm:border-t-0 sm:border-l border-[#E5E6E8] pt-4 sm:pt-0 sm:pl-8 text-center shrink-0">
              <span className="text-3xl font-extrabold text-[#000000] block">
                {authorArticles.length}
              </span>
              <span className="text-[11px] font-bold text-[#707070] uppercase tracking-wider">
                Published Bylines
              </span>
            </div>

          </div>
        </div>

        {/* Stories Section Header */}
        <div className="flex items-center space-x-2.5 pb-3.5 mb-8 border-b border-[#E5E6E8]">
          <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#000000] tracking-wide uppercase flex items-center space-x-2">
            <span>Stories by {author.name}</span>
            <BookOpen className="w-5 h-5 text-[#C61D1F]" />
          </h2>
        </div>

        {/* Articles Grid */}
        {authorArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {authorArticles.map((article) => (
              <article
                key={article.id}
                className="group bg-white border border-[#E5E6E8] hover:border-[#C61D1F] rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
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

                  <div className="p-5">
                    <div className="flex items-center space-x-2 text-[11px] text-[#9C9C9C] mb-2 font-medium">
                      <span>{article.publishedAt}</span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#000000] group-hover:text-[#C61D1F] transition-colors leading-snug line-clamp-2 mb-2.5">
                      <Link href={`/article/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-xs sm:text-sm text-[#707070] line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-[#E5E6E8] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#535252]">
                      {article.category}
                    </span>
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
          <div className="text-center py-16 bg-[#FAFAFA] rounded-2xl border border-[#E5E6E8]">
            <p className="text-sm font-semibold text-[#535252]">
              No active stories currently listed under this byline.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
