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
  Mail,
  Sliders,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth, UserRole } from "@/context/auth-context";
import { Article, Subscriber, Submission, NewsroomMember, NewsroomRole, Category } from "@/types";
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
  rejectSubmission,
  requestRevisionSubmission,
  updateSubmission
} from "@/lib/firebase/db";
import { CATEGORIES } from "@/data/mock-articles";
import ImageUploader from "@/components/image-uploader";
import RichEditor from "@/components/rich-editor";

function AdminDashboardContent() {
  const router = useRouter();
  const { user, role, logout, switchRole, updateUser, isAuthenticated, isLoading } = useAuth();

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

  // Revision request modal state
  const [revisionModalSub, setRevisionModalSub] = useState<Submission | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");

  // Executive Profile & Settings state
  const [profileName, setProfileName] = useState(user?.name || "Usman Bello");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || "/assets/social-image-1.png");
  const [profileBio, setProfileBio] = useState(user?.bio || "Chief Executive & Bureau Chief with 15+ years in Sahelian socio-political investigative reporting.");
  const [profileDesk, setProfileDesk] = useState(user?.desk || "Executive & Investigation");

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "Usman Bello");
      setProfileAvatar(user.avatar || "/assets/social-image-1.png");
      setProfileBio(user.bio || "Chief Executive & Bureau Chief with 15+ years in Sahelian socio-political investigative reporting.");
      setProfileDesk(user.desk || "Executive & Investigation");
    }
  }, [user]);

  // Dynamic Desks, Tags & Slug state
  const [desksList, setDesksList] = useState<Category[]>(CATEGORIES);
  const [availableTags, setAvailableTags] = useState<{ tag: string; count: number }[]>([]);
  const [slugAvailability, setSlugAvailability] = useState<{
    available?: boolean;
    message?: string;
    suggestedSlug?: string;
    checking?: boolean;
  } | null>(null);

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
    tags: "Northern Nigeria, Business",
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
    try {
      const [artsRes, subsRes, queueRes, metsRes, staffRes, desksRes, tagsRes] = await Promise.all([
        fetch("/api/admin/articles").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/subscribers").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/submissions").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/metrics").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/staff").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/desks").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/tags").then((r) => r.json()).catch(() => null),
      ]);

      if (desksRes?.success && desksRes.desks) setDesksList(desksRes.desks);
      if (tagsRes?.success && tagsRes.tags) setAvailableTags(tagsRes.tags);

      if (artsRes?.success && artsRes.articles) {
        setArticles(artsRes.articles);
      } else {
        const arts = await getArticles();
        setArticles([...arts]);
      }

      if (subsRes?.success && subsRes.subscribers) {
        setSubscribers(subsRes.subscribers);
      } else {
        const subs = await getSubscribers();
        setSubscribers([...subs]);
      }

      if (queueRes?.success && queueRes.submissions) {
        setSubmissions(queueRes.submissions);
      } else {
        const subsQueue = await getSubmissions();
        setSubmissions([...subsQueue]);
      }

      if (staffRes?.success && staffRes.members) {
        setTeamMembers(staffRes.members);
      } else {
        const members = await getTeamMembers();
        setTeamMembers([...members]);
      }

      if (metsRes?.success && metsRes.metrics) {
        setMetrics({
          totalArticles: metsRes.metrics.totalArticles,
          totalViews: metsRes.metrics.totalViews,
          totalSubscribers: metsRes.metrics.totalSubscribers,
          draftCount: metsRes.metrics.draftCount,
        });
      } else {
        const mets = await getPlatformMetrics();
        setMetrics({
          totalArticles: mets.totalArticles,
          totalViews: mets.totalViews,
          totalSubscribers: mets.totalSubscribers,
          draftCount: mets.draftCount,
        });
      }
    } catch (e) {
      console.error("loadData error, falling back to local db:", e);
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
    }
  };

  useEffect(() => {
    loadData();
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
      if (data.success) {
        setSlugAvailability({
          available: data.available,
          message: data.message,
          suggestedSlug: data.suggestedSlug,
          checking: false,
        });
      }
    } catch {
      setSlugAvailability(null);
    }
  };

  const handleHeadlineChange = (newTitle: string) => {
    const autoSlug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // If user hasn't typed a custom slug or it's a new article, keep slug in sync
    if (!editingArticle || formData.slug === "") {
      setFormData((prev) => ({ ...prev, title: newTitle, slug: autoSlug }));
      checkSlugAvailability(autoSlug);
    } else {
      setFormData((prev) => ({ ...prev, title: newTitle }));
    }
  };

  const handleContentChange = (html: string) => {
    const cleanText = html.replace(/<[^>]*>/g, " ");
    const words = cleanText.split(/\s+/).filter(Boolean).length;
    const computedRead = `${Math.max(1, Math.ceil(words / 200))} min read`;
    setFormData((prev) => ({
      ...prev,
      content: html,
      readTime: computedRead,
    }));
  };

  const handleToggleFlag = async (id: string, flag: "isFeatured" | "isTrending" | "isEditorsPick" | "isLatest") => {
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleFlag", flag }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        triggerToast(`Updated ${flag} status for dispatch.`);
        return;
      }
    } catch {
      // fallback
    }
    const updated = await toggleArticleFlag(id, flag);
    if (updated) {
      await loadData();
      triggerToast(`Updated ${flag} status for "${updated.title.slice(0, 25)}..."`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          await loadData();
          triggerToast(`Story "${title.slice(0, 25)}..." deleted.`);
          return;
        }
      } catch {
        // fallback
      }
      await deleteArticle(id);
      await loadData();
      triggerToast(`Story "${title.slice(0, 25)}..." deleted.`);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name.trim() || !newMemberForm.email.trim()) return;
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemberForm),
      });
      const data = await res.json();
      if (data.success) {
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
        return;
      }
    } catch {
      // fallback
    }
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
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        triggerToast("Updated role for " + name + " to " + targetRole.toUpperCase());
        return;
      }
    } catch {
      // fallback
    }
    await updateTeamMemberRole(id, targetRole);
    await loadData();
    triggerToast("Updated role for " + name + " to " + targetRole.toUpperCase());
  };

  const handleToggleMemberStatus = async (id: string, currentStatus: "active" | "inactive", name: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        triggerToast(name + " status updated to " + nextStatus);
        return;
      }
    } catch {
      // fallback
    }
    await updateTeamMemberStatus(id, nextStatus);
    await loadData();
    triggerToast(name + " status updated to " + nextStatus);
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (confirm("Are you sure you want to remove " + name + " from newsroom staff?")) {
      try {
        const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          await loadData();
          triggerToast("Removed " + name + " from newsroom roster.");
          return;
        }
      } catch {
        // fallback
      }
      await deleteTeamMember(id);
      await loadData();
      triggerToast("Removed " + name + " from newsroom roster.");
    }
  };

  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    setSlugAvailability(null);
    setFormData({
      title: article.title,
      slug: article.slug,
      category: article.category,
      coverImage: article.coverImage,
      excerpt: article.excerpt,
      content: article.content,
      authorName: article.author.name,
      readTime: article.readTime,
      tags: article.tags ? article.tags.join(", ") : "Northern Nigeria",
      isFeatured: !!article.isFeatured,
      isTrending: !!article.isTrending,
      isEditorsPick: !!article.isEditorsPick,
      isLatest: !!article.isLatest,
    });
    setShowCreateModal(true);
  };

  const handleOpenCreateModal = () => {
    setEditingArticle(null);
    setSlugAvailability(null);
    setFormData({
      title: "",
      slug: "",
      category: "Business",
      coverImage: "/assets/hero-featured.jpg",
      excerpt: "",
      content: "",
      authorName: user?.name || "The Zango Bureau",
      readTime: "4 min read",
      tags: "Northern Nigeria, Economy",
      isFeatured: false,
      isTrending: false,
      isEditorsPick: false,
      isLatest: false,
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

    const parsedTags = formData.tags
      ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : ["Northern Nigeria"];

    if (editingArticle) {
      try {
        const res = await fetch(`/api/admin/articles/${editingArticle.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            slug,
            category: formData.category,
            coverImage: formData.coverImage,
            excerpt: formData.excerpt,
            content: formData.content,
            authorName: formData.authorName,
            readTime: formData.readTime,
            isFeatured: formData.isFeatured,
            isTrending: formData.isTrending,
            isEditorsPick: formData.isEditorsPick,
            isLatest: formData.isLatest,
            tags: parsedTags,
          }),
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Updated dispatch: "${formData.title.slice(0, 30)}..."`);
          await loadData();
          setShowCreateModal(false);
          setEditingArticle(null);
          return;
        }
      } catch {
        // fallback
      }
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
        tags: parsedTags,
        isFeatured: formData.isFeatured,
        isTrending: formData.isTrending,
        isEditorsPick: formData.isEditorsPick,
        isLatest: formData.isLatest,
      });
      triggerToast(`Updated dispatch: "${formData.title.slice(0, 30)}..."`);
    } else {
      try {
        const res = await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            slug,
            category: formData.category,
            coverImage: formData.coverImage || "/assets/hero-featured.jpg",
            excerpt: formData.excerpt || "Editorial dispatch from The Zango Bureau...",
            content: formData.content || formData.title,
            authorName: formData.authorName,
            readTime: formData.readTime || "4 min read",
            isFeatured: formData.isFeatured,
            isTrending: formData.isTrending,
            isEditorsPick: formData.isEditorsPick,
            isLatest: formData.isLatest,
            tags: parsedTags,
          }),
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Published new dispatch: "${formData.title.slice(0, 30)}..."`);
          await loadData();
          setShowCreateModal(false);
          setEditingArticle(null);
          return;
        }
      } catch {
        // fallback
      }
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
        tags: parsedTags,
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
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        triggerToast(`Approved and published: "${title.slice(0, 30)}..."`);
        return;
      }
    } catch {
      // fallback
    }
    const published = await approveSubmission(id);
    if (published) {
      await loadData();
      triggerToast(`Approved and published: "${title.slice(0, 30)}..."`);
    }
  };

  const handleRejectSubmission = async (id: string, title: string) => {
    if (confirm(`Reject submission "${title}"?`)) {
      try {
        const res = await fetch(`/api/admin/submissions/${id}`, {
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
      } catch {
        // fallback
      }
      await rejectSubmission(id);
      await loadData();
      triggerToast(`Rejected submission: "${title.slice(0, 30)}..."`);
    }
  };

  const handleOpenEditSubmission = (sub: Submission) => {
    setEditingArticle(null);
    setSlugAvailability(null);
    setFormData({
      title: sub.title,
      slug: sub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      category: sub.category,
      coverImage: sub.coverImage || "/assets/hero-featured.jpg",
      excerpt: sub.excerpt,
      content: sub.content,
      authorName: sub.authorName,
      readTime: sub.readTime,
      tags: "Northern Nigeria, Investigation",
      isFeatured: false,
      isTrending: false,
      isEditorsPick: false,
      isLatest: true,
    });
    setShowCreateModal(true);
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalSub || !revisionNotes.trim()) return;
    try {
      const res = await fetch(`/api/admin/submissions/${revisionModalSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revision", feedbackNotes: revisionNotes.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setRevisionModalSub(null);
        setRevisionNotes("");
        triggerToast("Revision feedback delivered to writer!");
        return;
      }
    } catch {
      // fallback
    }
    await requestRevisionSubmission(revisionModalSub.id, revisionNotes.trim());
    await loadData();
    setRevisionModalSub(null);
    setRevisionNotes("");
    triggerToast("Revision feedback delivered to writer!");
  };

  const handleSaveProfile = () => {
    updateUser({
      name: profileName,
      avatar: profileAvatar,
      bio: profileBio,
      desk: profileDesk,
    });
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.email === user?.email
          ? { ...m, name: profileName, avatar: profileAvatar, bio: profileBio, desk: profileDesk }
          : m
      )
    );
    triggerToast("Admin profile byline and photo saved successfully!");
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

  const pendingSubmissions = submissions.filter((s) => s.status === "pending" || s.status === "needs_revision");
  const leadFeaturedArticle = articles.find((a) => a.isFeatured) || articles[0];

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans selection:bg-[#C61D1F]/15 selection:text-[#C61D1F]">
      
      {/* 1. TOP HEADER (Modern, Glassmorphic, Elevated) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          
          {/* Left: Brand Identity & Quick Navigation */}
          <div className="flex items-center space-x-5">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative w-32 h-8">
                <Image
                  src="/assets/logo.png"
                  alt="The Zango"
                  fill
                  sizes="130px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="hidden sm:inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-red-50 text-[#C61D1F] border border-red-100">
                CHIEF CMS
              </span>
            </Link>

            {/* Quick Live Operational Status */}
            <div className="hidden xl:flex items-center space-x-2 pl-4 border-l border-slate-200 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>11 Regional Desks Active</span>
            </div>
          </div>

          {/* Center: Global Quick Search Input */}
          <div className="hidden md:flex items-center relative w-72 lg:w-96">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search stories, journalists, desks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-14 py-2 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden bg-slate-50/70 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-400 bg-slate-100/90 border border-slate-200/90 px-1.5 py-0.5 rounded-md tracking-wider">
                ⌘K
              </span>
            )}
          </div>

          {/* Right: Actions, Notifications & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Global Quick Action: Direct + New Story Button */}
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs hover:shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
              title="Publish New Story Dispatch"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Dispatch</span>
            </button>

            {/* Notification Bell with Review Queue indicator */}
            <button 
              onClick={() => setActiveTab("reviewQueue")}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Editorial Review Queue"
            >
              <Bell className="w-4 h-4" />
              {pendingSubmissions.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C61D1F] ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 shadow-2xs shrink-0">
                <Image
                  src={user?.avatar || "/assets/social-image-1.png"}
                  alt={user?.name || "Usman Bello"}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="font-extrabold text-xs text-slate-900 leading-tight">
                  {user?.name || "Usman Bello"}
                </div>
                <div className="text-[9px] font-extrabold uppercase text-[#C61D1F] tracking-wider">
                  {user?.badge || "CHIEF ADMIN"}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN DASHBOARD BODY (Sidebar + Workspace Canvas) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1 flex flex-col md:flex-row items-start gap-6">
        
        {/* LEFT COMPACT ROUNDED SIDEBAR */}
        <aside className="w-full md:w-60 lg:w-64 shrink-0 bg-white rounded-3xl p-3 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4">
          
          {/* Group 1: CORE WORKSPACE */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Core Newsroom
            </span>

            {/* Sidebar Item 1: Overview */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#C61D1F] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "dispatches"
                  ? "bg-[#C61D1F] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Story Dispatches</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "dispatches" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {articles.length}
              </span>
            </button>

            {/* Sidebar Item 3: Review Queue */}
            <button
              onClick={() => setActiveTab("reviewQueue")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "reviewQueue"
                  ? "bg-[#C61D1F] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Inbox className="w-4 h-4 shrink-0" />
                <span>Review Queue</span>
              </div>
              {pendingSubmissions.length > 0 ? (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === "reviewQueue" ? "bg-white text-[#C61D1F]" : "bg-amber-100 text-amber-900 border border-amber-200"
                }`}>
                  {pendingSubmissions.length}
                </span>
              ) : (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === "reviewQueue" ? "bg-white/20 text-white" : "text-slate-400"
                }`}>
                  0
                </span>
              )}
            </button>
          </div>

          {/* Group 2: STAFF & REGIONAL DESKS */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Staff & Beats
            </span>

            {/* Sidebar Item 4: Newsroom Staff (All Members) */}
            <button
              onClick={() => {
                setActiveTab("team");
                setTeamFilter("all");
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "team" && !showTeamModal
                  ? "bg-[#C61D1F] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>Newsroom Staff</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "team" && !showTeamModal ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {teamMembers.length}
              </span>
            </button>

            {/* Sidebar Item 4b: Quick + Create Staff */}
            <button
              onClick={() => {
                setActiveTab("team");
                setShowTeamModal(true);
              }}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-[#C61D1F] bg-red-50/70 hover:bg-red-100/90 transition-all border border-red-200/70 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>+ Add Newsroom Staff</span>
            </button>

            {/* Sidebar Item 5: Desk Taxonomy */}
            <button
              onClick={() => setActiveTab("desks")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "desks"
                  ? "bg-[#C61D1F] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Desk Taxonomy</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "desks" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                11
              </span>
            </button>
          </div>

          {/* Group 3: PREFERENCES & AUDIENCE */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Audience & Platform
            </span>

            {/* Sidebar Item 6: Newsletter Subscribers */}
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "subscribers"
                  ? "bg-[#C61D1F] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 shrink-0" />
                <span>Newsletter Roster</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "subscribers" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {subscribers.length}
              </span>
            </button>

            {/* Sidebar Item 7: Account Settings */}
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#C61D1F] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <div className="flex items-center space-x-3">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Bureau Settings</span>
              </div>
            </button>
          </div>

          {/* Quick Persona Info Pill */}
          <div className="pt-3 border-t border-slate-100">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase tracking-wider text-slate-400 text-[9px]">Root Clearance</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="font-bold text-slate-800 truncate">{user?.name || "Usman Bello"}</div>
              <div className="flex items-center justify-between text-slate-500 pt-0.5">
                <Link href="/dashboard/editor" className="hover:text-[#C61D1F] transition-colors font-medium">
                  Editor Portal →
                </Link>
                <Link href="/dashboard/author" className="hover:text-[#C61D1F] transition-colors font-medium">
                  Writer Studio →
                </Link>
              </div>
            </div>
          </div>

        </aside>

        {/* RIGHT WORKSPACE CANVAS */}
        <main className="flex-1 w-full space-y-6">

          {/* Smooth Toast Notification */}
          {notification && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{notification}</span>
              </div>
              <button 
                onClick={() => setNotification(null)} 
                className="text-emerald-700 hover:text-emerald-900 p-1"
              >
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
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  👑 Switch to Chief Admin
                </button>
                <Link
                  href="/dashboard/author"
                  className="px-4 py-2 bg-[#C61D1F] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs hover:bg-[#A51719] transition-colors shrink-0 text-center"
                >
                  Writer Studio →
                </Link>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW (Modern Command Center) */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Executive Welcome Hero Banner */}
              <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#1c0809] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Background ambient lighting */}
                <div className="absolute -right-8 -bottom-8 w-80 h-80 bg-[#C61D1F]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-3 z-10 max-w-xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-sm border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Sahelian & Northern Nigeria Editorial Cycle</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome back, {user?.name ? user.name.split(" ")[0] : "Usman"}
                  </h2>
                  
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    You're overseeing 11 active regional desks with high publishing velocity across Kano, Kaduna, Maiduguri, and Sokoto bureaus.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleOpenCreateModal}
                      className="px-5 py-2.5 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Publish Story</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("reviewQueue")}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer flex items-center space-x-2"
                    >
                      <span>Review Manuscripts</span>
                      {pendingSubmissions.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#C61D1F] text-white text-[10px] font-extrabold flex items-center justify-center">
                          {pendingSubmissions.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Circular Throughput Ring */}
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
                        strokeDashoffset={2 * Math.PI * 40 * (1 - 0.84)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl sm:text-2xl font-extrabold text-white">84%</span>
                      <span className="text-[9px] font-extrabold uppercase text-slate-300 tracking-wider">Clearance</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 4 Sleek Micro-Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Metric 1 */}
                <div 
                  onClick={() => setActiveTab("dispatches")}
                  className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Published Stories
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {articles.length}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Across all 11 beats</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div 
                  onClick={() => setActiveTab("reviewQueue")}
                  className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Inbox className="w-5 h-5" />
                    </div>
                    {pendingSubmissions.length > 0 ? (
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                        Action needed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Cleared
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Review Queue
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {pendingSubmissions.length}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Writer manuscripts</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div 
                  onClick={() => setActiveTab("subscribers")}
                  className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      +18% M/M
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Verified Readers
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {metrics.totalSubscribers}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Daily Briefing Roster</span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div 
                  onClick={() => setActiveTab("team")}
                  className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      Staff
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Newsroom Staff
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {teamMembers.length}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Admins, Editors & Writers</span>
                  </div>
                </div>

              </div>

              {/* URGENT REVIEW ALERT BANNER (Shows only if pending submissions exist) */}
              {pendingSubmissions.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {pendingSubmissions.length} Manuscript{pendingSubmissions.length > 1 ? "s" : ""} Awaiting Editorial Clearance
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Latest submission: <span className="font-semibold text-slate-900">"{pendingSubmissions[0].title}"</span> by {pendingSubmissions[0].authorName}.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("reviewQueue")}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    Open Review Queue →
                  </button>
                </div>
              )}

              {/* FEATURED LEAD DISPATCH SPOTLIGHT */}
              {leadFeaturedArticle && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Active Lead Headline Dispatch
                    </span>
                    <Link
                      href={`/article/${leadFeaturedArticle.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-[#C61D1F] hover:underline flex items-center space-x-1"
                    >
                      <span>View Live On Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-6">
                    <div className="relative w-full md:w-64 h-44 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-2xs">
                      <Image
                        src={leadFeaturedArticle.coverImage}
                        alt={leadFeaturedArticle.title}
                        fill
                        priority
                        sizes="260px"
                        className="object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-[#C61D1F] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-xs">
                        {leadFeaturedArticle.category}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-left">
                      <div className="text-[11px] font-semibold text-slate-400">
                        Lead Headline • {leadFeaturedArticle.publishedAt} • {leadFeaturedArticle.readTime}
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 hover:text-[#C61D1F] transition-colors line-clamp-2">
                        {leadFeaturedArticle.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {leadFeaturedArticle.excerpt}
                      </p>

                      <div className="pt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                            {leadFeaturedArticle.author.name.charAt(0)}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{leadFeaturedArticle.author.name}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(leadFeaturedArticle)}
                            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Dispatch</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dual Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setActiveTab("dispatches")}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-[#C61D1F] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 group-hover:text-[#C61D1F]">
                      Manage All Dispatches ({articles.length})
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#C61D1F] group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-slate-600">
                    Review and modify headlines, hero display tags, and category beats across 11 Northern Nigeria desks.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab("team")}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-[#C61D1F] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 group-hover:text-[#C61D1F]">
                      Newsroom Personnel Roster ({teamMembers.length})
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#C61D1F] group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-slate-600">
                    Configure staff permissions, assign beat divisions, and invite regional correspondents.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DISPATCHES (Story Management Catalog) */}
          {activeTab === "dispatches" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter stories by headline, author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#C61D1F] focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>

                {/* Desk Selector & Add Story */}
                <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#C61D1F] focus:outline-hidden bg-white cursor-pointer font-medium"
                  >
                    <option value="all">All Desks (11)</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Publish</span>
                  </button>
                </div>

              </div>

              {/* Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="py-3.5 px-6">Story Dispatch</th>
                        <th className="py-3.5 px-6">Desk / Category</th>
                        <th className="py-3.5 px-6">Author Byline</th>
                        <th className="py-3.5 px-6">Placements & Badges</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredArticles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500">
                            No published dispatches match your filter query.
                          </td>
                        </tr>
                      ) : (
                        filteredArticles.map((article) => (
                          <tr key={article.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3.5">
                                <div className="relative w-14 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                                  <Image
                                    src={article.coverImage}
                                    alt={article.title}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="max-w-md">
                                  <div className="font-bold text-slate-900 line-clamp-1 hover:text-[#C61D1F] transition-colors">
                                    {article.title}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {article.publishedAt} • {article.readTime}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                                {article.category}
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              <span className="font-medium text-slate-800">{article.author.name}</span>
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  onClick={() => handleToggleFlag(article.id, "isFeatured")}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                    article.isFeatured
                                      ? "bg-red-600 text-white"
                                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                  }`}
                                  title="Toggle Lead Hero Headline"
                                >
                                  Hero
                                </button>

                                <button
                                  onClick={() => handleToggleFlag(article.id, "isTrending")}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                    article.isTrending
                                      ? "bg-amber-500 text-white"
                                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                  }`}
                                  title="Toggle Trending Velocity"
                                >
                                  Trending
                                </button>

                                <button
                                  onClick={() => handleToggleFlag(article.id, "isEditorsPick")}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                    article.isEditorsPick
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                  }`}
                                  title="Toggle Editor's Pick"
                                >
                                  Pick
                                </button>

                                <button
                                  onClick={() => handleToggleFlag(article.id, "isLatest")}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                    article.isLatest
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                  }`}
                                  title="Toggle Latest News Stream"
                                >
                                  Latest
                                </button>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  href={`/article/${article.slug}`}
                                  target="_blank"
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="View Live Public Article"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>

                                <button
                                  onClick={() => handleOpenEdit(article)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Dispatch"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDelete(article.id, article.title)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Dispatch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                    Author Submissions & Review Queue ({pendingSubmissions.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify manuscripts submitted by regional correspondents before publishing live.
                  </p>
                </div>
              </div>

              {pendingSubmissions.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Editorial Queue All Cleared</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    All contributing manuscripts have been evaluated, edited, or published live.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="bg-red-50 text-[#C61D1F] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                            {sub.category}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500">{sub.submittedAt}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500">{sub.wordCount} words</span>
                        </div>

                        {sub.status === "needs_revision" ? (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-amber-300">
                            ⚠️ Needs Revision
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-amber-200">
                            Pending Clearance
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">{sub.title}</h4>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{sub.excerpt}</p>
                      </div>

                      {/* Feedback Note if present */}
                      {sub.feedbackNotes && (
                        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 space-y-1">
                          <span className="font-extrabold uppercase text-[10px] tracking-wider text-amber-800 block">
                            Editorial Revision Notes Sent to Author:
                          </span>
                          <p className="italic">{sub.feedbackNotes}</p>
                        </div>
                      )}

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 max-h-40 overflow-y-auto">
                        <div className="font-bold text-slate-900 mb-1">Manuscript Preview:</div>
                        <div className="line-clamp-4">{sub.content.replace(/<[^>]*>/g, " ")}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs">
                          <span className="font-bold text-slate-900">{sub.authorName}</span>
                          {sub.authorEmail && <span className="text-slate-400 ml-1.5">({sub.authorEmail})</span>}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleOpenEditSubmission(sub)}
                            className="px-3 py-1.5 border border-slate-200 hover:border-slate-800 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 bg-white shadow-2xs"
                            title="Edit manuscript copy before publishing"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Preview & Edit Copy</span>
                          </button>

                          <button
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
                            onClick={() => handleRejectSubmission(sub.id, sub.title)}
                            className="px-3 py-1.5 border border-slate-200 hover:border-red-600 hover:text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>

                          <button
                            onClick={() => handleApproveSubmission(sub.id, sub.title)}
                            className="px-4 py-1.5 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
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
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-4 bg-[#C61D1F] rounded-xs inline-block" />
                      <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                        Newsroom Personnel & Staff Architecture
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Enterprise Multi-Staff System: assign multiple Chief Admins, Desk Editors, and field correspondents.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowTeamModal(true)}
                    className="px-4 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center space-x-2 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Staff Member</span>
                  </button>
                </div>

                {/* Search & Multi-Staff Role Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                  {/* Role Filter Tabs */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setTeamFilter("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        teamFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      All Staff ({teamMembers.length})
                    </button>

                    <button
                      onClick={() => setTeamFilter("admin")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        teamFilter === "admin" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      👑 Chief Admins ({teamMembers.filter(m => m.role === "admin").length})
                    </button>

                    <button
                      onClick={() => setTeamFilter("editor")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        teamFilter === "editor" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      ✍️ Desk Editors ({teamMembers.filter(m => m.role === "editor").length})
                    </button>

                    <button
                      onClick={() => setTeamFilter("writer")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        teamFilter === "writer" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      📝 Staff Writers ({teamMembers.filter(m => m.role === "writer").length})
                    </button>
                  </div>

                  {/* Search Staff Input */}
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search staff by name or email..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#C61D1F] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Team Roster Table */}
                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="py-3.5 px-6">Journalist & Byline</th>
                        <th className="py-3.5 px-6">Assigned Desk</th>
                        <th className="py-3.5 px-6">Role Clearance</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {teamMembers
                        .filter(m => teamFilter === "all" || m.role === teamFilter)
                        .filter(m => 
                          staffSearchQuery === "" ||
                          m.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                          m.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                          m.desk.toLowerCase().includes(staffSearchQuery.toLowerCase())
                        )
                        .map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                <Image
                                  src={member.avatar || "/assets/social-image-1.png"}
                                  alt={member.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                                <div className="text-[11px] text-slate-400">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
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
                              {(member.email === "usman.bello@thezango.org" || member.id === "usr-admin-1" || member.id === "member-1" || member.email === user?.email) ? (
                                <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md font-extrabold text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-2xs">
                                  <span>🔒 Permanent Bureau Chief</span>
                                </span>
                              ) : (
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateRole(member.id, e.target.value as NewsroomRole, member.name)}
                                  className="bg-white border border-slate-200 hover:border-slate-800 text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="editor">Editor</option>
                                  <option value="writer">Writer</option>
                                </select>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {(member.email === "usman.bello@thezango.org" || member.id === "usr-admin-1" || member.id === "member-1" || member.email === user?.email) ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ● Always Active
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleMemberStatus(member.id, member.status, member.name)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                                  member.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                ● {member.status}
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {(member.email === "usman.bello@thezango.org" || member.id === "usr-admin-1" || member.id === "member-1" || member.email === user?.email) ? (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Root Admin</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteMember(member.id, member.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove staff member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                    Editorial Desks & Beats ({CATEGORIES.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    The 11 core newsroom divisions covering Northern Nigeria and the Sahel corridor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORIES.map((desk) => (
                  <div
                    key={desk.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-2 hover:border-[#C61D1F] transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-[#C61D1F] transition-colors">{desk.name}</span>
                      <span className="bg-red-50 text-[#C61D1F] text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                        {desk.count} stories
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{desk.description}</p>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
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

          {/* TAB 6: ACCOUNT & BUREAU SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-slate-200/80">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  Executive Admin Profile & Bureau Settings
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your credentials, official newsroom identity, and editorial alert preferences.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Executive Avatar Picture Uploader */}
                  <div>
                    <ImageUploader
                      value={profileAvatar}
                      onChange={(url) => setProfileAvatar(url)}
                      label="Executive Profile Picture / Avatar"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Official Byline Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#C61D1F] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Bureau Email</label>
                    <input
                      type="email"
                      value={user?.email || "usman.bello@thezango.org"}
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Clearance Role</label>
                    <input
                      type="text"
                      value="Chief Administrator / Bureau Chief (Full Access)"
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Assigned Desk / Bureau Beat</label>
                    <select
                      value={profileDesk}
                      onChange={(e) => setProfileDesk(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#C61D1F] focus:outline-hidden bg-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                      <option value="Executive & Investigation">Executive & Investigation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Journalist Biography (Shown to Readers)</label>
                    <textarea
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Brief background on journalistic coverage across Northern Nigeria & Sahel..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden resize-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      This biography and photo will appear under "About the Author" on all articles you publish.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Editorial Notifications</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-[#C61D1F] focus:ring-[#C61D1F]" />
                        <span>Email alert whenever a correspondent submits a pitch</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-[#C61D1F] focus:ring-[#C61D1F]" />
                        <span>Daily subscriber briefing summary at 6:00 AM</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: NEWSLETTER ROSTER */}
          {activeTab === "subscribers" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] animate-in fade-in duration-200">
              <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    The Zango Brief Subscribers ({subscribers.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified readers subscribed to morning dispatches.
                  </p>
                </div>

                <button
                  onClick={exportSubscribersCSV}
                  className="px-4 py-2 bg-slate-900 hover:bg-[#C61D1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center space-x-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <th className="py-3.5 px-6">Subscriber Email</th>
                      <th className="py-3.5 px-6">Subscribed Date</th>
                      <th className="py-3.5 px-6 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {subscribers.map((sub, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-slate-900">{sub.email}</td>
                        <td className="py-3.5 px-6 text-slate-500">{sub.subscribedAt}</td>
                        <td className="py-3.5 px-6 text-right">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
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

      {/* 3. MODALS */}
      
      {/* Story Publishing / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Pinned Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 shrink-0 bg-white">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-wide">
                  {editingArticle ? "Edit Story Dispatch" : "Publish New Story Dispatch"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingArticle(null);
                }}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="story-dispatch-form" onSubmit={handleCreateSubmit} className="overflow-y-auto flex-1 p-6 space-y-5 text-xs overscroll-contain">
              
              {/* Headline */}
              <div>
                <label className="block font-bold text-slate-900 uppercase mb-1.5">Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kano Agritech Hub Secures $1.5M Seed Round"
                  value={formData.title}
                  onChange={(e) => handleHeadlineChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-sm focus:outline-hidden"
                />
              </div>

              {/* Dynamic Live Slug & Availability Checker */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-bold text-slate-700 uppercase text-[11px]">
                    URL Slug & Public Link
                  </label>
                  {slugAvailability?.checking && (
                    <span className="text-[10px] text-slate-400 font-semibold animate-pulse">
                      Validating slug...
                    </span>
                  )}
                  {slugAvailability?.available === true && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <span>✓ URL available</span>
                    </span>
                  )}
                  {slugAvailability?.available === false && (
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        ⚠️ Already in use
                      </span>
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
                          Use "{slugAvailability.suggestedSlug}"
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#C61D1F]">
                  <span className="px-3 text-slate-400 text-xs font-mono select-none bg-slate-50 border-r border-slate-200 py-2">
                    /article/
                  </span>
                  <input
                    type="text"
                    placeholder="custom-story-slug"
                    value={formData.slug}
                    onChange={(e) => {
                      const val = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]+/g, "");
                      setFormData((prev) => ({ ...prev, slug: val }));
                      checkSlugAvailability(val);
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Desk, Author Byline & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dynamic Desks */}
                <div>
                  <label className="block font-bold text-slate-900 uppercase mb-1.5">Beat / Desk ({desksList.length})</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    {desksList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Author Byline from Staff Roster */}
                <div>
                  <label className="block font-bold text-slate-900 uppercase mb-1.5">Author Byline</label>
                  <input
                    type="text"
                    list="author-byline-options"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="Select or enter byline..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden"
                  />
                  <datalist id="author-byline-options">
                    <option value="The Zango Bureau" />
                    {user?.name && <option value={user.name} />}
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.name} label={`${m.name} (${m.role.toUpperCase()})`} />
                    ))}
                  </datalist>
                </div>

                {/* Auto-computed Read Time */}
                <div>
                  <label className="block font-bold text-slate-900 uppercase mb-1.5">Estimated Read Time</label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Story Tags / Keywords */}
              <div>
                <label className="block font-bold text-slate-900 uppercase mb-1.5">
                  Story Tags & Topics (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Northern Nigeria, Kano, Venture Capital, Agribusiness"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden"
                />
                {availableTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Popular Beats:
                    </span>
                    {availableTags.slice(0, 8).map((t) => (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => {
                          const current = formData.tags ? formData.tags.split(",").map((s) => s.trim()) : [];
                          if (!current.includes(t.tag)) {
                            const updated = [...current, t.tag].filter(Boolean).join(", ");
                            setFormData((prev) => ({ ...prev, tags: updated }));
                          }
                        }}
                        className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors"
                      >
                        + {t.tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Cover Image Uploader */}
              <ImageUploader
                label="Story Cover Image (Upload from device or select editorial stock)"
                value={formData.coverImage}
                onChange={(url) => setFormData({ ...formData, coverImage: url })}
              />

              <div>
                <label className="block font-bold text-slate-900 uppercase mb-1.5">Lead Excerpt</label>
                <textarea
                  rows={2}
                  placeholder="Short 2-line summary for front page cards and search snippets..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 uppercase mb-2">Story Manuscript Body (WYSIWYG Rich Editor) *</label>
                <RichEditor
                  value={formData.content}
                  onChange={handleContentChange}
                  placeholder="Draft full longform article content. Use the editor toolbar for formatting, tables, images, and video/tweet embeds..."
                  height={340}
                />
              </div>

              {/* Publication Flags */}
              <div className="pt-3 border-t border-slate-200/80">
                <span className="block font-bold text-slate-900 uppercase mb-2">Editorial Display Placements</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-slate-800">Hero Headline</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isLatest}
                      onChange={(e) => setFormData({ ...formData, isLatest: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-slate-800">Latest Breaking</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isTrending}
                      onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-slate-800">Trending Velocity</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isEditorsPick}
                      onChange={(e) => setFormData({ ...formData, isEditorsPick: e.target.checked })}
                      className="rounded text-[#C61D1F] focus:ring-[#C61D1F]"
                    />
                    <span className="font-semibold text-slate-800">Editor's Pick</span>
                  </label>
                </div>
              </div>

            </form>

            {/* Pinned Sticky Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 shrink-0 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {editingArticle ? "Editing: " + editingArticle.title.slice(0, 30) + "..." : "Live Publishing Clearance"}
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingArticle(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-800 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="story-dispatch-form"
                  className="px-6 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 shrink-0 bg-white">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  Add Newsroom Staff Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="team-member-form" onSubmit={handleAddTeamMember} className="overflow-y-auto flex-1 p-6 space-y-4 text-xs overscroll-contain">
              <div>
                <label className="block font-bold text-slate-900 uppercase mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zainab Aliyu"
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 uppercase mb-1.5">Corporate / Journalist Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zainab.aliyu@thezango.org"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-sm focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-900 uppercase mb-1.5">Newsroom Role *</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as NewsroomRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    <option value="writer">Staff Writer (Submit Manuscripts)</option>
                    <option value="editor">Desk Editor (Review & Publish)</option>
                    <option value="admin">Chief Admin (Full Access & CMS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 uppercase mb-1.5">Assigned Desk / Beat *</label>
                  <select
                    value={newMemberForm.desk}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, desk: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="Executive & Investigation">Executive & Investigation</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUploader
                  value={newMemberForm.avatar}
                  onChange={(url) => setNewMemberForm({ ...newMemberForm, avatar: url })}
                  label="Journalist Profile Picture / Avatar"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 uppercase mb-1.5">Journalist Bio</label>
                <textarea
                  rows={3}
                  placeholder="Brief editorial background, focus areas, and geographic beat coverage..."
                  value={newMemberForm.bio}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs focus:outline-hidden resize-none"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-200/80 shrink-0 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Newsroom Staff Clearance</span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-800 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="team-member-form"
                  className="px-6 py-2 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                >
                  Confirm & Add Staff
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Request Editorial Revision Modal */}
      {revisionModalSub && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                className="text-slate-400 hover:text-slate-900 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Manuscript Pitch:</span>
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{revisionModalSub.title}</p>
              <div className="text-[11px] text-slate-500">
                Author: <span className="font-semibold text-slate-900">{revisionModalSub.authorName}</span> ({revisionModalSub.authorEmail || "Correspondent"})
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
                  placeholder="Explain exactly what the writer needs to improve or verify (e.g. 'Please verify source citations for the Kano export statistics in paragraph 2 and include a quote from the ministry spokesperson')..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 text-xs focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalSub(null)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-800 rounded-xl text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer"
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

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-sm text-slate-500">
          Loading Chief Editor CMS...
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
