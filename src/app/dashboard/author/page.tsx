"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
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
  BookOpen,
  Trash2,
  LayoutDashboard,
  Bell,
  LogOut,
  ShieldCheck,
  KeyRound,
  Search,
  BarChart3,
  Flame,
  Check,
  X,
  Plus
} from "lucide-react";
import { ARTICLES } from "@/data/mock-articles";
import { createSubmission } from "@/lib/firebase/db";
import { useAuth, UserRole } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/image-uploader";
import RichEditor from "@/components/rich-editor";

function AuthorStudioContent() {
  const router = useRouter();
  const { user, role, logout, switchRole, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"composer" | "stories" | "stats" | "settings">("composer");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [coverImage, setCoverImage] = useState("/assets/hero-featured.jpg");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);

  // Require auth
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login?redirect=/dashboard/author";
    }
  }, [isAuthenticated, isLoading]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("thezango_writer_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title) setTitle(draft.title);
        if (draft.category) setCategory(draft.category);
        if (draft.coverImage) setCoverImage(draft.coverImage);
        if (draft.excerpt) setExcerpt(draft.excerpt);
        if (draft.content) setContent(draft.content);
        setLastAutoSaved(draft.savedAt || "Previous session");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Auto-save draft changes to localStorage
  useEffect(() => {
    if (!title && !content) return;
    const timeout = setTimeout(() => {
      try {
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        localStorage.setItem(
          "thezango_writer_draft",
          JSON.stringify({
            title,
            category,
            coverImage,
            excerpt,
            content,
            savedAt: now,
          })
        );
        setLastAutoSaved(now);
      } catch (e) {
        // ignore
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [title, category, coverImage, excerpt, content]);

  const myStories = useMemo(() => {
    return ARTICLES.filter((a) => a.author.name === (user?.name || "Fatima Sanusi") || a.isFeatured);
  }, [user]);

  const wordCount = useMemo(() => {
    const textOnly = content.replace(/<[^>]*>/g, " ").trim();
    if (!textOnly) return 0;
    return textOnly.split(/\s+/).length;
  }, [content]);

  const estimatedReadTime = useMemo(() => {
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes || 1} min read`;
  }, [wordCount]);

  const handleClearDraft = () => {
    if (confirm("Are you sure you want to discard your draft? This cannot be undone.")) {
      localStorage.removeItem("thezango_writer_draft");
      setTitle("");
      setExcerpt("");
      setContent("");
      setLastAutoSaved(null);
      setStatusMessage("Draft discarded.");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      localStorage.setItem(
        "thezango_writer_draft",
        JSON.stringify({
          title,
          category,
          coverImage,
          excerpt,
          content,
          savedAt: now,
        })
      );
      setLastAutoSaved(now);
      setStatusMessage("Story saved to browser storage!");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      // ignore
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please provide both a headline and story content before submitting.");
      return;
    }

    try {
      await createSubmission({
        title,
        excerpt: excerpt || "Submitted by contributing writer...",
        content,
        category,
        authorName: user?.name || "Fatima Sanusi",
        authorEmail: user?.email || "fatima.sanusi@thezango.org",
        wordCount,
        readTime: estimatedReadTime,
        coverImage,
      });

      setStatusMessage("Manuscript pitched to editorial desk for review!");
      localStorage.removeItem("thezango_writer_draft");
      setTitle("");
      setExcerpt("");
      setContent("");
      setLastAutoSaved(null);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.warn("Could not submit article:", err);
      setStatusMessage("Failed to submit. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      
      {/* 1. TOP NAVBAR */}
      <header className="bg-white border-b border-[#E5E6E8] sticky top-0 z-40 shadow-2xs h-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="relative w-36 h-9">
                <Image src="/assets/logo.png" alt="The Zango" fill sizes="150px" className="object-contain" priority />
              </div>
            </Link>

            <div className="hidden sm:flex items-center space-x-2 text-xs font-extrabold text-[#111111] uppercase tracking-wider pl-4 border-l border-gray-200">
              <span className="w-2 h-4 bg-emerald-600 rounded-xs" />
              <span>Writer & Contributor Studio</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border border-gray-200 bg-white text-xs font-semibold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-gray-500 text-[11px]">Role:</span>
              <select
                value={role || "writer"}
                onChange={(e) => {
                  const targetRole = e.target.value as UserRole;
                  switchRole(targetRole);
                  if (targetRole === "admin") window.location.href = "/dashboard/admin";
                  if (targetRole === "editor") window.location.href = "/dashboard/editor";
                }}
                className="font-extrabold text-xs text-gray-900 bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="writer">Staff Writer</option>
                <option value="editor">Desk Editor</option>
                <option value="admin">Chief Admin</option>
              </select>
            </div>

            <div className="flex items-center space-x-2.5 pl-2 border-l border-gray-200">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-600 shrink-0">
                <Image
                  src={user?.avatar || "/assets/social-image-4.png"}
                  alt={user?.name || "Fatima Sanusi"}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="font-extrabold text-xs text-[#111111] leading-tight">
                  {user?.name || "Fatima Sanusi"}
                </div>
                <div className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                  STAFF WRITER
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row items-start gap-6">
        
        {/* LEFT ROUNDED SIDEBAR (Writer Scope) */}
        <aside className="w-full md:w-60 lg:w-64 shrink-0 bg-white rounded-3xl p-3 border border-[#E5E6E8] shadow-2xs space-y-1">
          
          <button
            onClick={() => setActiveTab("composer")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "composer"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <PenTool className="w-4 h-4 shrink-0" />
              <span>Draft Story</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("stories")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "stories"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 shrink-0" />
              <span>My Stories</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "stories" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {myStories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "stats"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>My Readership</span>
            </div>
          </button>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "text-[#535252] hover:bg-gray-100 hover:text-black"
              }`}
            >
              <div className="flex items-center space-x-3">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Account Settings</span>
              </div>
            </button>
          </div>

        </aside>

        {/* RIGHT WORKSPACE */}
        <main className="flex-1 w-full space-y-6">

          {statusMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: COMPOSER (WYSIWYG Rich Editor) */}
          {activeTab === "composer" && (
            <div className="bg-white rounded-3xl border border-[#E5E6E8] p-6 sm:p-8 shadow-2xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E6E8] gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-5 bg-emerald-600 rounded-xs inline-block" />
                    <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                      Draft Story Manuscript
                    </h3>
                  </div>
                  <p className="text-xs text-[#707070] mt-0.5">
                    Compose investigative reports and pitches for Northern Nigeria newsroom desks.
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-xs font-semibold text-gray-500">
                  {lastAutoSaved && (
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                      Saved {lastAutoSaved}
                    </span>
                  )}
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{estimatedReadTime}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-900 mb-1.5">Headline *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter dispatch headline..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-emerald-600 text-sm font-semibold focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-900 mb-1.5">Beat / Desk</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 text-xs focus:outline-hidden bg-white"
                    >
                      <option value="Technology">Technology & Innovation</option>
                      <option value="Business">Business & Capital Markets</option>
                      <option value="Features">Longform Features</option>
                      <option value="News">Breaking News</option>
                      <option value="Politics">Politics & Governance</option>
                      <option value="Lifestyle">Sahelian Culture & Arts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-900 mb-1.5">Lead Excerpt</label>
                    <input
                      type="text"
                      placeholder="Brief 1-2 sentence lead summary..."
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                <ImageUploader
                  label="Story Cover Image (Upload from device or select editorial stock)"
                  value={coverImage}
                  onChange={(url) => setCoverImage(url)}
                />

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-900 mb-2">
                    Manuscript Body (WYSIWYG Rich Editor) *
                  </label>
                  <RichEditor
                    value={content}
                    onChange={(html) => setContent(html)}
                    placeholder="Compose story with formatting, images, tables, and video/tweet embeds..."
                    height={380}
                  />
                </div>

                <div className="pt-4 border-t border-[#E5E6E8] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:border-black text-xs font-bold uppercase transition-colors cursor-pointer"
                    >
                      Save Local Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Discard draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Review Queue</span>
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 2: MY STORIES */}
          {activeTab === "stories" && (
            <div className="bg-white rounded-3xl border border-[#E5E6E8] p-6 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                  My Published Bylines ({myStories.length})
                </h3>
                <span className="text-xs text-gray-400">Total reach: 18.4K reads</span>
              </div>

              <div className="divide-y divide-gray-100">
                {myStories.map((story) => (
                  <div key={story.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="relative w-14 h-11 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                        <Image src={story.coverImage} alt={story.title} fill sizes="56px" className="object-cover" />
                      </div>
                      <div>
                        <Link href={`/article/${story.slug}`} className="font-bold text-xs text-gray-900 hover:text-emerald-600 line-clamp-1">
                          {story.title}
                        </Link>
                        <span className="text-[11px] text-gray-500">{story.category} • {story.publishedAt}</span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                      Live on Site
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: STATS */}
          {activeTab === "stats" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs">
                <span className="text-xs font-bold uppercase text-gray-500">Published Bylines</span>
                <span className="text-3xl font-extrabold text-gray-900 block mt-2">{myStories.length}</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs">
                <span className="text-xs font-bold uppercase text-gray-500">Total Readership</span>
                <span className="text-3xl font-extrabold text-emerald-600 block mt-2">18,400</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs">
                <span className="text-xs font-bold uppercase text-gray-500">Average Word Count</span>
                <span className="text-3xl font-extrabold text-blue-600 block mt-2">940</span>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl border border-[#E5E6E8] p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="pb-4 border-b border-[#E5E6E8]">
                <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                  Staff Writer Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Byline Name</label>
                    <input type="text" defaultValue={user?.name || "Fatima Sanusi"} className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-emerald-600 focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Official Email</label>
                    <input type="email" defaultValue={user?.email || "fatima.sanusi@thezango.org"} disabled className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Journalist Bio</label>
                    <textarea rows={3} defaultValue={user?.bio || "Correspondent covering capital markets, digital economy, and culture."} className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:border-emerald-600 focus:outline-hidden resize-none" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E6E8] flex justify-end">
                <button
                  type="button"
                  onClick={() => setStatusMessage("Profile updated successfully!")}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}

export default function AuthorDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-8 text-sm text-[#707070]">
          Loading Writer Studio...
        </div>
      }
    >
      <AuthorStudioContent />
    </Suspense>
  );
}
