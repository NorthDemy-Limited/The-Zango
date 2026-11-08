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
import { ARTICLES, CATEGORIES } from "@/data/mock-articles";
import { createSubmission, getSubmissions, updateSubmission } from "@/lib/firebase/db";
import { Submission } from "@/types";
import { useAuth, UserRole } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/image-uploader";
import RichEditor from "@/components/rich-editor";

function AuthorStudioContent() {
  const router = useRouter();
  const { user, role, logout, switchRole, updateUser, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"composer" | "stories" | "stats" | "settings">("composer");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [coverImage, setCoverImage] = useState("/assets/hero-featured.jpg");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);

  // Writer Profile Settings state
  const [profileNameOverride, setProfileNameOverride] = useState<string | null>(null);
  const [profileAvatarOverride, setProfileAvatarOverride] = useState<string | null>(null);
  const [profileBioOverride, setProfileBioOverride] = useState<string | null>(null);
  const [profileDeskOverride, setProfileDeskOverride] = useState<string | null>(null);

  const profileName = profileNameOverride ?? (user?.name || "Fatima Sanusi");
  const profileAvatar = profileAvatarOverride ?? (user?.avatar || "/assets/social-image-4.png");
  const profileBio = profileBioOverride ?? (user?.bio || "Tech correspondent tracking venture capital, AI hubs, and mobile banking adoption from Kano to Kaduna.");
  const profileDesk = profileDeskOverride ?? (user?.desk || "Technology & Digital Economy");

  const setProfileName = (val: string) => setProfileNameOverride(val);
  const setProfileAvatar = (val: string) => setProfileAvatarOverride(val);
  const setProfileBio = (val: string) => setProfileBioOverride(val);
  const setProfileDesk = (val: string) => setProfileDeskOverride(val);

  const handleSaveProfile = () => {
    updateUser({
      name: profileName,
      avatar: profileAvatar,
      bio: profileBio,
      desk: profileDesk,
    });
    setStatusMessage("Staff Writer profile, avatar, and bio saved successfully!");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadSubmissions = async () => {
    const all = await getSubmissions();
    const mine = all.filter(
      (s) =>
        (user?.email && s.authorEmail?.toLowerCase() === user.email.toLowerCase()) ||
        s.authorName?.toLowerCase() === (user?.name || "").toLowerCase()
    );
    setMySubmissions(mine);
  };

  useEffect(() => {
    let active = true;
    const fetchAuthorSubmissions = async () => {
      await loadSubmissions();
    };
    if (active) {
      void fetchAuthorSubmissions();
    }
    return () => {
      active = false;
    };
  }, [user]);

  // Require auth
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard/author");
    }
  }, [isAuthenticated, isLoading, router]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    let active = true;
    const restoreDraft = async () => {
      try {
        const saved = typeof window !== "undefined" ? localStorage.getItem("thezango_writer_draft") : null;
        if (saved && active) {
          const draft = JSON.parse(saved);
          if (draft.title) setTitle(draft.title);
          if (draft.category) setCategory(draft.category);
          if (draft.coverImage) setCoverImage(draft.coverImage);
          if (draft.excerpt) setExcerpt(draft.excerpt);
          if (draft.content) setContent(draft.content);
          setLastAutoSaved(draft.savedAt || "Previous session");
        }
      } catch {
        // ignore
      }
    };
    void restoreDraft();
    return () => {
      active = false;
    };
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
      await loadSubmissions();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.warn("Could not submit article:", err);
      setStatusMessage("Failed to submit. Please try again.");
    }
  };

  const handleEditSubmission = (sub: Submission) => {
    setTitle(sub.title);
    setCategory(sub.category);
    setCoverImage(sub.coverImage || "/assets/hero-featured.jpg");
    setExcerpt(sub.excerpt);
    setContent(sub.content);
    setActiveTab("composer");
    setStatusMessage(`Loaded "${sub.title}" into composer for editing!`);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            
            <div className="flex items-center space-x-2.5 pl-2">
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

          {/* TAB 2: MY STORIES & PITCHES */}
          {activeTab === "stories" && (
            <div className="space-y-6">
              {/* Active Manuscript Pitches */}
              <div className="bg-white rounded-3xl border border-[#E5E6E8] p-6 shadow-2xs space-y-4">
                <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    Pitched Manuscripts & Review Status ({mySubmissions.length})
                  </h3>
                  <span className="text-xs text-gray-400">Live Newsroom Queue</span>
                </div>

                {mySubmissions.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">
                    No active pitches currently in review. Submit your draft above to pitch the editors!
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {mySubmissions.map((sub) => (
                      <div key={sub.id} className="py-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{sub.category} • {sub.submittedAt}</span>
                            <h4 className="font-bold text-sm text-gray-900">{sub.title}</h4>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {sub.status === "needs_revision" ? (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-extrabold uppercase border border-amber-300">
                                ⚠️ Revision Requested
                              </span>
                            ) : sub.status === "approved" ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase border border-emerald-300">
                                ✓ Approved & Published
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-extrabold uppercase border border-blue-200">
                                ⏳ In Desk Review
                              </span>
                            )}
                          </div>
                        </div>

                        {/* If Editor Sent Feedback Notes */}
                        {sub.status === "needs_revision" && (
                          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <span className="font-black text-[10px] uppercase tracking-wider text-amber-800 block">
                                Editor-in-Chief Feedback:
                              </span>
                              <p className="italic">{sub.feedbackNotes || "Please polish grammar and check quotes before re-submitting."}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditSubmission(sub)}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm cursor-pointer"
                            >
                              Edit & Re-submit →
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Published Bylines */}
              <div className="bg-white rounded-3xl border border-[#E5E6E8] p-6 shadow-2xs space-y-4">
                <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    Live Published Bylines ({myStories.length})
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
                  Staff Writer Profile & Identity
                </h3>
                <p className="text-xs text-[#707070] mt-1">
                  Manage your journalist byline, assigned beat, profile picture, and author biography.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Writer Profile Avatar Uploader */}
                  <div>
                    <ImageUploader
                      value={profileAvatar}
                      onChange={(url) => setProfileAvatar(url)}
                      label="Writer Profile Picture / Avatar"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Official Byline Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Corporate Email</label>
                    <input
                      type="email"
                      value={user?.email || "fatima.sanusi@thezango.org"}
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Assigned Beat / Desk</label>
                    <select
                      value={profileDesk}
                      onChange={(e) => setProfileDesk(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="Executive & Investigation">Executive & Investigation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Journalist Biography (Shown to Readers)</label>
                    <textarea
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Brief background on your reporting focus across Northern Nigeria..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-emerald-600 text-xs focus:outline-hidden resize-none"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      This biography and photo will appear under &ldquo;About the Author&rdquo; on all stories published under your byline.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E6E8] flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Save Profile Changes
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
