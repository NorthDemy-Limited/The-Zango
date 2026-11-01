"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  PenTool, 
  Clock, 
  CheckCircle2, 
  Send, 
  Save, 
  Eye, 
  FileText, 
  ArrowLeft,
  Sparkles,
  BookOpen
} from "lucide-react";
import { ARTICLES } from "@/data/mock-articles";

export default function AuthorStudioPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Business");
  const [coverImage, setCoverImage] = useState("/assets/hero-featured.jpg");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Author stories
  const myStories = useMemo(() => {
    return ARTICLES.filter((a) => a.author.name === "Abdul Rahman" || a.isFeatured);
  }, []);

  // Word count & read time computation
  const wordCount = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [content]);

  const estimatedReadTime = useMemo(() => {
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes || 1} min read`;
  }, [wordCount]);

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("Story saved to local drafts successfully!");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setStatusMessage("Story submitted for Chief Editor review! You will receive notification upon approval.");
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16">
      
      {/* Top Header */}
      <header className="bg-white border-b border-[#E5E6E8] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-[#535252] hover:text-[#C61D1F] text-xs font-bold uppercase transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Site</span>
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center space-x-2">
              <PenTool className="w-4 h-4 text-[#C61D1F]" />
              <h1 className="text-base font-extrabold text-[#000000]">
                Writer & Contributor Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/admin"
              className="px-3.5 py-1.5 rounded-lg border border-[#DFDFDF] hover:border-[#C61D1F] text-xs font-bold text-[#535252] hover:text-[#C61D1F] transition-colors"
            >
              ← Switch to Admin CMS
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Author Profile Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E6E8] shadow-2xs mb-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#C61D1F]">
              <Image src="/assets/social-image-1.png" alt="Abdul Rahman" fill sizes="64px" className="object-cover" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#C61D1F] uppercase tracking-wider block mb-1">
                Verified Contributor
              </span>
              <h2 className="text-xl font-extrabold text-[#000000]">Abdul Rahman</h2>
              <p className="text-xs text-[#707070] max-w-md">
                Senior Business Analyst covering capital markets, investment banking, and fintech across Northern Nigeria.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 border-t sm:border-t-0 sm:border-l border-[#E5E6E8] pt-4 sm:pt-0 sm:pl-6 text-center">
            <div>
              <span className="text-2xl font-extrabold text-[#000000] block">{myStories.length + 3}</span>
              <span className="text-[10px] uppercase font-bold text-[#707070]">Published</span>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-[#C61D1F] block">18.4K</span>
              <span className="text-[10px] uppercase font-bold text-[#707070]">Total Reads</span>
            </div>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold">{statusMessage}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Editor Workspace (Left - 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5E6E8] p-6 sm:p-8 shadow-2xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5E6E8]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                <h3 className="text-lg font-bold text-[#000000] uppercase tracking-wide">
                  Draft a Story
                </h3>
              </div>
              <div className="flex items-center space-x-4 text-xs font-semibold text-[#707070]">
                <span>{wordCount} words</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{estimatedReadTime}</span>
                </span>
              </div>
            </div>

            <form className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#000000] uppercase mb-1.5">
                  Working Headline *
                </label>
                <input
                  type="text"
                  placeholder="Enter a compelling title for your story..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-base font-bold text-[#000000] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#000000] uppercase mb-1.5">
                    Beat / Topic
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    <option value="Business">Business</option>
                    <option value="Technology">Technology</option>
                    <option value="News">News</option>
                    <option value="Features">Features</option>
                    <option value="Opinion">Opinion</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#000000] uppercase mb-1.5">
                    Suggested Image
                  </label>
                  <select
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    <option value="/assets/hero-featured.jpg">Hero Cover Deal</option>
                    <option value="/assets/trending-hero.jpg">Climate Innovation Field</option>
                    <option value="/assets/news-tomato-jos.jpg">Agro Logistics Kaduna</option>
                    <option value="/assets/news-gitex.jpg">GITEX Gathering</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#000000] uppercase mb-1.5">
                  Lead Paragraph / Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize the core premise and significance of the story..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#000000] uppercase mb-1.5">
                  Manuscript Body *
                </label>
                <textarea
                  rows={10}
                  placeholder="Draft your story here. Use ### for subheadings and bullet points where helpful..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-sm text-[#111111] leading-relaxed focus:outline-hidden resize-y font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E5E6E8] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2.5 border border-[#DFDFDF] hover:border-black text-[#535252] rounded-xl text-xs font-bold uppercase transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  className="px-6 py-2.5 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-2 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Contributor Guidelines & My Stories */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Guidelines Card */}
            <div className="bg-[#FDF2F2] border border-red-200 rounded-3xl p-6">
              <div className="flex items-center space-x-2 text-[#C61D1F] font-bold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Editorial Checklist</span>
              </div>
              <ul className="space-y-2 text-xs text-[#535252] leading-relaxed list-disc list-inside">
                <li>Attribute all quotes and citations accurately.</li>
                <li>Verify all currency values (NGN and USD equivalents).</li>
                <li>Ensure headlines are factual and avoid clickbait.</li>
                <li>Double check local spelling of northern locales and names.</li>
              </ul>
            </div>

            {/* My Stories Card */}
            <div className="bg-white rounded-3xl border border-[#E5E6E8] p-6 shadow-2xs">
              <h4 className="text-sm font-bold text-[#000000] uppercase tracking-wide mb-4 pb-2 border-b border-[#E5E6E8]">
                Recent Bylines
              </h4>

              <div className="space-y-3.5">
                {myStories.map((story) => (
                  <div key={story.id} className="p-3 rounded-xl border border-[#E5E6E8] hover:border-[#C61D1F] transition-colors group">
                    <div className="flex items-center justify-between text-[10px] text-[#9C9C9C] mb-1 font-semibold">
                      <span>{story.publishedAt}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                        Published
                      </span>
                    </div>
                    <Link
                      href={`/article/${story.slug}`}
                      className="text-xs font-bold text-[#000000] group-hover:text-[#C61D1F] transition-colors line-clamp-2 block mb-2"
                    >
                      {story.title}
                    </Link>
                    <div className="flex items-center justify-between text-[11px] text-[#707070]">
                      <span>{story.views || 4520} views</span>
                      <Link
                        href={`/article/${story.slug}`}
                        className="text-[#C61D1F] font-bold inline-flex items-center space-x-1"
                      >
                        <span>View</span>
                        <Eye className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
