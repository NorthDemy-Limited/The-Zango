import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/lib/firebase/db";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import ArticleContent from "@/components/article-content";
import ArticleReaderToolbar from "@/components/article-reader-toolbar";
import ArticleComments from "@/components/article-comments";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}


export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Dispatch Not Found | The Zango",
      description: "The requested editorial dispatch could not be found.",
    };
  }

  const rawCover = article.coverImage || "/assets/hero-featured.jpg";
  const imageUrl = rawCover.startsWith("http")
    ? rawCover
    : "https://thezango.org" + rawCover;

  const authorName = article.author?.name || "The Zango Bureau";
  const articleCategory = article.category || "News";
  const articleTags = Array.isArray(article.tags) ? article.tags : [articleCategory, "Northern Nigeria", "The Zango"];

  return {
    title: article.title + " | The Zango",
    description: article.excerpt,
    authors: [{ name: authorName }],
    keywords: articleTags,
    alternates: {
      canonical: `https://thezango.org/article/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [authorName],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      siteName: "The Zango",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [imageUrl],
      creator: article.author?.twitter || "@thezango_media",
    },
  };
}

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const authorName = article.author?.name || "The Zango Bureau";
  const authorSlug = article.author?.slug || "the-zango-bureau";
  const authorRole = article.author?.role || "Editorial Desk";
  const authorAvatar = article.author?.avatar;
  const authorBio = article.author?.bio || "Staff writer covering Northern Nigeria technology, economy, and society for The Zango.";
  const articleCategory = article.category || "News";
  const articleCategoryLower = articleCategory.toLowerCase();
  const articleTags = Array.isArray(article.tags) ? article.tags : [articleCategory, "Northern Nigeria", "The Zango"];
  const coverImg = article.coverImage || "/assets/hero-featured.jpg";

  const allArticles = await getArticles();
  const relatedArticles = allArticles
    .filter((a) => a.id !== article.id && ((a.category || "").toLowerCase() === articleCategoryLower || a.isLatest))
    .slice(0, 3);

  const articleImageUrl = coverImg.startsWith("http")
    ? coverImg
    : `https://thezango.org${coverImg}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [articleImageUrl],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: [
      {
        "@type": "Person",
        name: authorName,
        jobTitle: authorRole,
        url: `https://thezango.org/author/${authorSlug}`,
      },
    ],
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "The Zango",
      url: "https://thezango.org",
      logo: {
        "@type": "ImageObject",
        url: "https://thezango.org/assets/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://thezango.org/article/${article.slug}`,
    },
    articleSection: articleCategory,
    keywords: articleTags.join(", "),
  };

  return (
    <article className="py-8 lg:py-12 bg-white">
      {/* Schema.org NewsArticle JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            href={`/category/${articleCategoryLower}`}
            className="inline-block bg-[#FDF2F2] text-[#C61D1F] hover:bg-[#C61D1F] hover:text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm transition-colors"
          >
            {articleCategory}
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
          <Link
            href={`/author/${authorSlug}`}
            className="flex items-center space-x-3.5 group cursor-pointer"
          >
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-[#DFDFDF] group-hover:border-[#C61D1F] transition-colors">
              {authorAvatar ? (
                <Image
                  src={authorAvatar}
                  alt={authorName}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#C61D1F] text-white font-bold text-sm">
                  {authorName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-[#000000] group-hover:text-[#C61D1F] transition-colors block">
                {authorName}
              </span>
              <span className="text-xs text-[#707070]">
                {authorRole}
              </span>
            </div>
          </Link>

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
            src={coverImg}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>

        {/* Rich Article Body Content (Supports Tweets, YouTube Videos, Headings, Images) */}
        <ArticleContent content={article.content} />

        {/* Tags Row */}
        {articleTags && articleTags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#E5E6E8] flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#707070] uppercase flex items-center space-x-1 mr-1">
              <Tag className="w-3 h-3 text-[#C61D1F]" />
              <span>Topic Tags:</span>
            </span>
            {articleTags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="text-xs bg-gray-100 hover:bg-[#FDF2F2] hover:text-[#C61D1F] text-[#535252] px-3 py-1 rounded-full font-medium transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Interactive Social Share & Reading Progress Bar */}
        <div className="mt-8">
          <ArticleReaderToolbar title={article.title} slug={article.slug} />
        </div>

        {/* Author Bio Box with Link to Author Page */}
        <div className="mt-10 p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E6E8] flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          <Link
            href={`/author/${authorSlug}`}
            className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border border-[#DFDFDF] hover:border-[#C61D1F] transition-colors"
          >
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#C61D1F] text-white font-bold text-xl">
                {authorName.charAt(0)}
              </div>
            )}
          </Link>
          <div className="flex-1">
            <span className="text-xs font-bold text-[#C61D1F] uppercase tracking-wider block mb-1">
              About the Author
            </span>
            <Link
              href={`/author/${authorSlug}`}
              className="text-base font-bold text-[#000000] hover:text-[#C61D1F] transition-colors mb-1 inline-block"
            >
              {authorName}
            </Link>
            <p className="text-xs sm:text-sm text-[#707070] leading-relaxed mb-3">
              {authorBio}
            </p>
            <Link
              href={`/author/${authorSlug}`}
              className="text-xs font-bold text-[#C61D1F] hover:underline"
            >
              View all articles by {authorName} →
            </Link>
          </div>
        </div>

        {/* Interactive Reader Comments Section */}
        <ArticleComments articleSlug={article.slug} />

        {/* Related Stories */}
        <div className="mt-16 pt-10 border-t border-[#E5E6E8]">
          <div className="flex items-center space-x-2.5 mb-8">
            <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
            <h3 className="text-xl font-extrabold text-[#000000] uppercase tracking-wide">
              Related Stories
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => {
              const relCover = rel.coverImage || "/assets/hero-featured.jpg";
              return (
                <Link
                  key={rel.id}
                  href={`/article/${rel.slug}`}
                  className="group block bg-white border border-[#E5E6E8] rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300"
                >
                  <div className="relative w-full h-36 bg-gray-100">
                    <Image
                      src={relCover}
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
              );
            })}
          </div>
        </div>

      </div>
    </article>
  );
}
