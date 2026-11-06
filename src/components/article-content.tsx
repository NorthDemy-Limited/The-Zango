"use client";

import React from "react";
import Image from "next/image";
import { Tweet } from "react-tweet";
import { Quote } from "lucide-react";

interface ArticleContentProps {
  content: string;
}

export default function ArticleContent({ content }: ArticleContentProps) {
  if (!content) return null;

  const isHTML = /<[a-z][\s\S]*>/i.test(content);

  // If content is HTML from WYSIWYG
  if (isHTML) {
    // Look for Tweet and YouTube URLs inside HTML to replace with interactive components
    // Split on <p>https://x.com/... or <p>https://youtube.com/...
    const htmlChunks = content.split(/(<p>(?:https?:\/\/(?:twitter\.com|x\.com)\/[^<]+)<\/p>|<p>(?:https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^<]+)<\/p>)/gi);

    return (
      <div className="article-body-prose text-[#222222] font-normal leading-relaxed text-base sm:text-lg space-y-6">
        {htmlChunks.map((chunk, idx) => {
          if (!chunk) return null;

          // Check if this chunk is a Tweet URL
          const tweetMatch = chunk.match(
            /<p>(?:https?:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?(?:\w+)\/status(?:es)?\/(\d+)(?:\S*))<\/p>/i
          );
          if (tweetMatch) {
            const tweetId = tweetMatch[1];
            return (
              <div key={`html-tweet-${idx}`} className="my-8 flex justify-center not-prose">
                <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E5E6E8] bg-white shadow-xs p-2">
                  <div data-theme="light">
                    <Tweet id={tweetId} />
                  </div>
                </div>
              </div>
            );
          }

          // Check if this chunk is a YouTube URL
          const ytMatch = chunk.match(
            /<p>(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)<\/p>/i
          );
          if (ytMatch) {
            const videoId = ytMatch[1];
            return (
              <div key={`html-yt-${idx}`} className="my-8 rounded-2xl overflow-hidden border border-[#E5E6E8] shadow-md bg-black">
                <div className="relative w-full pt-[56.25%]">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            );
          }

          return (
            <div
              key={`html-block-${idx}`}
              className="[&>p]:mb-6 [&>p]:leading-relaxed sm:[&>p]:leading-loose [&>h2]:text-2xl sm:[&>h2]:text-3xl [&>h2]:font-extrabold [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:border-b [&>h2]:border-[#E5E6E8] [&>h2]:pb-2 [&>h3]:text-xl sm:[&>h3]:text-2xl [&>h3]:font-bold [&>h3]:mt-8 [&>h3]:mb-3 [&>blockquote]:my-8 [&>blockquote]:pl-5 sm:[&>blockquote]:pl-7 [&>blockquote]:border-l-4 [&>blockquote]:border-[#C61D1F] [&>blockquote]:bg-[#FDF2F2]/60 [&>blockquote]:py-4 [&>blockquote]:px-5 [&>blockquote]:rounded-r-2xl [&>blockquote]:italic [&>blockquote]:text-lg [&>ul]:list-disc [&>ul]:list-inside [&>ul]:my-5 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:my-5 [&>ol]:space-y-2 [&>img]:rounded-2xl [&>img]:shadow-xs [&>img]:my-6 [&>img]:max-w-full [&>table]:w-full [&>table]:border-collapse [&>table]:my-6 [&_th]:bg-gray-100 [&_th]:p-3 [&_td]:p-3 [&_td]:border [&_td]:border-gray-200"
              dangerouslySetInnerHTML={{ __html: chunk }}
            />
          );
        })}
      </div>
    );
  }

  // Fallback for plain-text / markdown chunks
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className="space-y-6 text-[#222222] font-normal leading-relaxed text-base sm:text-lg">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Check for X (Twitter) status URL
        const tweetMatch = trimmed.match(
          /^https?:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?(?:\w+)\/status(?:es)?\/(\d+)(?:\S*)?$/i
        );
        if (tweetMatch) {
          const tweetId = tweetMatch[1];
          return (
            <div key={`tweet-${index}`} className="my-8 flex justify-center not-prose">
              <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E5E6E8] bg-white shadow-xs p-2">
                <div data-theme="light">
                  <Tweet id={tweetId} />
                </div>
              </div>
            </div>
          );
        }

        // 2. Check for YouTube video URL
        const youtubeMatch = trimmed.match(
          /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
        );
        if (youtubeMatch && trimmed.length < 150) {
          const videoId = youtubeMatch[1];
          return (
            <div key={`yt-${index}`} className="my-8 rounded-2xl overflow-hidden border border-[#E5E6E8] shadow-md bg-black">
              <div className="relative w-full pt-[56.25%]">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          );
        }

        // 3. Check for Markdown image: ![Caption](url)
        const mdImageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (mdImageMatch) {
          const caption = mdImageMatch[1];
          const url = mdImageMatch[2];
          return (
            <figure key={`img-${index}`} className="my-8">
              <div className="relative w-full h-[320px] sm:h-[440px] rounded-2xl overflow-hidden border border-[#E5E6E8] bg-gray-50 shadow-xs">
                <Image
                  src={url}
                  alt={caption || "Article illustration"}
                  fill
                  sizes="(max-width: 800px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
              {caption && (
                <figcaption className="text-center text-xs sm:text-sm text-[#707070] mt-2.5 italic">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // 4. Standalone Image URL line
        const isStandaloneImageUrl =
          (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/assets/")) &&
          (trimmed.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) || trimmed.includes("res.cloudinary.com"));
        if (isStandaloneImageUrl && trimmed.length < 300) {
          return (
            <figure key={`img-url-${index}`} className="my-8">
              <div className="relative w-full h-[320px] sm:h-[440px] rounded-2xl overflow-hidden border border-[#E5E6E8] bg-gray-50 shadow-xs">
                <Image
                  src={trimmed}
                  alt="Article dispatch photo"
                  fill
                  sizes="(max-width: 800px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
            </figure>
          );
        }

        // 5. Blockquote: starts with >
        if (trimmed.startsWith(">")) {
          const quoteText = trimmed.replace(/^>\s*/, "");
          return (
            <blockquote
              key={`quote-${index}`}
              className="my-8 pl-5 sm:pl-7 border-l-4 border-[#C61D1F] bg-[#FDF2F2]/60 py-4 px-5 rounded-r-2xl italic text-[#111111] text-lg sm:text-xl font-medium"
            >
              <Quote className="w-5 h-5 text-[#C61D1F] mb-2 fill-current opacity-70" />
              <p>{quoteText}</p>
            </blockquote>
          );
        }

        // 6. Section Headings: ## or ###
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={`h3-${index}`} className="text-xl sm:text-2xl font-bold text-[#000000] mt-8 mb-3 tracking-tight">
              {trimmed.replace(/^###\s+/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={`h2-${index}`} className="text-2xl sm:text-3xl font-extrabold text-[#000000] mt-10 mb-4 tracking-tight border-b border-[#E5E6E8] pb-2">
              {trimmed.replace(/^##\s+/, "")}
            </h2>
          );
        }

        // 7. Bullet lists
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n/).map((line) => line.replace(/^[-*]\s+/, "").trim());
          return (
            <ul key={`ul-${index}`} className="my-5 space-y-2 list-disc list-inside text-[#333333]">
              {items.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        // Default Paragraph
        return (
          <p key={`p-${index}`} className="leading-relaxed sm:leading-loose text-[#2b2b2b]">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
