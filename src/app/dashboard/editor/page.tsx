"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3,
  CheckCircle2, 
  ExternalLink,
  Search, 
  Layers, 
  Inbox, 
  X, 
  LayoutDashboard,
  Bell, 
  LogOut,
  Send,
  KeyRound,
  Menu,
  Star,
  TrendingUp,
  Sliders
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Article, Submission, Category } from "@/types";
import { 
  getArticles, 
  createArticle, 
  updateArticle, 
  deleteArticle,
  toggleArticleFlag, 
  getSubmissions, 
  approveSubmission, 
  rejectSubmission,
  requestRevisionSubmission
} from "@/lib/firebase/db";
import { CATEGORIES } from "@/data/mock-articles";
import ImageUploader from "@/components/image-uploader";
import RichEditor from "@/components/rich-editor";

function EditorDashboardContent() {
  const router = useRouter();
  const { user, logout, updateUser, isAuthenticated, isLoading } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [desksList, setDesksList] = useState<Category[]>(CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"overview" | "reviewQueue" | "dispatches" | "desks" | "settings">("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [revisionModalSub, setRevisionModalSub] = useState<Submission | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Editor Profile Settings state (using derived state with override to eliminate cascading renders)
  const [profileNameOverride, setProfileNameOverride] = useState<string | null>(null);
  const [profileAvatarOverride, setProfileAvatarOverride] = useState<string | null>(null);
  const [profileBioOverride, setProfileBioOverride] = useState<string | null>(null);
  const [profileDeskOverride, setProfileDeskOverride] = useState<string | null>(null);

  const profileName = profileNameOverride ?? (user?.name || "Aisha Dahiru");
  const profileAvatar = profileAvatarOverride ?? (user?.avatar || "/assets/social-image-2.png");
  const profileBio = profileBioOverride ?? (user?.bio || "Senior Markets Editor analyzing private equity, agribusiness finance, and trade dynamics across Northern Nigeria.");
  const profileDesk = profileDeskOverride ?? (user?.desk || "Business & Capital Markets");

  const setProfileName = (val: string) => setProfileNameOverride(val);
  const setProfileAvatar = (val: string) => setProfileAvatarOverride(val);
  const setProfileBio = (val: string) => setProfileBioOverride(val);
  const setProfileDesk = (val: string) => setProfileDeskOverride(val);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Business",
    coverImage: "/assets/hero-featured.jpg",
    excerpt: "",
    content: "",
    tags: [] as string[],
    authorName: "Aisha Dahiru",
    readTime: "4 min read",
    isFeatured: false,
    isTrending: false,
    isEditorsPick: false,
    isLatest: false,
    isBreaking: false,
    scheduledAt: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending" | "needs_revision" | "approved">("all");

  const formatSubmittedDate = (dateStr: string) => {
    if (!dateStr) return "Recently";
    const parsed = Date.parse(dateStr);
    if (isNaN(parsed)) return dateStr;
    return new Date(parsed).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const resetFormData = (categoryOverride?: string) => {
    setFormData({
      title: "",
      slug: "",
      category: categoryOverride || user?.desk?.split(" ")[0] || "Business",
      coverImage: "/assets/hero-featured.jpg",
      excerpt: "",
      content: "",
      tags: [],
      authorName: user?.name || "Aisha Dahiru",
      readTime: "4 min read",
      isFeatured: false,
      isTrending: false,
      isEditorsPick: false,
      isLatest: false,
      isBreaking: false,
      scheduledAt: "",
    });
    setTagInput("");
    setSlugAvailability(null);
  };

  // Slug Availability State
  const [slugAvailability, setSlugAvailability] = useState<{
    available?: boolean;
    message?: string;
    suggestedSlug?: string;
    checking?: boolean;
  } | null>(null);

  // Gatekeeping: require authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard/editor");
    }
  }, [isAuthenticated, isLoading, router]);

  // Load editor data from API routes with local database fallback
  const loadData = async () => {
    try {
      const [artsRes, subsRes, desksRes] = await Promise.all([
        fetch("/api/editor/articles").then((r) => r.json()).catch(() => null),
        fetch("/api/editor/submissions").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/desks").then((r) => r.json()).catch(() => null),
      ]);

      if (desksRes?.success && desksRes.desks) {
        setDesksList(desksRes.desks);
      }

      if (artsRes?.success && artsRes.articles) {
        setArticles(artsRes.articles);
      } else {
        const arts = await getArticles();
        setArticles([...arts]);
      }

      if (subsRes?.success && subsRes.submissions) {
        setSubmissions(subsRes.submissions);
      } else {
        const subsQueue = await getSubmissions();
        setSubmissions([...subsQueue]);
      }
    } catch (e) {
      console.error("Editor loadData error, falling back to local db:", e);
      const arts = await getArticles();
      const subsQueue = await getSubmissions();
      setArticles([...arts]);
      setSubmissions([...subsQueue]);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchEditorData = async () => {
      await loadData();
    };
    if (active) {
      void fetchEditorData();
    }
    return () => {
      active = false;
    };
  }, []);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Real-time Slug Availability Checker
  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck.trim()) {
      setSlugAvailability(null);
      return;
    }
    setSlugAvailability({ checking: true });
    try {
      const url = `/api/admin/articles/check-slug?slug=${encodeURIComponent(slugToCheck.trim())}${
        editingArticle ? `&excludeId=${editingArticle.id}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      setSlugAvailability({
        checking: false,
        available: data.available,
        message: data.message,
        suggestedSlug: data.suggestedSlug,
      });
    } catch {
      setSlugAvailability(null);
    }
  };

  const handleToggleFlag = async (id: string, flag: "isFeatured" | "isTrending" | "isEditorsPick" | "isLatest") => {
    try {
      const res = await fetch(`/api/editor/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleFlag", flag }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        triggerToast(`Updated placement status for "${data.article.title.slice(0, 25)}..."`);
        return;
      }
    } catch (e) {
      console.error("API toggle flag error:", e);
    }
    const updated = await toggleArticleFlag(id, flag);
    if (updated) {
      await loadData();
      triggerToast(`Updated placement status for "${updated.title.slice(0, 25)}..."`);
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (confirm(`Remove dispatch "${title}" from the editorial index?`)) {
      try {
        const res = await fetch(`/api/editor/articles/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          await loadData();
          triggerToast(`Removed dispatch: "${title.slice(0, 25)}..."`);
          return;
        }
      } catch (e) {
        console.error("API delete article error:", e);
      }
      const success = await deleteArticle(id);
      if (success) {
        await loadData();
        triggerToast(`Removed dispatch: "${title.slice(0, 25)}..."`);
      }
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
      tags: article.tags || [],
      authorName: article.author.name,
      readTime: article.readTime,
      isFeatured: !!article.isFeatured,
      isTrending: !!article.isTrending,
      isEditorsPick: !!article.isEditorsPick,
      isLatest: !!article.isLatest,
      isBreaking: !!article.isBreaking,
      scheduledAt: article.scheduledAt || "",
    });
    setSlugAvailability(null);
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

    const articlePayload = {
      title: formData.title.trim(),
      slug,
      category: formData.category,
      coverImage: formData.coverImage || "/assets/hero-featured.jpg",
      excerpt: formData.excerpt?.trim() || "Editorial dispatch from The Zango Bureau...",
      content: formData.content || formData.title,
      tags: formData.tags,
      readTime: formData.readTime || "4 min read",
      isFeatured: formData.isFeatured,
      isTrending: formData.isTrending,
      isEditorsPick: formData.isEditorsPick,
      isLatest: formData.isLatest,
      isBreaking: formData.isBreaking,
      scheduledAt: formData.scheduledAt || undefined,
      author: {
        id: "author-editor",
        name: profileName,
        slug: profileName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        role: "Senior Desk Editor",
        avatar: profileAvatar,
      },
    };

    if (editingArticle) {
      try {
        const res = await fetch(`/api/editor/articles/${editingArticle.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articlePayload),
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Updated dispatch: "${formData.title.slice(0, 30)}..."`);
          await loadData();
          setShowCreateModal(false);
          setEditingArticle(null);
          return;
        }
      } catch (err) {
        console.error("API update error, falling back:", err);
      }
      await updateArticle(editingArticle.id, articlePayload);
      triggerToast(`Updated dispatch: "${formData.title.slice(0, 30)}..."`);
    } else {
      try {
        const res = await fetch("/api/editor/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articlePayload),
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Published desk dispatch: "${formData.title.slice(0, 30)}..."`);
          await loadData();
          setShowCreateModal(false);
          setEditingArticle(null);
          return;
        }
      } catch (err) {
        console.error("API create error, falling back:", err);
      }
      await createArticle({
        ...articlePayload,
        publishedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        views: 0,
      });
      triggerToast(`Published desk dispatch: "${formData.title.slice(0, 30)}..."`);
    }

    await loadData();
    setShowCreateModal(false);
    setEditingArticle(null);
  };

  const handleApproveSubmission = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/editor/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        triggerToast(`Approved & published dispatch: "${title.slice(0, 30)}..."`);
        return;
      }
    } catch (e) {
      console.error("API approve error, falling back to local handler:", e);
    }
    const published = await approveSubmission(id);
    if (published) {
      await loadData();
      triggerToast(`Approved & published dispatch: "${title.slice(0, 30)}..."`);
    }
  };

  const handleRejectSubmission = async (id: string, title: string) => {
    if (confirm(`Reject manuscript "${title}"?`)) {
      try {
        const res = await fetch(`/api/editor/submissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject" }),
        });
        const data = await res.json();
        if (data.success) {
          await loadData();
          triggerToast(`Rejected submission: "${title.slice(0, 30)}..."`);
          return;
        }
      } catch (e) {
        console.error("API reject error, falling back:", e);
      }
      await rejectSubmission(id);
      await loadData();
      triggerToast(`Rejected submission: "${title.slice(0, 30)}..."`);
    }
  };

  const handleOpenEditSubmission = (sub: Submission) => {
    setEditingArticle(null);
    setFormData({
      title: sub.title,
      slug: sub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      category: sub.category,
      coverImage: sub.coverImage || "/assets/hero-featured.jpg",
      excerpt: sub.excerpt,
      content: sub.content,
      tags: sub.tags || [],
      authorName: sub.authorName,
      readTime: sub.readTime,
      isFeatured: !!sub.isFeatured,
      isTrending: false,
      isEditorsPick: false,
      isLatest: true,
      isBreaking: !!sub.isBreaking,
      scheduledAt: sub.scheduledAt || "",
    });
    setSlugAvailability(null);
    setShowCreateModal(true);
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalSub || !revisionNotes.trim()) return;
    try {
      const res = await fetch(`/api/editor/submissions/${revisionModalSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revision", feedbackNotes: revisionNotes.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setRevisionModalSub(null);
        setRevisionNotes("");
        triggerToast("Revision notes delivered to writer successfully!");
        return;
      }
    } catch (e) {
      console.error("API revision error, falling back:", e);
    }
    await requestRevisionSubmission(revisionModalSub.id, revisionNotes.trim());
    await loadData();
    setRevisionModalSub(null);
    setRevisionNotes("");
    triggerToast("Revision notes sent back to writer successfully!");
  };

  const handleSaveProfile = () => {
    updateUser({
      name: profileName,
      avatar: profileAvatar,
      bio: profileBio,
      desk: profileDesk,
    });
    triggerToast("Desk Editor profile, avatar, and byline saved successfully!");
  };

  const pendingSubmissions = submissions.filter((s) => s.status === "pending" || s.status === "needs_revision");
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs h-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Brand Logo & Search */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toggle Sidebar Navigation"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative w-32 sm:w-36 h-9">
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

            <div className="hidden md:flex items-center relative w-64 lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Jump to desk story..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 py-2 rounded-xl border border-slate-200 focus:border-blue-600 text-xs focus:outline-hidden bg-slate-50 focus:bg-white transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-sm">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Beat/Clearance Badge */}
            <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Desk Clearance Active</span>
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => setActiveTab("reviewQueue")}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Review Queue Notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingSubmissions.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1 flex flex-col md:flex-row items-start gap-6">
        
        {/* LEFT MODERN STICKY SIDEBAR (Desk Editor Scope) */}
        <aside
          className={`w-full md:w-64 lg:w-72 shrink-0 bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col justify-between md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] overflow-y-auto space-y-4 transition-all ${
            mobileSidebarOpen ? "block" : "hidden md:flex"
          }`}
        >
          <div className="space-y-4">
            
            {/* Beat Clearance Status Pill */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold text-blue-950 truncate">
                    {user?.desk || "Business & Capital Markets"}
                  </div>
                  <div className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider">
                    Assigned Editorial Beat
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
                Desk
              </span>
            </div>

            {/* Quick Action Button: New Dispatch */}
            <button
              onClick={() => {
                setEditingArticle(null);
                resetFormData();
                setShowCreateModal(true);
              }}
              className="w-full px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Desk Dispatch</span>
            </button>

            {/* Group 1: CORE EDITORIAL WORKSPACE */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Editorial Workspace
              </span>

              {/* Sidebar Item 1: Overview */}
              <button
                onClick={() => {
                  setActiveTab("overview");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Desk Dashboard</span>
                </div>
              </button>

              {/* Sidebar Item 2: Review Queue */}
              <button
                onClick={() => {
                  setActiveTab("reviewQueue");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "reviewQueue"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Inbox className="w-4 h-4 shrink-0" />
                  <span>Review Queue</span>
                </div>
                {pendingSubmissions.length > 0 ? (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      activeTab === "reviewQueue"
                        ? "bg-white text-blue-600"
                        : "bg-amber-100 text-amber-900 border border-amber-200"
                    }`}
                  >
                    {pendingSubmissions.length}
                  </span>
                ) : (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeTab === "reviewQueue" ? "bg-white/20 text-white" : "text-slate-400"
                    }`}
                  >
                    0
                  </span>
                )}
              </button>

              {/* Sidebar Item 3: Desk Stories */}
              <button
                onClick={() => {
                  setActiveTab("dispatches");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "dispatches"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Desk Stories</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "dispatches" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {articles.length}
                </span>
              </button>
            </div>

            {/* Group 2: DESK TAXONOMY */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Beats & Taxonomy
              </span>

              <button
                onClick={() => {
                  setActiveTab("desks");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "desks"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Desk Taxonomy</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "desks" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {desksList.length}
                </span>
              </button>
            </div>

            {/* Group 3: PREFERENCES */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Desk Configuration
              </span>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Account & Byline</span>
                </div>
              </button>
            </div>

          </div>

          {/* PINNED BOTTOM: Modern User Profile Card & Signout Positioning */}
          <div className="pt-3 border-t border-slate-100 mt-auto space-y-2">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-blue-600 shrink-0 shadow-xs">
                    <Image
                      src={profileAvatar || user?.avatar || "/assets/social-image-2.png"}
                      alt={profileName || user?.name || "Aisha Dahiru"}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-slate-900 truncate">
                      {profileName || user?.name || "Aisha Dahiru"}
                    </div>
                    <div className="text-[10px] font-bold text-blue-600 tracking-wider truncate uppercase">
                      Senior Desk Editor
                    </div>
                  </div>
                </div>

                {/* Prominently positioned Sign Out button */}
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Sign Out of Editor Portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </aside>

        {/* RIGHT MAIN WORKSPACE */}
        <main className="flex-1 w-full space-y-6">

          {/* Smooth Notification Toast */}
          {notification && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{notification}</span>
              </div>
              <button 
                type="button"
                onClick={() => setNotification(null)} 
                className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Executive Welcome Card */}
              <div className="rounded-3xl bg-gradient-to-br from-[#0C1527] via-[#101F38] to-[#162B4D] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 z-10 max-w-xl">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Beat: {user?.desk || "Business & Capital Markets"}</span>
                  </span>
                  
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome back, {user?.name ? user.name.split(" ")[0] : "Aisha"}
                  </h2>
                  
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Managing desk submissions and pitch verifications across Sahel and Northern Nigerian beats. You have {pendingSubmissions.length} manuscript{pendingSubmissions.length !== 1 ? "s" : ""} waiting for editorial clearance today.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingArticle(null);
                        resetFormData();
                        setShowCreateModal(true);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ New Desk Dispatch</span>
                    </button>

                    <button
                      type="button"
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
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Desk Stories</span>
                    <span className="text-lg font-extrabold text-slate-900">{articles.length} Published</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Pitches in Queue</span>
                    <span className="text-lg font-extrabold text-slate-900">{pendingSubmissions.length} Pending</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Approval Velocity</span>
                    <span className="text-lg font-extrabold text-slate-900">92% Fast</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Assigned Beat</span>
                    <span className="text-sm font-extrabold text-slate-900 line-clamp-1">{user?.desk || "Business"}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Manuscripts Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Submissions Queue */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Pitches Awaiting Clearance</h3>
                      <p className="text-xs text-slate-500">Correspondent submissions from Kano, Kaduna, and Abuja bureaus</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("reviewQueue")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View All ({pendingSubmissions.length}) →
                    </button>
                  </div>

                  {pendingSubmissions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      All writer manuscripts have been cleared or published!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {pendingSubmissions.slice(0, 4).map((sub) => (
                        <div key={sub.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
                              {sub.category}
                            </span>
                            <h4 className="font-bold text-xs text-slate-900 truncate">{sub.title}</h4>
                            <p className="text-[11px] text-slate-500">By {sub.authorName} • {sub.readTime}</p>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApproveSubmission(sub.id, sub.title)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRevisionModalSub(sub);
                                setRevisionNotes(sub.feedbackNotes || "");
                              }}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Feedback
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desk Editorial Checklist */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-sm">Editorial Standards</h3>
                    <p className="text-xs text-slate-500">Verification protocols for published copy</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800">Two-Source Verification</span>
                        <p className="text-[11px] text-slate-500">Ensure financial quotes have primary attribution.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800">Sahelian Context</span>
                        <p className="text-[11px] text-slate-500">Connect regional trade data to cross-border impacts.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800">Editorial Independence</span>
                        <p className="text-[11px] text-slate-500">Confirm zero commercial conflict of interest.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-xs text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>The Zango Editorial Verification Protocol</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: REVIEW QUEUE */}
          {activeTab === "reviewQueue" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Editorial Pitch Review Queue</h3>
                  <p className="text-xs text-slate-500">Review pitches and draft submissions from staff writers</p>
                </div>
                
                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setReviewFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === "all"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({submissions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter("pending")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === "pending"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Pending ({submissions.filter((s) => s.status === "pending").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter("needs_revision")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === "needs_revision"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    In Revision ({submissions.filter((s) => s.status === "needs_revision").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter("approved")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === "approved"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Approved ({submissions.filter((s) => s.status === "approved").length})
                  </button>
                </div>
              </div>

              {submissions.filter((s) => {
                if (reviewFilter === "all") return true;
                if (reviewFilter === "pending") return s.status === "pending";
                if (reviewFilter === "needs_revision") return s.status === "needs_revision";
                if (reviewFilter === "approved") return s.status === "approved";
                return true;
              }).length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-2xs space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {reviewFilter === "all" ? "Review Queue is Empty" : `No ${reviewFilter.replace("_", " ")} submissions`}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Incoming manuscript drafts from newsroom contributors will appear here for verification and editorial clearance.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.filter((s) => {
                    if (reviewFilter === "all") return true;
                    if (reviewFilter === "pending") return s.status === "pending";
                    if (reviewFilter === "needs_revision") return s.status === "needs_revision";
                    if (reviewFilter === "approved") return s.status === "approved";
                    return true;
                  }).map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4 transition-all hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700">
                            {sub.category}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Submitted: {formatSubmittedDate(sub.submittedAt)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {sub.wordCount || 0} words • {sub.readTime}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            sub.status === "needs_revision"
                              ? "bg-amber-100 text-amber-900"
                              : sub.status === "approved"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {sub.status === "needs_revision"
                            ? "Needs Revision"
                            : sub.status === "approved"
                            ? "Approved & Published"
                            : "Pending Review"}
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-slate-900">{sub.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{sub.excerpt}</p>

                      {/* Tag Chips */}
                      {sub.tags && sub.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {sub.tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {sub.feedbackNotes && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                          <span className="font-extrabold uppercase text-[10px] tracking-wider text-amber-800 block">
                            Revision Feedback Sent to Writer:
                          </span>
                          <p className="italic">{sub.feedbackNotes}</p>
                        </div>
                      )}

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 max-h-40 overflow-y-auto">
                        <div className="font-bold text-slate-900 mb-1">Full Manuscript Preview:</div>
                        <div>{sub.content.replace(/<[^>]*>/g, " ")}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-900">Byline: {sub.authorName}</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSubmission(sub)}
                            className="px-3 py-1.5 border border-slate-200 hover:border-black text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 bg-white shadow-2xs"
                            title="Edit manuscript copy before publishing"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Preview & Edit Copy</span>
                          </button>

                          {sub.status !== "approved" && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setRevisionModalSub(sub);
                                  setRevisionNotes(sub.feedbackNotes || "");
                                }}
                                className="px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                                title="Send editorial revision notes back to writer"
                              >
                                <Send className="w-3.5 h-3.5 text-amber-700" />
                                <span>Request Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectSubmission(sub.id, sub.title)}
                                className="px-3 py-1.5 border border-slate-200 hover:border-red-600 hover:text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApproveSubmission(sub.id, sub.title)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                              >
                                Approve & Publish Live
                              </button>
                            </>
                          )}

                          {sub.status === "approved" && (
                            <Link
                              href={`/article/${sub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                              target="_blank"
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm inline-flex items-center space-x-1.5"
                            >
                              <span>View Published Story</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
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
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search desk dispatches..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden bg-white cursor-pointer"
                  >
                    <option value="all">All Beats</option>
                    {desksList.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingArticle(null);
                    resetFormData();
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Compose Story</span>
                </button>
              </div>

              {/* Table of Dispatches */}
              <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="py-4 px-6">Story Dispatch</th>
                        <th className="py-4 px-4">Beat</th>
                        <th className="py-4 px-4">Byline</th>
                        <th className="py-4 px-4">Placements</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredArticles.map((article) => (
                        <tr key={article.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3.5">
                              <div className="relative w-14 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                                <Image src={article.coverImage} alt={article.title} fill sizes="56px" className="object-cover" />
                              </div>
                              <div className="max-w-md">
                                <Link href={`/article/${article.slug}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 block text-sm">
                                  {article.title}
                                </Link>
                                <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{article.excerpt}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-block bg-blue-50 text-blue-700 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                              {article.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800">{article.author.name}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleFlag(article.id, "isFeatured")}
                                className={`p-1 rounded-md transition-colors ${
                                  article.isFeatured ? "bg-amber-100 text-amber-700" : "text-slate-300 hover:text-slate-600"
                                }`}
                                title="Toggle Featured"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleFlag(article.id, "isTrending")}
                                className={`p-1 rounded-md transition-colors ${
                                  article.isTrending ? "bg-red-100 text-red-700" : "text-slate-300 hover:text-slate-600"
                                }`}
                                title="Toggle Trending"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleFlag(article.id, "isEditorsPick")}
                                className={`p-1 rounded-md transition-colors ${
                                  article.isEditorsPick ? "bg-purple-100 text-purple-700" : "text-slate-300 hover:text-slate-600"
                                }`}
                                title="Toggle Editor's Pick"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                href={`/article/${article.slug}`}
                                target="_blank"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="View Live"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(article)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Story"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteArticle(article.id, article.title)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Dispatch"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DESKS TAXONOMY */}
          {activeTab === "desks" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
              {desksList.map((desk) => (
                <div key={desk.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      Regional Desk
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {articles.filter((a) => a.category.toLowerCase() === desk.name.toLowerCase()).length} Dispatches
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">{desk.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sahelian investigative reporting and newsroom beats across Northern Nigeria.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(desk.name);
                        setActiveTab("dispatches");
                      }}
                      className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Filter Desk Dispatches →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: ACCOUNT & BYLINE SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6 max-w-3xl animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Desk Editor Profile & Editorial Signature</h3>
                <p className="text-xs text-slate-500">Configure your verified byline credentials and beat assignments</p>
              </div>

              <div className="space-y-4">
                <ImageUploader
                  label="Official Editorial Portrait (High-res photo for story bylines)"
                  value={profileAvatar}
                  onChange={(url) => setProfileAvatar(url)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Official Byline Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Assigned Desk Beat</label>
                    <input
                      type="text"
                      value={profileDesk}
                      onChange={(e) => setProfileDesk(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Journalist Biography (Shown to Readers)</label>
                  <textarea
                    rows={3}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Brief background on financial, markets, or investigative coverage..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-600 text-xs focus:outline-hidden resize-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This biography and photo will appear under &ldquo;About the Author&rdquo; on all articles you publish.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* STORY PUBLISHING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-white">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-5 bg-blue-600 rounded-xs inline-block" />
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-wide">
                  {editingArticle ? "Edit Desk Dispatch" : "Publish Desk Dispatch"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingArticle(null);
                }}
                className="text-slate-400 hover:text-black p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="editor-dispatch-form" onSubmit={handleCreateSubmit} className="overflow-y-auto flex-1 p-6 space-y-5 text-xs overscroll-contain">
              <div>
                <label className="block font-bold text-slate-900 uppercase mb-1.5">Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Northern Agritech Deal Flows Reach New Highs"
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const autoSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setFormData({ ...formData, title: newTitle, slug: autoSlug });
                    checkSlugAvailability(autoSlug);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 text-sm focus:outline-hidden"
                />
              </div>

              {/* Slug checker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-900 uppercase">Custom Permalink Slug *</label>
                  {slugAvailability && (
                    <div className="flex items-center space-x-2 text-[11px]">
                      {slugAvailability.checking ? (
                        <span className="text-slate-400">Checking availability...</span>
                      ) : slugAvailability.available ? (
                        <span className="text-emerald-600 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Slug available</span>
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold flex items-center space-x-1">
                          <span>{slugAvailability.message}</span>
                        </span>
                      )}
                      {slugAvailability.suggestedSlug && (
                        <button
                          type="button"
                          onClick={() => {
                            const sug = slugAvailability.suggestedSlug!;
                            setFormData((prev) => ({ ...prev, slug: sug }));
                            checkSlugAvailability(sug);
                          }}
                          className="text-[10px] text-blue-600 hover:underline font-bold"
                        >
                          Use &ldquo;{slugAvailability.suggestedSlug}&rdquo;
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-blue-600">
                  <span className="px-3 text-slate-400 text-xs font-mono select-none bg-slate-50 border-r border-slate-200 py-2">
                    thezango.org/article/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => {
                      const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "");
                      setFormData({ ...formData, slug: newSlug });
                      checkSlugAvailability(newSlug);
                    }}
                    className="w-full px-3 py-2 text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-900 uppercase mb-1.5">Beat / Desk</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 text-xs focus:outline-hidden bg-white cursor-pointer"
                  >
                    {desksList.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 uppercase mb-1.5">Author Byline</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 uppercase mb-1.5">Read Time</label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <ImageUploader
                label="Story Cover Image (Upload from device or select editorial stock)"
                value={formData.coverImage}
                onChange={(url) => setFormData({ ...formData, coverImage: url })}
              />

              <div>
                <label className="block font-bold text-slate-900 uppercase mb-1.5">Lead Excerpt</label>
                <textarea
                  rows={2}
                  placeholder="Summary for front page and search snippets..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-600 text-xs focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 uppercase mb-2">Manuscript Body (WYSIWYG Rich Editor) *</label>
                <RichEditor
                  value={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Draft full article content with tables, quotes, and embeds..."
                  height={340}
                />
              </div>

              {/* Story Tags & Keywords */}
              <div>
                <label className="block font-bold text-slate-900 uppercase mb-1.5">Story Tags & Keywords</label>
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl border border-slate-200 bg-white focus-within:border-blue-600 transition-colors">
                  {formData.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-100"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
                        }
                        className="text-blue-600 hover:text-red-600 ml-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add tag and press Enter or comma..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const val = tagInput.trim().replace(/^#/, "");
                        if (val && !formData.tags.includes(val)) {
                          setFormData({ ...formData, tags: [...formData.tags, val] });
                        }
                        setTagInput("");
                      }
                    }}
                    className="flex-1 min-w-[140px] text-xs focus:outline-hidden bg-transparent"
                  />
                </div>
              </div>

              {/* Placement Flags & Editorial Overrides */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <span className="block font-bold text-slate-900 uppercase mb-2">Homepage & Portal Placement</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Featured Hero</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isTrending}
                      onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Trending Reel</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isEditorsPick}
                      onChange={(e) => setFormData({ ...formData, isEditorsPick: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Editor&apos;s Pick</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isLatest}
                      onChange={(e) => setFormData({ ...formData, isLatest: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Latest Ticker</span>
                  </label>
                </div>

                {/* Breaking News Dispatch Banner Toggle */}
                <label className="flex items-center space-x-3 p-3 rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isBreaking}
                    onChange={(e) => setFormData({ ...formData, isBreaking: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded-sm border-red-300 focus:ring-red-500"
                  />
                  <div className="text-xs">
                    <span className="font-extrabold text-red-900 block flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse inline-block" />
                      <span>Breaking News Dispatch</span>
                    </span>
                    <span className="text-[11px] text-red-700">Display in top broadcast ticker banner across the site</span>
                  </div>
                </label>
              </div>

            </form>

            <div className="px-6 py-4 border-t border-slate-200 shrink-0 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Desk Editor Publishing Clearance</span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingArticle(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:border-black rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer bg-white"
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

      {/* Request Editorial Revision Modal */}
      {revisionModalSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-5 bg-amber-500 rounded-xs inline-block" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                  Request Editorial Revision
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRevisionModalSub(null)}
                className="text-slate-400 hover:text-black p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Manuscript Pitch:</span>
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{revisionModalSub.title}</p>
              <div className="text-[11px] text-slate-500">
                Author: <span className="font-semibold text-black">{revisionModalSub.authorName}</span> ({revisionModalSub.authorEmail || "Correspondent"})
              </div>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Editorial Feedback & Change Instructions *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain what the writer needs to improve (e.g. 'Please verify source citations and include quotes')..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 text-xs focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalSub(null)}
                  className="px-4 py-2 border border-slate-200 hover:border-black rounded-xl text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Writer</span>
                </button>
              </div>
            </form>
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
