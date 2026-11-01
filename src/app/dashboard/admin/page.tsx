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
  Star, 
  TrendingUp, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  ShieldAlert,
  Search,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Article, Subscriber } from "@/types";
import { getArticles, createArticle, deleteArticle, getSubscribers, getPlatformMetrics } from "@/lib/firebase/db";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export default function AdminDashboardPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [metrics, setMetrics] = useState({
    totalArticles: 0,
    totalViews: 0,
    totalSubscribers: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"articles" | "subscribers">("articles");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Article Form State
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
  });

  const loadData = async () => {
    const arts = await getArticles();
    const subs = await getSubscribers();
    const mets = await getPlatformMetrics();
    setArticles([...arts]);
    setSubscribers([...subs]);
    setMetrics({
      totalArticles: mets.totalArticles,
      totalViews: mets.totalViews,
      totalSubscribers: mets.totalSubscribers,
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteArticle(id);
      await loadData();
      triggerToast(`Story "${title.slice(0, 25)}..." deleted.`);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    const slug = formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
      views: 0,
      author: {
        id: "author-admin",
        name: formData.authorName,
        slug: formData.authorName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        role: "Editorial Desk",
      },
    });

    await loadData();
    setShowCreateModal(false);
    triggerToast("New story published successfully!");
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
    });
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

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16">
      
      {/* Top Bar with Role Switcher */}
      <header className="bg-white border-b border-[#E5E6E8] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-[#535252] hover:text-[#C61D1F] text-xs font-bold uppercase transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Front Page</span>
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C61D1F]" />
              <h1 className="text-base font-extrabold text-[#000000]">
                Chief Editor CMS
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/author"
              className="px-3.5 py-1.5 rounded-lg border border-[#DFDFDF] hover:border-[#C61D1F] text-xs font-bold text-[#535252] hover:text-[#C61D1F] transition-colors"
            >
              Switch to Author Studio →
            </Link>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Story</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Toast Notification */}
        {notification && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold">{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-xs text-green-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs">
            <div className="flex items-center justify-between text-[#707070] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Published Stories</span>
              <FileText className="w-4 h-4 text-[#C61D1F]" />
            </div>
            <span className="text-3xl font-extrabold text-[#000000]">{metrics.totalArticles}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs">
            <div className="flex items-center justify-between text-[#707070] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Readership</span>
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-3xl font-extrabold text-[#000000]">{metrics.totalViews.toLocaleString()}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs">
            <div className="flex items-center justify-between text-[#707070] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Newsletter Subscribers</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-3xl font-extrabold text-[#000000]">{metrics.totalSubscribers}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs">
            <div className="flex items-center justify-between text-[#707070] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Firebase Status</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseConfigured ? "bg-green-500" : "bg-amber-400"}`} />
              <span className="text-xs font-bold text-[#111111]">
                {isFirebaseConfigured ? "Live Cloud Connected" : "Local Mock Engine"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 border-b border-[#E5E6E8] mb-6">
          <button
            onClick={() => setActiveTab("articles")}
            className={`pb-3 px-4 font-bold text-sm transition-colors relative cursor-pointer ${
              activeTab === "articles" ? "text-[#C61D1F]" : "text-[#707070] hover:text-[#000000]"
            }`}
          >
            <span>Articles Directory ({articles.length})</span>
            {activeTab === "articles" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C61D1F]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("subscribers")}
            className={`pb-3 px-4 font-bold text-sm transition-colors relative cursor-pointer ${
              activeTab === "subscribers" ? "text-[#C61D1F]" : "text-[#707070] hover:text-[#000000]"
            }`}
          >
            <span>Subscribers List ({subscribers.length})</span>
            {activeTab === "subscribers" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C61D1F]" />
            )}
          </button>
        </div>

        {/* Content Pane: Articles */}
        {activeTab === "articles" && (
          <div className="bg-white rounded-2xl border border-[#E5E6E8] shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-[#E5E6E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="Filter stories by title or beat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 pl-9 text-xs rounded-lg border border-[#DFDFDF] focus:border-[#C61D1F] focus:outline-hidden"
                />
                <Search className="w-4 h-4 text-[#9C9C9C] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <span className="text-xs text-[#707070]">
                Showing {filteredArticles.length} of {articles.length} records
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E6E8]">
                    <th className="py-3.5 px-4">Story</th>
                    <th className="py-3.5 px-4">Beat</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Badges</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E6E8] text-xs">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                            <Image src={article.coverImage} alt="" fill sizes="40px" className="object-cover" />
                          </div>
                          <span className="font-bold text-[#000000] line-clamp-1">
                            {article.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-[#535252] px-2 py-0.5 rounded-sm font-semibold text-[10px] uppercase">
                          {article.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#535252]">
                        {article.author.name}
                      </td>
                      <td className="py-3 px-4 text-[#707070]">
                        {article.publishedAt}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          {article.isFeatured && (
                            <span className="bg-[#C61D1F] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase">
                              Featured
                            </span>
                          )}
                          {article.isTrending && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase">
                              Trending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/article/${article.slug}`}
                            target="_blank"
                            className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md transition-colors"
                            title="View Public Story"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(article.id, article.title)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                            title="Delete Story"
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
        )}

        {/* Content Pane: Subscribers */}
        {activeTab === "subscribers" && (
          <div className="bg-white rounded-2xl border border-[#E5E6E8] shadow-2xs p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E6E8]">
              <div>
                <h3 className="text-base font-bold text-[#000000]">Active Subscribers</h3>
                <p className="text-xs text-[#707070]">Readers who opted in for daily email dispatches.</p>
              </div>
              <button
                onClick={exportSubscribersCSV}
                className="px-4 py-2 border border-[#DFDFDF] hover:border-[#000000] text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E6E8]">
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Subscribed Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E6E8]">
                  {subscribers.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-[#000000]">{sub.email}</td>
                      <td className="py-3 px-4 text-[#707070]">{sub.subscribedAt}</td>
                      <td className="py-3 px-4">
                        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Active
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

      {/* Publish Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5E6E8]">
              <div>
                <span className="text-[11px] font-bold text-[#C61D1F] uppercase tracking-wider block">
                  New Publication
                </span>
                <h3 className="text-xl font-extrabold text-[#000000]">
                  Publish Story to The Zango
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

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
                  <label className="block font-bold text-[#000000] uppercase mb-1.5">Beat / Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    <option value="Business">Business</option>
                    <option value="Technology">Technology</option>
                    <option value="News">News</option>
                    <option value="Features">Features</option>
                    <option value="Opinion">Opinion</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Sports">Sports</option>
                    <option value="Politics">Politics</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Health">Health</option>
                    <option value="Education">Education</option>
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
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Excerpt / Lead</label>
                <textarea
                  rows={2}
                  placeholder="Brief 2-line hook for homepage cards..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#000000] uppercase mb-1.5">Article Content *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Full story text. Markdown headings like ### Subheading supported..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded-sm text-[#C61D1F] focus:ring-[#C61D1F]"
                  />
                  <span className="font-semibold text-[#111111]">Feature on Homepage Hero</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="rounded-sm text-[#C61D1F] focus:ring-[#C61D1F]"
                  />
                  <span className="font-semibold text-[#111111]">Pin in Trending Section</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#E5E6E8] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-[#DFDFDF] rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Publish Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
