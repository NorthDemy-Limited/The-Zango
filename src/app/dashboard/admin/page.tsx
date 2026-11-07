"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  FileText, 
  Users, 
  Plus, 
  Trash2, 
  Edit3,
  Star, 
  TrendingUp, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  ShieldCheck, 
  Search, 
  Sparkles, 
  ArrowLeft, 
  Flame, 
  Clock, 
  Layers, 
  Inbox, 
  Check, 
  X, 
  Eye, 
  Filter, 
  RefreshCw, 
  UserCheck, 
  UserPlus, 
  ShieldAlert, 
  KeyRound,
  LayoutDashboard,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Send,
  Lock,
  Tag,
  Mail
} from "lucide-react";
import { useAuth, UserRole } from "@/context/auth-context";
import { Article, Subscriber, Submission, NewsroomMember, NewsroomRole } from "@/types";
import { 
  getArticles, 
  createArticle, 
  updateArticle, 
  toggleArticleFlag, 
  deleteArticle, 
  getSubscribers, 
  getTeamMembers, 
  createTeamMember, 
  updateTeamMemberRole, 
  updateTeamMemberStatus, 
  deleteTeamMember, 
  getPlatformMetrics, 
  getSubmissions, 
  approveSubmission, 
  rejectSubmission 
} from "@/lib/firebase/db";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { CATEGORIES } from "@/data/mock-articles";
import ImageUploader from "@/components/image-uploader";
import RichEditor from "@/components/rich-editor";

function AdminDashboardContent() {
  const router = useRouter();
  const { user, role, logout, switchRole, isAuthenticated, isLoading } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [metrics, setMetrics] = useState({
    totalArticles: 0,
    totalViews: 0,
    totalSubscribers: 0,
    draftCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"overview" | "dispatches" | "reviewQueue" | "team" | "desks" | "subscribers" | "settings">("overview");
  const [teamFilter, setTeamFilter] = useState<"all" | "admin" | "editor" | "writer">("all");
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<NewsroomMember[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    email: "",
    role: "writer" as NewsroomRole,
    desk: "Technology & Digital Economy",
    avatar: "/assets/social-image-1.png",
    bio: "",
    status: "active" as "active" | "inactive",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New/Edit Article Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Business",
    coverImage: "/assets/hero-featured.jpg",
    excerpt: "",
    content: "",
    authorName: "The Zango Bureau",
    readTime: "4 min read",
    isFeatured: false,
    isTrending: false,
    isEditorsPick: false,
    isLatest: false,
  });

  // Gatekeeping redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard/admin");
    }
  }, [isAuthenticated, isLoading, router]);

  const loadData = async () => {
    const arts = await getArticles();
    const subs = await getSubscribers();
    const subsQueue = await getSubmissions();
    const mets = await getPlatformMetrics();
    const members = await getTeamMembers();
    setTeamMembers([...members]);

    setArticles([...arts]);
    setSubscribers([...subs]);
    setSubmissions([...subsQueue]);
    setMetrics({
      totalArticles: mets.totalArticles,
      totalViews: mets.totalViews,
      totalSubscribers: mets.totalSubscribers,
      draftCount: mets.draftCount,
    });
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
      triggerToast(`Updated ${flag} status for "${updated.title.slice(0, 25)}..."`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteArticle(id);
      await loadData();
      triggerToast(`Story "${title.slice(0, 25)}..." deleted.`);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name.trim() || !newMemberForm.email.trim()) return;
    await createTeamMember(newMemberForm);
    await loadData();
    setShowTeamModal(false);
    setNewMemberForm({
      name: "",
      email: "",
      role: "writer",
      desk: "Technology & Digital Economy",
      avatar: "/assets/social-image-1.png",
      bio: "",
      status: "active",
    });
    triggerToast("Staff member added to newsroom roster!");
  };

  const handleUpdateRole = async (id: string, targetRole: NewsroomRole, name: string) => {
    await updateTeamMemberRole(id, targetRole);
    await loadData();
    triggerToast("Updated role for " + name + " to " + targetRole.toUpperCase());
  };

  const handleToggleMemberStatus = async (id: string, currentStatus: "active" | "inactive", name: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    await updateTeamMemberStatus(id, nextStatus);
    await loadData();
    triggerToast(name + " status updated to " + nextStatus);
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (confirm("Are you sure you want to remove " + name + " from newsroom staff?")) {
      await deleteTeamMember(id);
      await loadData();
      triggerToast("Removed " + name + " from newsroom roster.");
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
          id: "author-bureau",
          name: formData.authorName,
          slug: formData.authorName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          role: "Verified Bureau Correspondent",
          avatar: "/assets/social-image-1.png",
        },
      });
      triggerToast(`Published new dispatch: "${formData.title.slice(0, 30)}..."`);
    }

    await loadData();
    setShowCreateModal(false);
    setEditingArticle(null);
  };

  const handleApproveSubmission = async (id: string, title: string) => {
    const published = await approveSubmission(id);
    if (published) {
      await loadData();
      triggerToast(`Approved and published: "${title.slice(0, 30)}..."`);
    }
  };

  const handleRejectSubmission = async (id: string, title: string) => {
    if (confirm(`Reject submission "${title}"?`)) {
      await rejectSubmission(id);
      await loadData();
      triggerToast(`Rejected submission: "${title.slice(0, 30)}..."`);
    }
  };

  const exportSubscribersCSV = () => {
    if (subscribers.length === 0) {
      alert("No subscribers found to export.");
      return;
    }
    const headers = "Email,SubscribedAt\n";
    const rows = subscribers.map((s) => `"${s.email}","${s.subscribedAt}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `thezango-subscribers-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || a.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const leadFeaturedArticle = articles.find((a) => a.isFeatured) || articles[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      
      {/* 1. TOP NAVBAR (Matching the template) */}
      <header className="bg-white border-b border-[#E5E6E8] sticky top-0 z-40 shadow-2xs h-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Left: Brand Logo & Jump to... Search */}
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

            {/* Jump to... Global Search Bar */}
            <div className="hidden md:flex items-center relative w-72 lg:w-84">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Jump to..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 py-2 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden bg-[#FAFAFA] focus:bg-white transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-sm">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Right: Controls & Profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Status Pill */}
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Verify Credential</span>
            </span>

            {/* Dynamic Role Switcher Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border border-gray-200 bg-white text-xs font-semibold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C61D1F]" />
              <span className="text-gray-500 text-[11px]">Role:</span>
              <select
                value={role || "admin"}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                className="font-extrabold text-xs text-gray-900 bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="admin">Chief Admin</option>
                <option value="editor">Desk Editor</option>
                <option value="writer">Staff Writer</option>
              </select>
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => setActiveTab("reviewQueue")}
              className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Review queue notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingSubmissions.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C61D1F]" />
              )}
            </button>

            {/* User Profile Info */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-gray-200">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#C61D1F] shrink-0">
                <Image
                  src={user?.avatar || "/assets/social-image-1.png"}
                  alt={user?.name || "Usman Bello"}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="font-extrabold text-xs text-[#111111] leading-tight">
                  {user?.name || "Usman Bello"}
                </div>
                <div className="text-[10px] font-bold uppercase text-[#C61D1F] tracking-wider">
                  {user?.badge || "CHIEF ADMIN"}
                </div>
              </div>
            </div>

            {/* Logout Button */}
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

      {/* 2. MAIN DASHBOARD BODY (Sidebar + Workspace Canvas) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row items-start gap-6">
        
        {/* LEFT ROUNDED SIDEBAR (Matching the template) */}
        <aside className="w-full md:w-60 lg:w-64 shrink-0 bg-white rounded-3xl p-3 border border-[#E5E6E8] shadow-2xs space-y-1">
          
          {/* Sidebar Item 1: Overview */}
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#C61D1F] text-white shadow-md shadow-red-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* Sidebar Item 2: Dispatches */}
          <button
            onClick={() => setActiveTab("dispatches")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "dispatches"
                ? "bg-[#C61D1F] text-white shadow-md shadow-red-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 shrink-0" />
              <span>{role === "editor" ? "Desk Dispatches" : "All Dispatches"}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "dispatches" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {articles.length}
            </span>
          </button>

          {/* Sidebar Item 3: Review Queue */}
          <button
            onClick={() => setActiveTab("reviewQueue")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "reviewQueue"
                ? "bg-[#C61D1F] text-white shadow-md shadow-red-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Inbox className="w-4 h-4 shrink-0" />
              <span>Review Queue</span>
            </div>
            {pendingSubmissions.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "reviewQueue" ? "bg-white text-[#C61D1F]" : "bg-amber-100 text-amber-800"
              }`}>
                {pendingSubmissions.length}
              </span>
            )}
          </button>

          {/* SECTION: NEWSROOM PERSONNEL & MULTI-STAFF */}
          <div className="pt-2 pb-1 px-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Newsroom Staff
            </span>
          </div>

          {/* Sidebar Item 4: Newsroom Staff (All Members) */}
          <button
            onClick={() => {
              setActiveTab("team");
              setTeamFilter("all");
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "team" && !showTeamModal
                ? "bg-[#C61D1F] text-white shadow-md shadow-red-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-4 h-4 shrink-0" />
              <span>All Staff Members</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "team" && !showTeamModal ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {teamMembers.length}
            </span>
          </button>

          {/* Sidebar Item 4b: + Create New Staff */}
          <button
            onClick={() => {
              setActiveTab("team");
              setShowTeamModal(true);
            }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#C61D1F] bg-red-50/70 hover:bg-red-100 transition-all border border-red-200/80 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0 text-[#C61D1F]" />
            <span>+ Create New Staff</span>
          </button>

          {/* Sidebar Item 5: Desk Taxonomy */}
          <button
            onClick={() => setActiveTab("desks")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "desks"
                ? "bg-[#C61D1F] text-white shadow-md shadow-red-500/20"
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

          {/* Sidebar Item 6: Newsletter Subscribers */}
          <button
            onClick={() => setActiveTab("subscribers")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "subscribers"
                ? "bg-[#C61D1F] text-white shadow-md shadow-red-500/20"
                : "text-[#535252] hover:bg-gray-100 hover:text-black"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 shrink-0" />
              <span>Newsletter Roster</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "subscribers" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {subscribers.length}
            </span>
          </button>

          {/* Admin Account Settings */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#C61D1F] text-white shadow-md shadow-red-500/20"
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

        {/* RIGHT WORKSPACE CANVAS */}
        <main className="flex-1 w-full space-y-6">

          {/* Toast Notification */}
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

          {/* ROLE ADVISORY FOR WRITERS */}
          {role === "writer" && (
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-900">Staff Writer Session Active</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You are currently previewing as {user?.name || "Staff Writer"}. Switch clearance to Chief Admin to unlock full roster and dispatch controls.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => switchRole("admin")}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  👑 Switch to Chief Admin
                </button>
                <Link
                  href="/dashboard/author"
                  className="px-4 py-2 bg-[#C61D1F] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-[#A51719] transition-colors shrink-0 text-center"
                >
                  Writer Studio →
                </Link>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW (Matching the template's Hero Banner + Micro Cards + Continue Card) */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Executive Welcome Card (Matching Template) */}
              <div className="rounded-3xl bg-gradient-to-r from-[#0B1528] via-[#0F1E36] to-[#14294C] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Background ambient lighting */}
                <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#C61D1F]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-3 z-10 max-w-xl">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-sm border border-white/10">
                    <span>Good morning</span> <span>☀️</span>
                  </span>
                  
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome back, {user?.name ? user.name.split(" ")[0] : "Usman"}
                  </h2>
                  
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    You're 78% through the weekly editorial publishing review across Northern Nigeria desks. Keep it up!
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditingArticle(null);
                        setFormData({
                          title: "",
                          slug: "",
                          category: "Business",
                          coverImage: "/assets/hero-featured.jpg",
                          excerpt: "",
                          content: "",
                          authorName: user?.name || "The Zango Bureau",
                          readTime: "4 min read",
                          isFeatured: false,
                          isTrending: false,
                          isEditorsPick: false,
                          isLatest: false,
                        });
                        setShowCreateModal(true);
                      }}
                      className="px-5 py-2.5 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <span>▶ Publish Story</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("reviewQueue")}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer"
                    >
                      <span>Explore Review Queue →</span>
                    </button>
                  </div>
                </div>

                {/* Right Circular Progress Ring (Matching the 50% circle in template) */}
                <div className="flex items-center space-x-6 shrink-0 z-10">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-white/10"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-[#C61D1F]"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - 0.78)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl sm:text-2xl font-extrabold text-white">78%</span>
                      <span className="text-[9px] font-bold uppercase text-slate-300">Throughput</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row of 4 Micro-Metric Cards (Matching template) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#707070] tracking-wider block">
                      Active Stories
                    </span>
                    <span className="text-lg font-extrabold text-[#111111]">{articles.length} Published</span>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#707070] tracking-wider block">
                      Review Queue
                    </span>
                    <span className="text-lg font-extrabold text-[#111111]">{pendingSubmissions.length} Pending</span>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#707070] tracking-wider block">
                      Verified Readers
                    </span>
                    <span className="text-lg font-extrabold text-[#111111]">{metrics.totalSubscribers} Readers</span>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#707070] tracking-wider block">
                      Regional Desks
                    </span>
                    <span className="text-lg font-extrabold text-[#111111]">11 Operational</span>
                  </div>
                </div>

              </div>

              {/* Newsroom Personnel & Multi-Staff Summary Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5E6E8] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#C61D1F] flex items-center justify-center shrink-0 border border-red-100">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-4 bg-[#C61D1F] rounded-xs inline-block" />
                      <h4 className="font-extrabold text-sm text-[#111111] uppercase tracking-wide">
                        Newsroom Personnel & Staff Architecture
                      </h4>
                    </div>
                    <p className="text-xs text-[#707070] mt-0.5">
                      {teamMembers.length} Active Staff:{" "}
                      <span className="font-semibold text-red-700">{teamMembers.filter(m => m.role === "admin").length} Chief Admins</span>,{" "}
                      <span className="font-semibold text-blue-700">{teamMembers.filter(m => m.role === "editor").length} Desk Editors</span>,{" "}
                      <span className="font-semibold text-emerald-700">{teamMembers.filter(m => m.role === "writer").length} Staff Writers</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab("team");
                      setShowTeamModal(true);
                    }}
                    className="px-4 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Staff</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("team");
                      setTeamFilter("all");
                    }}
                    className="px-4 py-2 border border-gray-200 hover:border-black rounded-xl text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-black transition-all cursor-pointer bg-white"
                  >
                    View All Staff →
                  </button>
                </div>
              </div>

              {/* Section: CONTINUE EDITORIAL WORK (Matching "Continue Learning" from template) */}
              {leadFeaturedArticle && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#707070]">
                      Continue Editorial Work
                    </span>
                    <span className="text-xs text-gray-400">Last updated: Today</span>
                  </div>

                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5E6E8] shadow-2xs flex flex-col md:flex-row items-center gap-6">
                    <div className="relative w-full md:w-64 h-40 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                      <Image
                        src={leadFeaturedArticle.coverImage}
                        alt={leadFeaturedArticle.title}
                        fill
                        sizes="260px"
                        className="object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-[#C61D1F] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-xs">
                        {leadFeaturedArticle.category}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-left">
                      <div className="text-[11px] font-semibold text-gray-400">
                        Apex Desk • {leadFeaturedArticle.publishedAt} • {leadFeaturedArticle.readTime}
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-[#111111] hover:text-[#C61D1F] transition-colors line-clamp-2">
                        {leadFeaturedArticle.title}
                      </h3>
                      <p className="text-xs text-[#707070] line-clamp-2">
                        {leadFeaturedArticle.excerpt}
                      </p>

                      <div className="pt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                            C
                          </span>
                          <span className="text-xs font-bold text-gray-800">{leadFeaturedArticle.author.name}</span>
                        </div>

                        <button
                          onClick={() => handleOpenEdit(leadFeaturedArticle)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center space-x-2 cursor-pointer"
                        >
                          <span>▶ Edit Dispatch</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fast Jump Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div 
                  onClick={() => setActiveTab("dispatches")}
                  className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs hover:border-[#C61D1F] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#111111] group-hover:text-[#C61D1F]">
                      Manage All Dispatches ({articles.length})
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#C61D1F] group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-[#707070]">
                    Review and modify headlines, hero display tags, and category beats across 11 Northern Nigeria desks.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab("reviewQueue")}
                  className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs hover:border-[#C61D1F] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#111111] group-hover:text-[#C61D1F]">
                      Writer Review Queue ({pendingSubmissions.length})
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#C61D1F] group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-[#707070]">
                    Read writer drafts submitted through author studio, verify sources, and publish straight to the front page.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DISPATCHES (Story Management Table) */}
          {activeTab === "dispatches" && (
            <div className="space-y-4">
              
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5E6E8] flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter stories by headline, author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-[#DFDFDF] rounded-xl focus:border-[#C61D1F] focus:outline-hidden"
                  />
                </div>

                {/* Desk Selector */}
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 text-xs border border-[#DFDFDF] rounded-xl focus:border-[#C61D1F] focus:outline-hidden bg-white cursor-pointer"
                  >
                    <option value="all">All Desks (11)</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setEditingArticle(null);
                      setFormData({
                        title: "",
                        slug: "",
                        category: "Business",
                        coverImage: "/assets/hero-featured.jpg",
                        excerpt: "",
                        content: "",
                        authorName: user?.name || "The Zango Bureau",
                        readTime: "4 min read",
                        isFeatured: false,
                        isTrending: false,
                        isEditorsPick: false,
                        isLatest: false,
                      });
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Publish</span>
                  </button>
                </div>

              </div>

              {/* Table */}
              <div className="bg-white rounded-3xl border border-[#E5E6E8] overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E6E8] bg-[#FAFAFA] text-[11px] font-extrabold uppercase text-[#707070] tracking-wider">
                        <th className="py-4 px-6">Story Dispatch</th>
                        <th className="py-4 px-6">Desk / Category</th>
                        <th className="py-4 px-6">Author Byline</th>
                        <th className="py-4 px-6">Placements & Badges</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E6E8] text-xs">
                      {filteredArticles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-[#707070]">
                            No published dispatches match your filter query.
                          </td>
                        </tr>
                      ) : (
                        filteredArticles.map((article) => (
                          <tr key={article.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3.5">
                                <div className="relative w-14 h-11 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                  <Image
                                    src={article.coverImage}
                                    alt={article.title}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="max-w-md">
                                  <Link
                                    href={`/article/${article.slug}`}
                                    className="font-bold text-[#111111] hover:text-[#C61D1F] transition-colors line-clamp-1 block text-sm"
                                  >
                                    {article.title}
                                  </Link>
                                  <span className="text-[11px] text-[#707070] line-clamp-1 mt-0.5">
                                    {article.excerpt}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span className="inline-block bg-[#FDF2F2] text-[#C61D1F] font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-sm">
                                {article.category}
                              </span>
                            </td>

                            <td className="py-4 px-6 font-semibold text-[#111111]">
                              {article.author.name}
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => handleToggleFlag(article.id, "isFeatured")}
                                  title="Toggle Hero Headline"
                                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                    article.isFeatured
                                      ? "bg-red-100 text-[#C61D1F]"
                                      : "bg-gray-100 text-gray-400 hover:text-black"
                                  }`}
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleFlag(article.id, "isTrending")}
                                  title="Toggle Trending Velocity"
                                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                    article.isTrending
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-gray-100 text-gray-400 hover:text-black"
                                  }`}
                                >
                                  <Flame className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleFlag(article.id, "isEditorsPick")}
                                  title="Toggle Editor's Pick"
                                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                    article.isEditorsPick
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-gray-100 text-gray-400 hover:text-black"
                                  }`}
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleOpenEdit(article)}
                                  className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Story"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(article.id, article.title)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Story"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: REVIEW QUEUE */}
          {activeTab === "reviewQueue" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E6E8]">
                <div>
                  <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                    Author Submissions & Review Queue ({pendingSubmissions.length})
                  </h3>
                  <p className="text-xs text-[#707070]">
                    Verify manuscripts submitted by regional correspondents before publishing live.
                  </p>
                </div>
              </div>

              {pendingSubmissions.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E6E8] shadow-2xs">
                  <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-extrabold text-[#111111] text-sm">Review Queue Clear</h4>
                  <p className="text-xs text-[#707070] mt-1 max-w-sm mx-auto">
                    All contributing manuscripts have been cleared or published.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="bg-[#FDF2F2] text-[#C61D1F] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-sm">
                            {sub.category}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-[#707070]">{sub.submittedAt}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-[#707070]">{sub.wordCount} words</span>
                        </div>

                        <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-amber-200">
                          Pending Clearance
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-[#111111]">{sub.title}</h4>
                        <p className="text-xs text-[#535252] mt-1.5 leading-relaxed">{sub.excerpt}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-700 max-h-40 overflow-y-auto">
                        <div className="font-bold text-gray-900 mb-1">Manuscript Preview:</div>
                        <div className="line-clamp-4">{sub.content.replace(/<[^>]*>/g, " ")}</div>
                      </div>

                      <div className="pt-2 border-t border-[#E5E6E8] flex items-center justify-between">
                        <div className="text-xs">
                          <span className="font-bold text-[#111111]">{sub.authorName}</span>
                          {sub.authorEmail && <span className="text-[#707070] ml-1.5">({sub.authorEmail})</span>}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRejectSubmission(sub.id, sub.title)}
                            className="px-3.5 py-1.5 border border-[#DFDFDF] hover:border-red-600 hover:text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveSubmission(sub.id, sub.title)}
                            className="px-4 py-1.5 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
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

          {/* TAB 4: NEWSROOM TEAM (Multi-Staff Architecture) */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-[#E5E6E8] p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E6E8]">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                      <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                        Newsroom Personnel & Role Architecture
                      </h3>
                    </div>
                    <p className="text-xs text-[#707070] mt-1">
                      Enterprise Multi-Staff System: assign multiple Chief Admins, multiple Desk Editors across beats, and unlimited field correspondents.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowTeamModal(true)}
                    className="px-5 py-2.5 bg-[#C61D1F] hover:bg-[#A51719] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add Staff Member</span>
                  </button>
                </div>

                {/* Search & Multi-Staff Role Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                  {/* Role Filter Tabs */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setTeamFilter("all")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        teamFilter === "all" ? "bg-[#111111] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      All Staff ({teamMembers.length})
                    </button>

                    <button
                      onClick={() => setTeamFilter("admin")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        teamFilter === "admin" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      👑 Chief Admins ({teamMembers.filter(m => m.role === "admin").length})
                    </button>

                    <button
                      onClick={() => setTeamFilter("editor")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        teamFilter === "editor" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      ✍️ Desk Editors ({teamMembers.filter(m => m.role === "editor").length})
                    </button>

                    <button
                      onClick={() => setTeamFilter("writer")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        teamFilter === "writer" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      📝 Staff Writers ({teamMembers.filter(m => m.role === "writer").length})
                    </button>
                  </div>

                  {/* Search Staff Input */}
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search staff by name or email..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-[#C61D1F] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Team Roster Table */}
                <div className="overflow-x-auto border border-[#E5E6E8] rounded-2xl mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E6E8] bg-[#FAFAFA] text-[11px] font-extrabold uppercase text-[#707070] tracking-wider">
                        <th className="py-4 px-6">Journalist & Byline</th>
                        <th className="py-4 px-6">Assigned Desk</th>
                        <th className="py-4 px-6">Role Clearance</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E6E8] text-xs">
                      {teamMembers
                        .filter(m => teamFilter === "all" || m.role === teamFilter)
                        .filter(m => 
                          staffSearchQuery === "" ||
                          m.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                          m.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                          m.desk.toLowerCase().includes(staffSearchQuery.toLowerCase())
                        )
                        .map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                <Image
                                  src={member.avatar || "/assets/social-image-1.png"}
                                  alt={member.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-bold text-[#111111] text-sm">{member.name}</div>
                                <div className="text-[11px] text-[#707070]">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md text-[11px]">
                              {member.desk}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              {member.role === "admin" && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-bold text-[10px] uppercase">
                                  Chief Admin
                                </span>
                              )}
                              {member.role === "editor" && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold text-[10px] uppercase">
                                  Desk Editor
                                </span>
                              )}
                              {member.role === "writer" && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px] uppercase">
                                  Staff Writer
                                </span>
                              )}
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member.id, e.target.value as NewsroomRole, member.name)}
                                className="bg-white border border-[#DFDFDF] hover:border-black text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
                              >
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="writer">Writer</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleToggleMemberStatus(member.id, member.status, member.name)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                                member.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              ● {member.status}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove staff member"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* TAB 5: DESK TAXONOMY */}
          {activeTab === "desks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E6E8]">
                <div>
                  <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                    Editorial Desks & Beats ({CATEGORIES.length})
                  </h3>
                  <p className="text-xs text-[#707070]">
                    The 11 core newsroom divisions covering Northern Nigeria and the Sahel corridor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORIES.map((desk) => (
                  <div
                    key={desk.id}
                    className="bg-white p-5 rounded-3xl border border-[#E5E6E8] shadow-2xs space-y-2 hover:border-[#C61D1F] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#111111]">{desk.name}</span>
                      <span className="bg-[#FDF2F2] text-[#C61D1F] text-[10px] font-extrabold px-2 py-0.5 rounded-sm uppercase">
                        {desk.count} stories
                      </span>
                    </div>
                    <p className="text-xs text-[#707070] line-clamp-2">{desk.description}</p>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Status: {desk.status || "Active"}</span>
                      <Link
                        href={`/category/${desk.slug}`}
                        className="text-[#C61D1F] font-bold hover:underline"
                      >
                        View Desk →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {/* TAB 7: ACCOUNT & PROFILE SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl border border-[#E5E6E8] p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="pb-4 border-b border-[#E5E6E8]">
                <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                  Executive Admin Profile & Bureau Settings
                </h3>
                <p className="text-xs text-[#707070] mt-1">
                  Manage your credentials, official newsroom identity, and editorial alert preferences.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Official Name</label>
                    <input
                      type="text"
                      defaultValue={user?.name || "Usman Bello"}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-[#C61D1F] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Bureau Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email || "usman.bello@thezango.org"}
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Clearance Role</label>
                    <input
                      type="text"
                      defaultValue="Chief Administrator / Bureau Chief (Full Access)"
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Update Passcode</label>
                    <input
                      type="password"
                      placeholder="Enter new account passcode"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-[#C61D1F] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Editorial Notifications</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-[#C61D1F] focus:ring-[#C61D1F]" />
                        <span>Email alert whenever a correspondent submits a pitch</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-[#C61D1F] focus:ring-[#C61D1F]" />
                        <span>Daily subscriber briefing summary at 6:00 AM</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E6E8] flex justify-end">
                <button
                  type="button"
                  onClick={() => triggerToast("Admin profile settings updated successfully!")}
                  className="px-6 py-2.5 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: NEWSLETTER ROSTER */}
          {activeTab === "subscribers" && (
            <div className="bg-white rounded-3xl border border-[#E5E6E8] overflow-hidden shadow-2xs">
              <div className="p-6 border-b border-[#E5E6E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#111111]">
                    The Zango Brief Subscribers ({subscribers.length})
                  </h3>
                  <p className="text-xs text-[#707070]">
                    Verified readers subscribed to morning dispatches.
                  </p>
                </div>

                <button
                  onClick={exportSubscribersCSV}
                  className="px-4 py-2 bg-[#111111] hover:bg-[#C61D1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center space-x-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E6E8] bg-[#FAFAFA] text-[11px] font-extrabold uppercase text-[#707070] tracking-wider">
                      <th className="py-4 px-6">Subscriber Email</th>
                      <th className="py-4 px-6">Subscribed Date</th>
                      <th className="py-4 px-6 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E6E8] text-xs">
                    {subscribers.map((sub, i) => (
                      <tr key={i} className="hover:bg-gray-50/70">
                        <td className="py-3.5 px-6 font-semibold text-[#111111]">{sub.email}</td>
                        <td className="py-3.5 px-6 text-[#707070]">{sub.subscribedAt}</td>
                        <td className="py-3.5 px-6 text-right">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 3. MODALS (Retaining full smooth scroll UX with pinned header & footer) */}
      
      {/* Story Publishing / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            
            {/* Pinned Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E6E8] shrink-0 bg-white">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                <h3 className="text-base sm:text-lg font-extrabold text-[#000000] uppercase tracking-wide">
                  {editingArticle ? "Edit Story Dispatch" : "Publish New Story Dispatch"}
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

            {/* Scrollable Form Body */}
            <form id="story-dispatch-form" onSubmit={handleCreateSubmit} className="overflow-y-auto flex-1 p-6 space-y-5 text-xs overscroll-contain">
              
              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kano Agritech Hub Secures $1.5M Seed Round"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-sm focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Beat / Desk (All 11 Desks)</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Author Byline</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Read Time</label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Dynamic Cover Image Uploader with Cloudinary & Preset Stock */}
              <ImageUploader
                label="Story Cover Image (Upload from device or select editorial stock)"
                value={formData.coverImage}
                onChange={(url) => setFormData({ ...formData, coverImage: url })}
              />

              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Lead Excerpt</label>
                <textarea
                  rows={2}
                  placeholder="Short 2-line summary for front page cards and search snippets..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#000000] uppercase mb-2">Story Manuscript Body (WYSIWYG Rich Editor) *</label>
                <RichEditor
                  value={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Draft full longform article content. Use the editor toolbar for formatting, tables, images, and video/tweet embeds..."
                  height={340}
                />
              </div>

              {/* Publication Flags */}
              <div className="pt-3 border-t border-[#E5E6E8]">
                <span className="block font-bold text-[#000000] uppercase mb-2">Editorial Display Placements</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2.5 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-gray-700">Hero Headline</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2.5 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isLatest}
                      onChange={(e) => setFormData({ ...formData, isLatest: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-gray-700">Latest Breaking</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2.5 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isTrending}
                      onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-gray-700">Trending Velocity</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2.5 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isEditorsPick}
                      onChange={(e) => setFormData({ ...formData, isEditorsPick: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-gray-700">Editor's Pick</span>
                  </label>
                </div>
              </div>

            </form>

            {/* Pinned Sticky Footer */}
            <div className="px-6 py-4 border-t border-[#E5E6E8] shrink-0 bg-[#F8F9FA] flex items-center justify-between">
              <span className="text-[11px] text-[#707070]">
                {editingArticle ? "Editing: " + editingArticle.title.slice(0, 30) + "..." : "Live Publishing Clearance"}
              </span>
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
                  form="story-dispatch-form"
                  className="px-6 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                >
                  {editingArticle ? "Save Changes" : "Publish Dispatch"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Newsroom Team Member Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E6E8] shrink-0 bg-white">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                <h3 className="text-base font-extrabold text-[#000000] uppercase tracking-wide">
                  Add Newsroom Staff Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="text-gray-400 hover:text-black p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="team-member-form" onSubmit={handleAddTeamMember} className="overflow-y-auto flex-1 p-6 space-y-4 text-xs overscroll-contain">
              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zainab Aliyu"
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Corporate / Journalist Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zainab.aliyu@thezango.org"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-sm focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Newsroom Role *</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as NewsroomRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    <option value="writer">Staff Writer (Submit Manuscripts)</option>
                    <option value="editor">Desk Editor (Review & Publish)</option>
                    <option value="admin">Chief Admin (Full Access & CMS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Assigned Desk / Beat *</label>
                  <select
                    value={newMemberForm.desk}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, desk: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="Executive & Investigation">Executive & Investigation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Avatar Image URL</label>
                <input
                  type="text"
                  value={newMemberForm.avatar}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, avatar: e.target.value })}
                  placeholder="/assets/social-image-1.png or Cloudinary URL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Journalist Bio</label>
                <textarea
                  rows={3}
                  placeholder="Brief editorial background, focus areas, and geographic beat coverage..."
                  value={newMemberForm.bio}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden resize-none"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-[#E5E6E8] shrink-0 bg-[#F8F9FA] flex items-center justify-between">
              <span className="text-[11px] text-[#707070]">Newsroom Staff Clearance</span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 border border-[#DFDFDF] hover:border-black rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="team-member-form"
                  className="px-6 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                >
                  Confirm & Add Staff
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-8 text-sm text-[#707070]">
          Loading Chief Editor CMS...
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
