"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  RefreshCw
} from "lucide-react";
import { Article, Subscriber, Submission } from "@/types";
import { 
  getArticles, 
  createArticle, 
  updateArticle,
  toggleArticleFlag,
  deleteArticle, 
  getSubscribers, 
  getPlatformMetrics,
  getSubmissions,
  approveSubmission,
  rejectSubmission
} from "@/lib/firebase/db";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { CATEGORIES } from "@/data/mock-articles";

export default function AdminDashboardPage() {
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
  const [activeTab, setActiveTab] = useState<"dispatches" | "reviewQueue" | "subscribers" | "desks">("dispatches");
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

  const loadData = async () => {
    const arts = await getArticles();
    const subs = await getSubscribers();
    const subsQueue = await getSubmissions();
    const mets = await getPlatformMetrics();

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
    if (!formData.title || !formData.content) return;

    const slug = formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    if (editingArticle) {
      await updateArticle(editingArticle.id, {
        title: formData.title,
        slug,
        category: formData.category,
        coverImage: formData.coverImage,
        excerpt: formData.excerpt || formData.content.slice(0, 160) + "...",
        content: formData.content,
        readTime: formData.readTime,
        isFeatured: formData.isFeatured,
        isTrending: formData.isTrending,
        isEditorsPick: formData.isEditorsPick,
        isLatest: formData.isLatest,
        author: {
          ...editingArticle.author,
          name: formData.authorName,
          slug: formData.authorName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        },
      });
      triggerToast("Story updated successfully!");
    } else {
      await createArticle({
        title: formData.title,
        slug,
        category: formData.category,
        coverImage: formData.coverImage,
        excerpt: formData.excerpt || formData.content.slice(0, 160) + "...",
        content: formData.content,
        publishedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        readTime: formData.readTime,
        isFeatured: formData.isFeatured,
        isTrending: formData.isTrending,
        isEditorsPick: formData.isEditorsPick,
        isLatest: formData.isLatest,
        views: 0,
        author: {
          id: "author-admin",
          name: formData.authorName,
          slug: formData.authorName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          role: "Editorial Desk",
        },
      });
      triggerToast("New story published to front page!");
    }

    await loadData();
    setShowCreateModal(false);
    setEditingArticle(null);
    setFormData({
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
  };

  const handleApproveSubmission = async (id: string, title: string) => {
    const published = await approveSubmission(id);
    if (published) {
      await loadData();
      triggerToast(`Manuscript "${title.slice(0, 25)}..." approved and published live!`);
    }
  };

  const handleRejectSubmission = async (id: string, title: string) => {
    await rejectSubmission(id);
    await loadData();
    triggerToast(`Manuscript "${title.slice(0, 25)}..." returned for revision.`);
  };

  const exportSubscribersCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + ["Email,Subscribed At", ...subscribers.map((s) => `${s.email},${s.subscribedAt}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `the-zango-subscribers-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Subscribers list exported as CSV.");
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16">
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#E5E6E8] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          
          {/* Left: Brand & Return */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-[#535252] hover:text-[#C61D1F] text-xs font-bold uppercase transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Front Page</span>
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
              <h1 className="text-base font-extrabold text-[#000000] tracking-wide uppercase">
                Chief Editor CMS
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/author"
              className="px-3.5 py-1.5 rounded-xl border border-[#DFDFDF] hover:border-[#C61D1F] text-xs font-bold text-[#535252] hover:text-[#C61D1F] transition-colors bg-white"
            >
              Author Studio →
            </Link>

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
                  authorName: "The Zango Bureau",
                  readTime: "4 min read",
                  isFeatured: false,
                  isTrending: false,
                  isEditorsPick: false,
                  isLatest: false,
                });
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Story</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Toast Alert */}
        {notification && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FDF2F2] border border-red-200 text-[#C61D1F] flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#C61D1F] shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-xs text-red-700 hover:underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Executive KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          {/* KPI 1 */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-[#707070] mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#000000]">Published Dispatches</span>
              <FileText className="w-4 h-4 text-[#C61D1F]" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#000000]">{metrics.totalArticles}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                11 Desks Live
              </span>
            </div>
            <span className="text-[11px] text-[#9C9C9C] mt-2 block">
              Across all regional beats
            </span>
          </div>

          {/* KPI 2 */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-[#707070] mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#000000]">Total Impressions</span>
              <BarChart3 className="w-4 h-4 text-[#000000]" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#000000]">{metrics.totalViews.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +18.4%
              </span>
            </div>
            <span className="text-[11px] text-[#9C9C9C] mt-2 block">
              Cumulative readers this month
            </span>
          </div>

          {/* KPI 3 */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-[#707070] mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#000000]">Newsletter Community</span>
              <Users className="w-4 h-4 text-[#C61D1F]" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#000000]">{metrics.totalSubscribers}</span>
              <button
                onClick={exportSubscribersCSV}
                className="text-[11px] font-bold text-[#C61D1F] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            </div>
            <span className="text-[11px] text-[#9C9C9C] mt-2 block">
              Verified daily brief readers
            </span>
          </div>

          {/* KPI 4 */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-[#707070] mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#000000]">Review Queue</span>
              <Inbox className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#000000]">{pendingSubmissions.length}</span>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Awaiting Review
              </span>
            </div>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="text-[11px] font-medium text-[#707070]">
                {isFirebaseConfigured ? "Firebase Cloud Live" : "Local Mock Engine"}
              </span>
            </div>
          </div>

        </div>

        {/* Tab Navigation with Zango Signature Red Underline */}
        <div className="flex items-center space-x-2 border-b border-[#E5E6E8] mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dispatches")}
            className={`pb-3.5 px-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors relative cursor-pointer whitespace-nowrap ${
              activeTab === "dispatches" ? "text-[#C61D1F]" : "text-[#707070] hover:text-[#000000]"
            }`}
          >
            <span>Published Dispatches ({articles.length})</span>
            {activeTab === "dispatches" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#C61D1F] rounded-t-sm" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("reviewQueue")}
            className={`pb-3.5 px-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors relative cursor-pointer whitespace-nowrap ${
              activeTab === "reviewQueue" ? "text-[#C61D1F]" : "text-[#707070] hover:text-[#000000]"
            }`}
          >
            <span>Writer Submissions ({pendingSubmissions.length})</span>
            {pendingSubmissions.length > 0 && (
              <span className="ml-1.5 bg-[#C61D1F] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingSubmissions.length}
              </span>
            )}
            {activeTab === "reviewQueue" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#C61D1F] rounded-t-sm" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("desks")}
            className={`pb-3.5 px-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors relative cursor-pointer whitespace-nowrap ${
              activeTab === "desks" ? "text-[#C61D1F]" : "text-[#707070] hover:text-[#000000]"
            }`}
          >
            <span>Desk Taxonomy (11)</span>
            {activeTab === "desks" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#C61D1F] rounded-t-sm" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("subscribers")}
            className={`pb-3.5 px-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors relative cursor-pointer whitespace-nowrap ${
              activeTab === "subscribers" ? "text-[#C61D1F]" : "text-[#707070] hover:text-[#000000]"
            }`}
          >
            <span>Newsletter Roster ({subscribers.length})</span>
            {activeTab === "subscribers" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#C61D1F] rounded-t-sm" />
            )}
          </button>
        </div>

        {/* TAB 1: Dispatches Management */}
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

              {/* Category Filter */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs border border-[#DFDFDF] rounded-xl px-3 py-2 bg-white focus:border-[#C61D1F] focus:outline-hidden"
                >
                  <option value="all">All Desks (11)</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name} Desk
                    </option>
                  ))}
                </select>

                <span className="text-xs text-[#9C9C9C] whitespace-nowrap">
                  Showing {filteredArticles.length} of {articles.length}
                </span>
              </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-3xl border border-[#E5E6E8] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E6E8] bg-[#FAFAFA] text-[11px] font-extrabold uppercase text-[#707070] tracking-wider">
                      <th className="py-4 px-6">Headline & Beat</th>
                      <th className="py-4 px-4">Author Byline</th>
                      <th className="py-4 px-4">Published</th>
                      <th className="py-4 px-4 text-center">Flags</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E6E8] text-xs">
                    {filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50/70 transition-colors">
                        
                        {/* Title & Category */}
                        <td className="py-4 px-6 max-w-md">
                          <div className="flex items-start space-x-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                              <Image
                                src={article.coverImage}
                                alt={article.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <Link
                                href={`/article/${article.slug}`}
                                className="font-bold text-[#000000] hover:text-[#C61D1F] line-clamp-2 transition-colors"
                              >
                                {article.title}
                              </Link>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="bg-[#FDF2F2] text-[#C61D1F] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-sm">
                                  {article.category}
                                </span>
                                <span className="text-[11px] text-[#9C9C9C]">{article.readTime}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="py-4 px-4 text-[#535252]">
                          <Link href={`/author/${article.author.slug}`} className="font-semibold hover:text-[#C61D1F]">
                            {article.author.name}
                          </Link>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-[#707070] whitespace-nowrap">
                          {article.publishedAt}
                        </td>

                        {/* Interactive Flags */}
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-1.5">
                            
                            {/* Featured Toggle */}
                            <button
                              onClick={() => handleToggleFlag(article.id, "isFeatured")}
                              title="Toggle Hero Featured"
                              className={`p-1.5 rounded-md border text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                article.isFeatured
                                  ? "bg-red-50 text-[#C61D1F] border-red-200"
                                  : "text-gray-300 border-gray-200 hover:text-gray-600"
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${article.isFeatured ? "fill-current" : ""}`} />
                            </button>

                            {/* Trending Toggle */}
                            <button
                              onClick={() => handleToggleFlag(article.id, "isTrending")}
                              title="Toggle Trending Spotlight"
                              className={`p-1.5 rounded-md border text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                article.isTrending
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : "text-gray-300 border-gray-200 hover:text-gray-600"
                              }`}
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </button>

                            {/* Editor's Pick Toggle */}
                            <button
                              onClick={() => handleToggleFlag(article.id, "isEditorsPick")}
                              title="Toggle Editor's Pick"
                              className={`p-1.5 rounded-md border text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                article.isEditorsPick
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : "text-gray-300 border-gray-200 hover:text-gray-600"
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>

                            {/* Latest/Breaking Toggle */}
                            <button
                              onClick={() => handleToggleFlag(article.id, "isLatest")}
                              title="Toggle Latest/Breaking News Sidebar"
                              className={`p-1.5 rounded-md border text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                article.isLatest
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  : "text-gray-300 border-gray-200 hover:text-gray-600"
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/article/${article.slug}`}
                              target="_blank"
                              title="Preview on live reader"
                              className="p-2 text-gray-500 hover:text-[#C61D1F] hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleOpenEdit(article)}
                              title="Edit story"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(article.id, article.title)}
                              title="Delete dispatch"
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

        {/* TAB 2: Review Queue (Writer Submissions from Studio) */}
        {activeTab === "reviewQueue" && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#000000]">
                    Writer & Contributor Manuscript Submissions
                  </h3>
                  <p className="text-xs text-[#707070]">
                    Review drafts submitted by correspondents from the Writer Studio before publishing them live.
                  </p>
                </div>
                <span className="bg-[#FDF2F2] text-[#C61D1F] font-bold text-xs px-3 py-1 rounded-full">
                  {pendingSubmissions.length} Pending
                </span>
              </div>

              {pendingSubmissions.length > 0 ? (
                <div className="space-y-4 divide-y divide-[#E5E6E8]">
                  {pendingSubmissions.map((sub) => (
                    <div key={sub.id} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center space-x-2">
                          <span className="bg-gray-100 text-[#111111] text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm">
                            {sub.category}
                          </span>
                          <span className="text-[11px] text-[#9C9C9C]">
                            By {sub.authorName} • {sub.submittedAt}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-600">
                            {sub.wordCount} words ({sub.readTime})
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[#000000]">
                          {sub.title}
                        </h4>
                        <p className="text-xs text-[#707070] line-clamp-2 leading-relaxed">
                          {sub.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <button
                          onClick={() => handleRejectSubmission(sub.id, sub.title)}
                          className="px-3 py-2 border border-gray-300 hover:border-gray-500 text-gray-700 rounded-xl text-xs font-bold uppercase transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Request Edits</span>
                        </button>

                        <button
                          onClick={() => handleApproveSubmission(sub.id, sub.title)}
                          className="px-4 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#9C9C9C]">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-[#535252]">Review queue is clear!</p>
                  <p className="text-xs">No pending writer manuscripts waiting for approval.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Newsroom Desk Health & Taxonomy */}
        {activeTab === "desks" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => {
              const catArticles = articles.filter(
                (a) => a.category.toLowerCase() === cat.slug || (cat.slug === "news" && a.isLatest)
              );
              return (
                <div key={cat.id} className="bg-white p-6 rounded-3xl border border-[#E5E6E8] shadow-2xs hover:border-[#C61D1F] transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C61D1F]">
                        {cat.name} Desk
                      </span>
                      <span className="bg-gray-100 text-[#535252] text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {catArticles.length} Stories
                      </span>
                    </div>
                    <p className="text-xs text-[#707070] leading-relaxed mb-4">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E5E6E8] flex items-center justify-between">
                    <span className="text-[11px] text-[#9C9C9C]">
                      Status: Active
                    </span>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-xs font-bold text-[#C61D1F] hover:underline flex items-center space-x-1"
                    >
                      <span>View Live Desk</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: Newsletter Subscribers */}
        {activeTab === "subscribers" && (
          <div className="bg-white rounded-3xl border border-[#E5E6E8] overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-[#E5E6E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#000000]">
                  The Zango Brief Subscribers ({subscribers.length})
                </h3>
                <p className="text-xs text-[#707070]">
                  Readers registered to receive morning and weekend dispatches.
                </p>
              </div>

              <button
                onClick={exportSubscribersCSV}
                className="px-4 py-2 bg-[#000000] hover:bg-[#C61D1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center space-x-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Roster</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E6E8] bg-[#FAFAFA] text-[11px] font-extrabold uppercase text-[#707070] tracking-wider">
                    <th className="py-4 px-6">Subscriber Email</th>
                    <th className="py-4 px-6">Joined Date</th>
                    <th className="py-4 px-6 text-right">Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E6E8] text-xs">
                  {subscribers.map((sub, i) => (
                    <tr key={i} className="hover:bg-gray-50/70">
                      <td className="py-3.5 px-6 font-semibold text-[#111111]">
                        {sub.email}
                      </td>
                      <td className="py-3.5 px-6 text-[#707070]">
                        {sub.subscribedAt}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm">
                          Verified Reader
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

      {/* Story Publishing / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5E6E8]">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                <h3 className="text-lg font-extrabold text-[#000000] uppercase tracking-wide">
                  {editingArticle ? "Edit Story Dispatch" : "Publish New Story Dispatch"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingArticle(null);
                }}
                className="text-gray-400 hover:text-black p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Beat / Category (All 11 Desks)</label>
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
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Cover Image Asset</label>
                  <select
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    <option value="/assets/hero-featured.jpg">Hero Deal (Featured)</option>
                    <option value="/assets/news-tomato-jos.jpg">Tomato Jos Agriculture</option>
                    <option value="/assets/trending-hero.jpg">Climate Tech Northern</option>
                    <option value="/assets/news-gitex.jpg">GITEX Tech Gathering</option>
                    <option value="/assets/news-hausa-digital.png">Hausa Language Tech</option>
                    <option value="/assets/news-oxford-skoll.jpg">Oxford Skoll Scholarship</option>
                    <option value="/assets/news-startup-kano.png">Startup Kano Prototyping</option>
                    <option value="/assets/news-hausa-barrier.jpg">Code Arewa Engineering</option>
                    <option value="/assets/news-climate-startup.jpg">Solar Cold-Chain Clinic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Author Byline</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Read Time</label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden"
                  />
                </div>
              </div>

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
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Story Manuscript Body *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Full longform article content. Supports markdown headers (###) and bullet lists..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden font-sans resize-y"
                />
              </div>

              {/* Publication Flags */}
              <div className="pt-2 border-t border-[#E5E6E8]">
                <span className="block font-bold text-[#000000] uppercase mb-2">Editorial Display Placements</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-gray-700">Hero Headline</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isLatest}
                      onChange={(e) => setFormData({ ...formData, isLatest: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-gray-700">Latest Breaking</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isTrending}
                      onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-gray-700">Trending Velocity</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isEditorsPick}
                      onChange={(e) => setFormData({ ...formData, isEditorsPick: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-gray-700">Editor&apos;s Pick</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#E5E6E8] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingArticle(null);
                  }}
                  className="px-4 py-2 border border-[#DFDFDF] hover:border-black rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                >
                  {editingArticle ? "Save Changes" : "Publish Dispatch"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
