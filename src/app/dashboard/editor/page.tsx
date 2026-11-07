"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3,
  Star, 
  TrendingUp, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck, 
  Search, 
  Sparkles, 
  Flame, 
  Clock, 
  Layers, 
  Inbox, 
  Check, 
  X, 
  Eye, 
  Filter, 
  RefreshCw, 
  LayoutDashboard,
  Bell,
  LogOut,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Send,
  Lock,
  KeyRound,
  ShieldAlert
} from "lucide-react";
import { useAuth, UserRole } from "@/context/auth-context";
import { Article, Submission } from "@/types";
import { 
  getArticles, 
  createArticle, 
  updateArticle, 
  toggleArticleFlag, 
  getSubmissions, 
  approveSubmission, 
  rejectSubmission 
} from "@/lib/firebase/db";
import { CATEGORIES } from "@/data/mock-articles";
import ImageUploader from "@/components/image-uploader";
import RichEditor from "@/components/rich-editor";

function EditorDashboardContent() {
  const router = useRouter();
  const { user, role, logout, switchRole, isAuthenticated, isLoading } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"overview" | "reviewQueue" | "dispatches" | "desks" | "settings">("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Business",
    coverImage: "/assets/hero-featured.jpg",
    excerpt: "",
    content: "",
    authorName: "Aisha Dahiru",
    readTime: "4 min read",
    isFeatured: false,
    isTrending: false,
    isEditorsPick: false,
    isLatest: false,
  });

  // Gatekeeping: require authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login?redirect=/dashboard/editor";
    }
  }, [isAuthenticated, isLoading]);

  const loadData = async () => {
    const arts = await getArticles();
    const subsQueue = await getSubmissions();
    setArticles([...arts]);
    setSubmissions([...subsQueue]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleFlag = async (id: string, flag: "isFeatured" | "isTrending" | "isEditorsPick" | "isLatest") => {
    const updated = await toggleArticleFlag(id, flag);
    if (updated) {
      await loadData();
      triggerToast(`Updated placement status for "${updated.title.slice(0, 25)}..."`);
    }
  };

  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      category: article.category,
      coverImage: article.coverImage,
      excerpt: article.excerpt,
      content: article.content,
      authorName: article.author.name,
      readTime: article.readTime,
      isFeatured: !!article.isFeatured,
      isTrending: !!article.isTrending,
      isEditorsPick: !!article.isEditorsPick,
      isLatest: !!article.isLatest,
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const slug =
      formData.slug.trim() ||
      formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    if (editingArticle) {
      await updateArticle(editingArticle.id, {
        title: formData.title,
        slug,
        category: formData.category,
        coverImage: formData.coverImage,
        excerpt: formData.excerpt,
        content: formData.content,
        author: {
          ...editingArticle.author,
          name: formData.authorName,
          slug: formData.authorName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        },
        readTime: formData.readTime,
        isFeatured: formData.isFeatured,
        isTrending: formData.isTrending,
        isEditorsPick: formData.isEditorsPick,
        isLatest: formData.isLatest,
      });
      triggerToast(`Updated dispatch: "${formData.title.slice(0, 30)}..."`);
    } else {
      await createArticle({
        title: formData.title,
        slug,
        category: formData.category,
        coverImage: formData.coverImage || "/assets/hero-featured.jpg",
        excerpt: formData.excerpt || "Editorial dispatch from The Zango Bureau...",
        content: formData.content || formData.title,
        publishedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        readTime: formData.readTime || "4 min read",
        isFeatured: formData.isFeatured,
        isTrending: formData.isTrending,
        isEditorsPick: formData.isEditorsPick,
        isLatest: formData.isLatest,
        views: 0,
        author: {
          id: "author-editor",
          name: user?.name || "Aisha Dahiru",
          slug: (user?.name || "aisha-dahiru").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          role: "Senior Desk Editor",
          avatar: user?.avatar || "/assets/social-image-2.png",
        },
      });
      triggerToast(`Published desk dispatch: "${formData.title.slice(0, 30)}..."`);
    }

    await loadData();
    setShowCreateModal(false);
    setEditingArticle(null);
  };

  const handleApproveSubmission = async (id: string, title: string) => {
    const published = await approveSubmission(id);
    if (published) {
      await loadData();
      triggerToast(`Approved & published dispatch: "${title.slice(0, 30)}..."`);
    }
  };

  const handleRejectSubmission = async (id: string, title: string) => {
    if (confirm(`Reject manuscript "${title}"?`)) {
      await rejectSubmission(id);
      await loadData();
      triggerToast(`Rejected submission: "${title.slice(0, 30)}..."`);
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || a.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      
      {/* 1. TOP NAVBAR */}
      <header className="bg-white border-b border-[#E5E6E8] sticky top-0 z-40 shadow-2xs h-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Brand Logo & Jump to */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative w-36 h-9">
                <Image
                  src="/assets/logo.png"
                  alt="The Zango"
                  fill
                  sizes="150px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            <div className="hidden md:flex items-center relative w-72 lg:w-84">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Jump to desk story..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 py-2 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden bg-[#FAFAFA] focus:bg-white transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-sm">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span>Desk Editor Clearance</span>
            </span>

            {/* Dynamic Role Switcher */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border border-gray-200 bg-white text-xs font-semibold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-gray-500 text-[11px]">Role:</span>
              <select
                value={role || "editor"}
                onChange={(e) => {
                  const targetRole = e.target.value as UserRole;
                  switchRole(targetRole);
                  if (targetRole === "admin") window.location.href = "/dashboard/admin";
                  if (targetRole === "writer") window.location.href = "/dashboard/author";
                }}
                className="font-extrabold text-xs text-gray-900 bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="editor">Desk Editor</option>
                <option value="admin">Chief Admin</option>
                <option value="writer">Staff Writer</option>
              </select>
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => setActiveTab("reviewQueue")}
              className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {pendingSubmissions.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C61D1F]" />
              )}
            </button>

            {/* Profile Info */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-gray-200">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-blue-600 shrink-0">
                <Image
                  src={user?.avatar || "/assets/social-image-2.png"}
                  alt={user?.name || "Aisha Dahiru"}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="font-extrabold text-xs text-[#111111] leading-tight">
                  {user?.name || "Aisha Dahiru"}
                </div>
                <div className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                  DESK EDITOR
                </div>
              </div>
            </div>

            {/* Logout */}
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
        
        {/* LEFT ROUNDED SIDEBAR (Desk Editor Scope) */}
        <aside className="w-full md:w-60 lg:w-64 shrink-0 bg-white rounded-3xl p-3 border border-[#E5E6E8] shadow-2xs space-y-1">
          
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Desk Dashboard</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("reviewQueue")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "reviewQueue"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Inbox className="w-4 h-4 shrink-0" />
              <span>Review Queue</span>
            </div>
            {pendingSubmissions.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "reviewQueue" ? "bg-white text-blue-700" : "bg-amber-100 text-amber-800"
              }`}>
                {pendingSubmissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("dispatches")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "dispatches"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 shrink-0" />
              <span>Desk Stories</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "dispatches" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {articles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("desks")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "desks"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Layers className="w-4 h-4 shrink-0" />
              <span>Desk Taxonomy</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "desks" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              11
            </span>
          </button>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
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

        {/* RIGHT MAIN WORKSPACE */}
        <main className="flex-1 w-full space-y-6">

          {notification && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{notification}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Executive Welcome Card */}
              <div className="rounded-3xl bg-gradient-to-r from-[#0C1527] via-[#101F38] to-[#162B4D] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 z-10 max-w-xl">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/20">
                    <span>Beat: {user?.desk || "Business & Capital Markets"}</span>
                  </span>
                  
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome back, {user?.name ? user.name.split(" ")[0] : "Aisha"}
                  </h2>
                  
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Managing desk submissions and pitch verifications. You have {pendingSubmissions.length} articles waiting for editorial clearance today.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditingArticle(null);
                        setFormData({
                          title: "",
                          slug: "",
                          category: user?.desk?.split(" ")[0] || "Business",
                          coverImage: "/assets/hero-featured.jpg",
                          excerpt: "",
                          content: "",
                          authorName: user?.name || "Aisha Dahiru",
                          readTime: "4 min read",
                          isFeatured: false,
                          isTrending: false,
                          isEditorsPick: false,
                          isLatest: false,
                        });
                        setShowCreateModal(true);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <span>▶ Publish Desk Story</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("reviewQueue")}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer"
                    >
                      <span>Clear Review Queue ({pendingSubmissions.length}) →</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-6 shrink-0 z-10">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-white/10" fill="transparent" />
                      <circle
                        cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"
                        className="text-blue-500"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - 0.85)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl sm:text-2xl font-extrabold text-white">85%</span>
                      <span className="text-[9px] font-bold uppercase text-slate-300">Desk Goal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row of 4 Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#707070] tracking-wider block">Desk Stories</span>
                    <span className="text-lg font-extrabold text-[#111111]">{articles.length} Published</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#707070] tracking-wider block">Pitches in Queue</span>
                    <span className="text-lg font-extrabold text-[#111111]">{pendingSubmissions.length} Pending</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#707070] tracking-wider block">Approval Velocity</span>
                    <span className="text-lg font-extrabold text-[#111111]">92% Fast</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#707070] tracking-wider block">Assigned Beat</span>
                    <span className="text-sm font-extrabold text-[#111111] line-clamp-1">{user?.desk || "Business"}</span>
                  </div>
                </div>
              </div>

              {/* Review Queue preview */}
              <div className="bg-white rounded-3xl p-6 border border-[#E5E6E8] shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    Priority Pitch Verification Queue ({pendingSubmissions.length})
                  </h3>
                  <button onClick={() => setActiveTab("reviewQueue")} className="text-xs font-bold text-blue-600 hover:underline">
                    View All →
                  </button>
                </div>

                {pendingSubmissions.slice(0, 2).map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm">
                        {sub.category}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 mt-1">{sub.title}</h4>
                      <span className="text-[11px] text-gray-500">By {sub.authorName} • {sub.wordCount} words</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleRejectSubmission(sub.id, sub.title)}
                        className="px-3 py-1.5 border border-gray-300 hover:border-red-600 text-xs font-bold rounded-xl"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveSubmission(sub.id, sub.title)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-xl shadow-xs"
                      >
                        Approve & Publish
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: REVIEW QUEUE */}
          {activeTab === "reviewQueue" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E6E8]">
                <div>
                  <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                    Desk Pitch Manuscripts ({pendingSubmissions.length})
                  </h3>
                  <p className="text-xs text-[#707070]">
                    Review articles submitted by staff writers before publishing live to the public site.
                  </p>
                </div>
              </div>

              {pendingSubmissions.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E6E8] shadow-2xs">
                  <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-extrabold text-[#111111] text-sm">Review Queue Clear</h4>
                  <p className="text-xs text-[#707070] mt-1 max-w-sm mx-auto">
                    All contributing manuscripts have been approved or rejected.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingSubmissions.map((sub) => (
                    <div key={sub.id} className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-sm">
                            {sub.category}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-[#707070]">{sub.submittedAt}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-[#707070]">{sub.wordCount} words</span>
                        </div>

                        <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-amber-200">
                          Awaiting Clearance
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-[#111111]">{sub.title}</h4>
                      <p className="text-xs text-[#535252] leading-relaxed">{sub.excerpt}</p>

                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-700 max-h-40 overflow-y-auto">
                        <div className="font-bold text-gray-900 mb-1">Full Manuscript Preview:</div>
                        <div>{sub.content.replace(/<[^>]*>/g, " ")}</div>
                      </div>

                      <div className="pt-2 border-t border-[#E5E6E8] flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">Byline: {sub.authorName}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRejectSubmission(sub.id, sub.title)}
                            className="px-3.5 py-1.5 border border-[#DFDFDF] hover:border-red-600 hover:text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveSubmission(sub.id, sub.title)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                          >
                            Approve & Publish Live
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DESK DISPATCHES */}
          {activeTab === "dispatches" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E5E6E8] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search desk dispatches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-[#DFDFDF] rounded-xl focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingArticle(null);
                    setFormData({
                      title: "",
                      slug: "",
                      category: user?.desk?.split(" ")[0] || "Business",
                      coverImage: "/assets/hero-featured.jpg",
                      excerpt: "",
                      content: "",
                      authorName: user?.name || "Aisha Dahiru",
                      readTime: "4 min read",
                      isFeatured: false,
                      isTrending: false,
                      isEditorsPick: false,
                      isLatest: false,
                    });
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Compose Story</span>
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-3xl border border-[#E5E6E8] overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E6E8] bg-[#FAFAFA] text-[11px] font-extrabold uppercase text-[#707070] tracking-wider">
                        <th className="py-4 px-6">Story Dispatch</th>
                        <th className="py-4 px-6">Beat</th>
                        <th className="py-4 px-6">Byline</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E6E8] text-xs">
                      {filteredArticles.map((article) => (
                        <tr key={article.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3.5">
                              <div className="relative w-14 h-11 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                <Image src={article.coverImage} alt={article.title} fill sizes="56px" className="object-cover" />
                              </div>
                              <div className="max-w-md">
                                <Link href={`/article/${article.slug}`} className="font-bold text-[#111111] hover:text-blue-600 transition-colors line-clamp-1 block text-sm">
                                  {article.title}
                                </Link>
                                <span className="text-[11px] text-[#707070] line-clamp-1 mt-0.5">{article.excerpt}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-block bg-blue-50 text-blue-700 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-sm">
                              {article.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-[#111111]">{article.author.name}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleOpenEdit(article)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Story"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DESKS */}
          {activeTab === "desks" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((desk) => (
                <div key={desk.id} className="bg-white p-5 rounded-3xl border border-[#E5E6E8] shadow-2xs space-y-2 hover:border-blue-600 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#111111]">{desk.name}</span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-sm uppercase">
                      {desk.count} stories
                    </span>
                  </div>
                  <p className="text-xs text-[#707070] line-clamp-2">{desk.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: EDITOR SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl border border-[#E5E6E8] p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="pb-4 border-b border-[#E5E6E8]">
                <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                  Desk Editor Profile & Preferences
                </h3>
                <p className="text-xs text-[#707070] mt-1">
                  Manage your journalist byline, assigned beat, and editorial notification clearances.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Official Name</label>
                    <input type="text" defaultValue={user?.name || "Aisha Dahiru"} className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-blue-600 focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Official Email</label>
                    <input type="email" defaultValue={user?.email || "aisha.dahiru@thezango.org"} disabled className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Assigned Beat</label>
                    <input type="text" defaultValue={user?.desk || "Business & Capital Markets"} disabled className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed font-semibold" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Update Password</label>
                    <input type="password" placeholder="Enter new account passcode" className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-blue-600 focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Notifications</label>
                    <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-600" />
                      <span>Email alert whenever a correspondent pitches to my desk</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E6E8] flex justify-end">
                <button
                  type="button"
                  onClick={() => triggerToast("Editor profile settings updated successfully!")}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* STORY PUBLISHING MODAL (Same Pinned Header, Smooth Scrolling Body, and Pinned Footer) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E6E8] shrink-0 bg-white">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-5 bg-blue-600 rounded-xs inline-block" />
                <h3 className="text-base sm:text-lg font-extrabold text-[#000000] uppercase tracking-wide">
                  {editingArticle ? "Edit Desk Dispatch" : "Publish Desk Dispatch"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingArticle(null);
                }}
                className="text-gray-400 hover:text-black p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="editor-dispatch-form" onSubmit={handleCreateSubmit} className="overflow-y-auto flex-1 p-6 space-y-5 text-xs overscroll-contain">
              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Northern Agritech Deal Flows Reach New Highs"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-blue-600 text-sm focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Beat / Desk</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-blue-600 text-xs focus:outline-hidden bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Author Byline</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-blue-600 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Read Time</label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-blue-600 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <ImageUploader
                label="Story Cover Image (Upload from device or select editorial stock)"
                value={formData.coverImage}
                onChange={(url) => setFormData({ ...formData, coverImage: url })}
              />

              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Lead Excerpt</label>
                <textarea
                  rows={2}
                  placeholder="Summary for front page and search snippets..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DFDFDF] focus:border-blue-600 text-xs focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#000000] uppercase mb-2">Manuscript Body (WYSIWYG Rich Editor) *</label>
                <RichEditor
                  value={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Draft full article content with tables, quotes, and embeds..."
                  height={340}
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-[#E5E6E8] shrink-0 bg-[#F8F9FA] flex items-center justify-between">
              <span className="text-[11px] text-[#707070]">Desk Editor Publishing Clearance</span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingArticle(null);
                  }}
                  className="px-4 py-2 border border-[#DFDFDF] hover:border-black rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="editor-dispatch-form"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                >
                  {editingArticle ? "Save Changes" : "Publish Dispatch"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function EditorDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-8 text-sm text-[#707070]">
          Loading Desk Editor Portal...
        </div>
      }
    >
      <EditorDashboardContent />
    </Suspense>
  );
}

