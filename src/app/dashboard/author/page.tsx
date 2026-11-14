"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  PenTool, 
  Clock, 
  CheckCircle2, 
  Send, 
  FileText, 
  Trash2, 
  Bell, 
  LogOut, 
  Search, 
  BarChart3, 
  X, 
  Plus,
  Menu,
  ExternalLink,
  AlertCircle,
  KeyRound,
  TrendingUp,
  Inbox,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
  CloudOff,
  Database
} from "lucide-react";
import { ARTICLES, CATEGORIES } from "@/data/mock-articles";
import { 
  createSubmission, 
  getSubmissions, 
  updateSubmission, 
  rejectSubmission, 
  getArticles 
} from "@/lib/firebase/db";
import { 
  useOnlineStatus, 
  queueOfflineSubmission, 
  getOfflineQueue 
} from "@/lib/offline-sync";
import { Submission, Article, Category } from "@/types";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import ImageUploader from "@/components/image-uploader";
import RichEditor from "@/components/rich-editor";

function AuthorStudioContent() {
  const router = useRouter();
  const { user, logout, updateUser, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"composer" | "submissions" | "stories" | "stats" | "settings">("composer");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "pending" | "needs_revision" | "approved">("all");

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [coverImage, setCoverImage] = useState("/assets/hero-featured.jpg");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [editingRevisionNotes, setEditingRevisionNotes] = useState<string | null>(null);
  const [submittedSuccessModal, setSubmittedSuccessModal] = useState<{
    id: string;
    title: string;
    category: string;
    isOffline?: boolean;
  } | null>(null);

  // Network Connectivity & Offline Queue State
  const { isOnline, wasOffline, pendingCount, isSyncing, syncNow, dismissWasOffline } = useOnlineStatus();

  // Status & Data State
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [desksList, setDesksList] = useState<Category[]>(CATEGORIES);
  const [statsData, setStatsData] = useState<{
    totalSubmitted: number;
    publishedStories: number;
    pendingReview: number;
    needsRevision: number;
    approved: number;
    totalReads: number;
    acceptanceRate: string;
    avgWordCount: number;
  } | null>(null);

  // Writer Profile Settings state (derived state with override to eliminate cascading renders)
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

  const triggerToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4500);
  };

  // Require auth
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard/author");
    }
  }, [isAuthenticated, isLoading, router]);

  // Load Writer Submissions, Published Articles, and Stats via API routes (with local fallback)
  const loadWriterData = useCallback(async () => {
    const authorEmail = user?.email || "fatima.sanusi@thezango.org";
    const authorName = user?.name || "Fatima Sanusi";

    try {
      const [subsRes, artsRes, statsRes, desksRes] = await Promise.all([
        fetch(`/api/writer/submissions?authorEmail=${encodeURIComponent(authorEmail)}&authorName=${encodeURIComponent(authorName)}`)
          .then((r) => r.json())
          .catch(() => null),
        fetch(`/api/writer/articles?authorName=${encodeURIComponent(authorName)}`)
          .then((r) => r.json())
          .catch(() => null),
        fetch(`/api/writer/stats?authorEmail=${encodeURIComponent(authorEmail)}&authorName=${encodeURIComponent(authorName)}`)
          .then((r) => r.json())
          .catch(() => null),
        fetch("/api/admin/desks")
          .then((r) => r.json())
          .catch(() => null),
      ]);

      if (desksRes?.success && desksRes.desks) {
        setDesksList(desksRes.desks);
      }

      let baseSubs: Submission[] = [];
      if (subsRes?.success && subsRes.submissions) {
        baseSubs = subsRes.submissions;
      } else {
        const allSubs = await getSubmissions();
        baseSubs = allSubs.filter(
          (s) =>
            (user?.email && s.authorEmail?.toLowerCase() === user.email.toLowerCase()) ||
            s.authorName?.toLowerCase() === authorName.toLowerCase()
        );
      }

      // Merge pending local offline queued submissions
      const offlineQueue = getOfflineQueue();
      const queuedSubs: Submission[] = offlineQueue
        .filter((q) => q.status !== "synced" && (!user?.email || q.authorEmail.toLowerCase() === authorEmail.toLowerCase()))
        .map((q) => ({
          id: q.id,
          title: q.title,
          excerpt: q.excerpt,
          content: q.content,
          category: q.category,
          authorName: q.authorName,
          authorEmail: q.authorEmail,
          coverImage: q.coverImage,
          tags: q.tags,
          wordCount: q.wordCount,
          readTime: q.readTime,
          submittedAt: `Offline (Queued at ${new Date(q.queuedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
          status: "pending" as const,
        }));
      const seenIds = new Set(baseSubs.map((s) => s.id));
      setMySubmissions([...queuedSubs.filter((q) => !seenIds.has(q.id)), ...baseSubs]);

      if (artsRes?.success && artsRes.articles) {
        setMyArticles(artsRes.articles);
      } else {
        const allArts = await getArticles();
        const mine = allArts.filter(
          (a) => a.author.name.toLowerCase().includes(authorName.toLowerCase()) || a.isFeatured
        );
        setMyArticles(mine.length > 0 ? mine : ARTICLES.filter((a) => a.author.name === authorName || a.isFeatured));
      }

      if (statsRes?.success && statsRes.stats) {
        setStatsData(statsRes.stats);
      }
    } catch (e) {
      console.warn("Writer loadWriterData fallback to local db:", e);
      const allSubs = await getSubmissions();
      const mineSubs = allSubs.filter(
        (s) =>
          (user?.email && s.authorEmail?.toLowerCase() === user.email.toLowerCase()) ||
          s.authorName?.toLowerCase() === authorName.toLowerCase()
      );
      setMySubmissions(mineSubs);

      const allArts = await getArticles();
      const mineArts = allArts.filter(
        (a) => a.author.name.toLowerCase().includes(authorName.toLowerCase()) || a.isFeatured
      );
      setMyArticles(mineArts.length > 0 ? mineArts : ARTICLES.filter((a) => a.author.name === authorName || a.isFeatured));
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      await loadWriterData();
    };
    if (active) {
      void fetchData();
    }
    return () => {
      active = false;
    };
  }, [loadWriterData]);

  // Listen for background offline sync events to refresh data automatically
  useEffect(() => {
    const handleOfflineSynced = (event: Event) => {
      const customEvent = event as CustomEvent<{ item: { title: string }; success: boolean }>;
      if (customEvent.detail?.success) {
        triggerToast(`Auto-synced pitch to newsroom: "${customEvent.detail.item.title.slice(0, 30)}..."`, "success");
        void loadWriterData();
      }
    };
    window.addEventListener("thezango_offline_synced", handleOfflineSynced);
    return () => {
      window.removeEventListener("thezango_offline_synced", handleOfflineSynced);
    };
  }, [loadWriterData]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    let active = true;
    const restoreDraft = () => {
      try {
        const saved = typeof window !== "undefined" ? localStorage.getItem("thezango_writer_draft") : null;
        if (saved && active && !editingSubmissionId) {
          const draft = JSON.parse(saved);
          if (draft.title) setTitle(draft.title);
          if (draft.category) setCategory(draft.category);
          if (draft.coverImage) setCoverImage(draft.coverImage);
          if (draft.excerpt) setExcerpt(draft.excerpt);
          if (draft.content) setContent(draft.content);
          if (draft.tags && Array.isArray(draft.tags)) setTags(draft.tags);
          setLastAutoSaved(draft.savedAt || "Previous session");
        }
      } catch {
        // ignore
      }
    };
    restoreDraft();
    return () => {
      active = false;
    };
  }, [editingSubmissionId]);

  // Auto-save draft changes to localStorage (only when not editing an active submitted revision)
  useEffect(() => {
    if (!title && !content) return;
    if (editingSubmissionId) return;

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
            tags,
            savedAt: now,
          })
        );
        setLastAutoSaved(now);
      } catch {
        // ignore
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [title, category, coverImage, excerpt, content, tags, editingSubmissionId]);

  const wordCount = useMemo(() => {
    const textOnly = content.replace(/<[^>]*>/g, " ").trim();
    if (!textOnly) return 0;
    return textOnly.split(/\s+/).length;
  }, [content]);

  const charCount = useMemo(() => {
    const textOnly = content.replace(/<[^>]*>/g, " ").trim();
    return textOnly.length;
  }, [content]);

  const computedSlug = useMemo(() => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }, [title]);

  const estimatedReadTime = useMemo(() => {
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes || 1} min read`;
  }, [wordCount]);

  const handleAddTag = (val: string) => {
    const clean = val.trim().replace(/^#/, "").replace(/,/g, "");
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleClearDraft = () => {
    if (confirm("Are you sure you want to discard this draft? This cannot be undone.")) {
      localStorage.removeItem("thezango_writer_draft");
      setTitle("");
      setExcerpt("");
      setContent("");
      setCoverImage("/assets/hero-featured.jpg");
      setTags([]);
      setTagInput("");
      setLastAutoSaved(null);
      setEditingSubmissionId(null);
      setEditingRevisionNotes(null);
      triggerToast("Draft discarded successfully.", "info");
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
          tags,
          savedAt: now,
        })
      );
      setLastAutoSaved(now);
      triggerToast("Story draft saved to browser storage!", "success");
    } catch {
      triggerToast("Could not save draft locally.", "error");
    }
  };

  const handleSubmitPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      triggerToast("Please provide both a headline and story manuscript content.", "error");
      return;
    }

    if (title.trim().length < 10) {
      triggerToast("Headline must be at least 10 characters long.", "error");
      return;
    }

    if (wordCount < 40) {
      triggerToast("Manuscript body must have at least 40 words before pitching to editors.", "error");
      return;
    }

    setIsSubmitting(true);

    // If offline, buffer directly to the local offline sync queue
    if (!isOnline) {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim() || content.replace(/<[^>]*>/g, " ").slice(0, 150) + "...",
        content,
        category,
        authorName: user?.name || "Fatima Sanusi",
        authorEmail: user?.email || "fatima.sanusi@thezango.org",
        coverImage,
        tags,
        wordCount,
        readTime: estimatedReadTime,
        editingSubmissionId,
      };

      const queued = queueOfflineSubmission(payload);
      const offlineSub: Submission = {
        id: queued.id,
        title: queued.title,
        excerpt: queued.excerpt,
        content: queued.content,
        category: queued.category,
        authorName: queued.authorName,
        authorEmail: queued.authorEmail,
        coverImage: queued.coverImage,
        tags: queued.tags,
        wordCount: queued.wordCount,
        readTime: queued.readTime,
        submittedAt: `Offline (Queued at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
        status: "pending",
      };

      setMySubmissions((prev) => [offlineSub, ...prev]);
      triggerToast("Offline Mode: Manuscript saved locally to sync queue!", "info");
      setSubmittedSuccessModal({
        id: queued.id,
        title: title.trim(),
        category,
        isOffline: true,
      });

      localStorage.removeItem("thezango_writer_draft");
      setTitle("");
      setExcerpt("");
      setContent("");
      setTags([]);
      setTagInput("");
      setCoverImage("/assets/hero-featured.jpg");
      setLastAutoSaved(null);
      setEditingSubmissionId(null);
      setEditingRevisionNotes(null);
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingSubmissionId) {
        // Re-submitting an existing submission that requested revision
        const res = await fetch(`/api/writer/submissions/${editingSubmissionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "resubmit",
            title: title.trim(),
            category,
            coverImage,
            excerpt: excerpt.trim() || content.replace(/<[^>]*>/g, " ").slice(0, 150) + "...",
            content,
            tags,
            wordCount,
            readTime: estimatedReadTime,
          }),
        });

        const data = await res.json();
        if (data.success) {
          triggerToast("Revised manuscript re-submitted to editorial review queue!", "success");
        } else {
          // Local fallback
          await updateSubmission(editingSubmissionId, {
            title: title.trim(),
            category,
            coverImage,
            excerpt: excerpt.trim() || content.replace(/<[^>]*>/g, " ").slice(0, 150) + "...",
            content,
            tags,
            wordCount,
            readTime: estimatedReadTime,
            status: "pending",
          });
          triggerToast("Revised manuscript re-submitted to editorial review queue!", "success");
        }

        setSubmittedSuccessModal({
          id: editingSubmissionId,
          title: title.trim(),
          category,
        });

        setEditingSubmissionId(null);
        setEditingRevisionNotes(null);
      } else {
        // Submitting a brand new manuscript pitch
        const payload = {
          title: title.trim(),
          excerpt: excerpt.trim() || content.replace(/<[^>]*>/g, " ").slice(0, 150) + "...",
          content,
          category,
          authorName: user?.name || "Fatima Sanusi",
          authorEmail: user?.email || "fatima.sanusi@thezango.org",
          coverImage,
          tags,
          wordCount,
          readTime: estimatedReadTime,
        };

        const res = await fetch("/api/writer/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        const createdSubId = data.submission?.id || `sub-${Date.now()}`;

        if (data.success) {
          triggerToast("Manuscript pitch delivered to editorial desk review queue!", "success");
        } else {
          // Local fallback
          await createSubmission(payload);
          triggerToast("Manuscript pitch delivered to editorial desk review queue!", "success");
        }

        setSubmittedSuccessModal({
          id: createdSubId,
          title: title.trim(),
          category,
        });

        localStorage.removeItem("thezango_writer_draft");
      }

      setTitle("");
      setExcerpt("");
      setContent("");
      setTags([]);
      setTagInput("");
      setCoverImage("/assets/hero-featured.jpg");
      setLastAutoSaved(null);
      await loadWriterData();
    } catch (err: unknown) {
      console.warn("Submission remote transmission exception, checking network status:", err);
      const isNetworkErr =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) ||
        String(err).includes("NetworkError") ||
        String(err).includes("Failed to fetch");

      if (isNetworkErr) {
        const payload = {
          title: title.trim(),
          excerpt: excerpt.trim() || content.replace(/<[^>]*>/g, " ").slice(0, 150) + "...",
          content,
          category,
          authorName: user?.name || "Fatima Sanusi",
          authorEmail: user?.email || "fatima.sanusi@thezango.org",
          coverImage,
          tags,
          wordCount,
          readTime: estimatedReadTime,
          editingSubmissionId,
        };
        const queued = queueOfflineSubmission(payload);
        const offlineSub: Submission = {
          id: queued.id,
          title: queued.title,
          excerpt: queued.excerpt,
          content: queued.content,
          category: queued.category,
          authorName: queued.authorName,
          authorEmail: queued.authorEmail,
          coverImage: queued.coverImage,
          tags: queued.tags,
          wordCount: queued.wordCount,
          readTime: queued.readTime,
          submittedAt: `Offline (Queued at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
          status: "pending",
        };
        setMySubmissions((prev) => [offlineSub, ...prev]);
        triggerToast("Network disconnected: Manuscript safely queued locally.", "info");
        setSubmittedSuccessModal({
          id: queued.id,
          title: title.trim(),
          category,
          isOffline: true,
        });
        localStorage.removeItem("thezango_writer_draft");
        setTitle("");
        setExcerpt("");
        setContent("");
        setTags([]);
        setTagInput("");
        setCoverImage("/assets/hero-featured.jpg");
        setLastAutoSaved(null);
        setEditingSubmissionId(null);
        setEditingRevisionNotes(null);
        return;
      }
      triggerToast("Failed to submit manuscript. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmission = (sub: Submission) => {
    setTitle(sub.title);
    setCategory(sub.category);
    setCoverImage(sub.coverImage || "/assets/hero-featured.jpg");
    setExcerpt(sub.excerpt);
    setContent(sub.content);
    setTags(sub.tags || []);
    setEditingSubmissionId(sub.id);
    setEditingRevisionNotes(sub.feedbackNotes || null);
    setActiveTab("composer");
    triggerToast(`Loaded "${sub.title}" into composer for editing!`, "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEditing = () => {
    setEditingSubmissionId(null);
    setEditingRevisionNotes(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setTags([]);
    setTagInput("");
    setCoverImage("/assets/hero-featured.jpg");
    triggerToast("Exited revision edit mode.", "info");
  };

  const handleWithdrawSubmission = async (id: string, subTitle: string) => {
    if (!confirm(`Are you sure you want to withdraw the pitch "${subTitle}"?`)) return;

    try {
      const res = await fetch(`/api/writer/submissions/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Manuscript "${subTitle.slice(0, 30)}..." withdrawn from queue.`, "info");
      } else {
        await rejectSubmission(id);
        triggerToast(`Manuscript "${subTitle.slice(0, 30)}..." withdrawn.`, "info");
      }
      await loadWriterData();
    } catch (e) {
      console.error("Withdraw failed:", e);
      await rejectSubmission(id);
      await loadWriterData();
      triggerToast(`Manuscript withdrawn.`, "info");
    }
  };

  const handleSaveProfile = () => {
    updateUser({
      name: profileName,
      avatar: profileAvatar,
      bio: profileBio,
      desk: profileDesk,
    });
    triggerToast("Staff Writer profile, avatar, and bio saved successfully!", "success");
  };

  // Counts & filtering
  const pendingSubmissions = useMemo(() => {
    return mySubmissions.filter((s) => s.status === "pending");
  }, [mySubmissions]);

  const revisionSubmissions = useMemo(() => {
    return mySubmissions.filter((s) => s.status === "needs_revision");
  }, [mySubmissions]);

  const filteredSubmissions = useMemo(() => {
    let list = mySubmissions;
    if (submissionFilter !== "all") {
      list = list.filter((s) => s.status === submissionFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.excerpt.toLowerCase().includes(q)
      );
    }
    return list;
  }, [mySubmissions, submissionFilter, searchQuery]);

  const filteredArticles = useMemo(() => {
    let list = myArticles;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q)
      );
    }
    return list;
  }, [myArticles, searchQuery]);

  const totalReadsCount = statsData?.totalReads ?? myArticles.reduce((acc, a) => acc + (a.views || 0), 0);
  const avgWords = statsData?.avgWordCount ?? 940;
  const acceptanceVelocity = statsData?.acceptanceRate ?? "94%";

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
              title="Toggle Writer Sidebar"
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

            <div className="hidden sm:flex items-center space-x-2 text-xs font-extrabold text-[#111111] uppercase tracking-wider pl-4 border-l border-slate-200">
              <span className="w-2 h-4 bg-emerald-600 rounded-xs" />
              <span>Writer & Contributor Studio</span>
            </div>
          </div>

          {/* Search bar & Live clearance badge */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden lg:flex items-center relative w-60 xl:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search pitches or stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs focus:outline-hidden bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* Online / Offline Connectivity Pill */}
            {isOnline ? (
              <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100" title="Connected to Newsroom Cloud Database">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-300 animate-pulse" title="Operating in Offline Mode">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline Mode</span>
              </div>
            )}

            {/* Offline Pending Items Sync Button */}
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={syncNow}
                disabled={isSyncing || !isOnline}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                title={isOnline ? "Click to sync offline manuscripts" : "Reconnect to internet to sync"}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{pendingCount} Queued</span>
              </button>
            )}

            {/* Live Clearance Badge */}
            <div className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Writer Clearance Active</span>
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => {
                setActiveTab("submissions");
                if (revisionSubmissions.length > 0) setSubmissionFilter("needs_revision");
              }}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Pitch Review Notifications"
            >
              <Bell className="w-4 h-4" />
              {revisionSubmissions.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Offline Status Alert Banners */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-amber-900 text-xs font-medium">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <CloudOff className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> Network disconnected. Local IndexedDB replication is active. All pitches are cached on your device and will auto-transmit once connectivity returns.
              </span>
            </div>
            {pendingCount > 0 && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950 font-bold text-[11px] shrink-0">
                <Database className="w-3 h-3 text-amber-800" />
                <span>{pendingCount} Pitches Queued Offline</span>
              </span>
            )}
          </div>
        </div>
      )}

      {wasOffline && isOnline && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 text-emerald-900 text-xs font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Connection Restored:</strong> You are back online. {isSyncing ? "Synchronising offline queue with editorial desk..." : pendingCount > 0 ? `${pendingCount} offline items queued for sync.` : "All manuscripts synchronised."}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={syncNow}
                  disabled={isSyncing}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Sync Now</span>
                </button>
              )}
              <button
                type="button"
                onClick={dismissWasOffline}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1 flex flex-col md:flex-row items-start gap-6">
        
        {/* LEFT MODERN STICKY SIDEBAR (Writer Scope) */}
        <aside
          className={`w-full md:w-64 lg:w-72 shrink-0 bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col justify-between md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] overflow-y-auto space-y-4 transition-all ${
            mobileSidebarOpen ? "block" : "hidden md:flex"
          }`}
        >
          <div className="space-y-4">
            
            {/* Beat Clearance Status Pill */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold text-emerald-950 truncate">
                    {profileDesk}
                  </div>
                  <div className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider">
                    Assigned Writer Beat
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                Author
              </span>
            </div>

            {/* Quick Action Button: New Pitch */}
            <button
              onClick={() => {
                setEditingSubmissionId(null);
                setEditingRevisionNotes(null);
                setActiveTab("composer");
                setMobileSidebarOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Manuscript Pitch</span>
            </button>

            {/* Group 1: EDITORIAL WORKSPACE */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Editorial Workspace
              </span>

              {/* Sidebar Item 1: Composer */}
              <button
                onClick={() => {
                  setActiveTab("composer");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "composer"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <PenTool className="w-4 h-4 shrink-0" />
                  <span>Draft Manuscript</span>
                </div>
                {editingSubmissionId && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400 text-amber-950 animate-pulse">
                    Editing
                  </span>
                )}
              </button>

              {/* Sidebar Item 2: My Pitches & Manuscripts */}
              <button
                onClick={() => {
                  setActiveTab("submissions");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "submissions"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Inbox className="w-4 h-4 shrink-0" />
                  <span>My Pitches</span>
                </div>
                <div className="flex items-center space-x-1">
                  {revisionSubmissions.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                      ⚠️ {revisionSubmissions.length}
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === "submissions"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {mySubmissions.length}
                  </span>
                </div>
              </button>

              {/* Sidebar Item 3: Published Stories */}
              <button
                onClick={() => {
                  setActiveTab("stories");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "stories"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Published Bylines</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "stories" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {myArticles.length}
                </span>
              </button>
            </div>

            {/* Group 2: PERFORMANCE & REACH */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Performance & Reach
              </span>

              <button
                onClick={() => {
                  setActiveTab("stats");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "stats"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Readership Analytics</span>
                </div>
              </button>
            </div>

            {/* Group 3: WRITER IDENTITY & CONFIGURATION */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Writer Configuration
              </span>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Byline & Profile</span>
                </div>
              </button>
            </div>

          </div>

          {/* PINNED BOTTOM: Modern User Profile Card & Signout Positioning */}
          <div className="pt-3 border-t border-slate-100 mt-auto space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-600 shrink-0">
                  <Image
                    src={profileAvatar}
                    alt={profileName}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs text-slate-900 truncate">
                    {profileName}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider truncate">
                    Staff Writer
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </aside>

        {/* RIGHT WORKSPACE */}
        <main className="flex-1 w-full space-y-6">

          {/* Notification Toast */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in transition-all ${
              statusMessage.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : statusMessage.type === "info"
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              <div className="flex items-center space-x-2.5">
                {statusMessage.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button 
                onClick={() => setStatusMessage(null)} 
                className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: COMPOSER (WYSIWYG Rich Editor) */}
          {activeTab === "composer" && (
            <div className="space-y-6">
              
              {/* Revision Notice Banner if editing a pitch needing revision */}
              {editingSubmissionId && editingRevisionNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Editorial Desk Revision Notes</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="text-xs text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                    >
                      Cancel & Exit Revision Mode
                    </button>
                  </div>
                  <p className="text-xs text-amber-950 italic bg-white/70 p-3 rounded-xl border border-amber-100">
                    &ldquo;{editingRevisionNotes}&rdquo;
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Make your revisions below. Clicking &ldquo;Re-submit Revised Manuscript&rdquo; will automatically deliver this updated dispatch back to the editor&apos;s review queue.
                  </p>
                </div>
              )}

              {/* Main Composer Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-5 bg-emerald-600 rounded-xs inline-block" />
                      <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                        {editingSubmissionId ? "Revise Story Manuscript" : "Draft Story Manuscript"}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Compose investigative reports and pitches for Northern Nigeria newsroom desks.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500">
                    {lastAutoSaved && !editingSubmissionId && (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center space-x-1.5 ${
                        isOnline 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-amber-50 text-amber-900 border-amber-300"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                        <span>{isOnline ? `Auto-Saved ${lastAutoSaved}` : `Offline Saved ${lastAutoSaved}`}</span>
                      </span>
                    )}
                    <span className="bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 font-bold text-[11px]">
                      {wordCount} words
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 font-bold text-[11px]">
                      {charCount} chars
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 font-bold text-[11px]">
                      {estimatedReadTime}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmitPitch} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Headline *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sahel Solar Corridors: How Off-Grid Power Is Reshaping Rural Commerce in Jigawa..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-600 text-sm font-semibold focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all"
                    />
                    {title.trim() && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono mt-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                        <span className="text-slate-400 font-sans font-bold">Public URL Preview:</span>
                        <span className="text-emerald-700 font-semibold truncate">
                          thezango.org/article/{computedSlug || "story-slug"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Beat / Desk
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs focus:outline-hidden bg-white cursor-pointer font-medium"
                      >
                        {desksList.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Lead Excerpt
                      </label>
                      <input
                        type="text"
                        placeholder="Brief 1-2 sentence lead summary for front page teasers..."
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs focus:outline-hidden bg-white"
                      />
                    </div>
                  </div>

                  {/* Story Tags & Keywords Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Story Tags & Keywords
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Press Enter or comma to add
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl border border-slate-200 bg-white focus-within:border-emerald-600 transition-colors">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-emerald-600 hover:text-red-600 ml-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder={tags.length === 0 ? "Type tag (e.g. CleanEnergy, Kano, Agribusiness) and press Enter..." : "Add another tag..."}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="flex-1 min-w-[140px] text-xs font-medium focus:outline-hidden bg-transparent"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Suggested:</span>
                      {["CleanEnergy", "Agriculture", "NorthernTech", "Fintech", "SahelTrade", "Governance"].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleAddTag(sug)}
                          disabled={tags.includes(sug)}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          +{sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ImageUploader
                    label="Story Cover Image (Upload high-res photo or select from archive)"
                    value={coverImage}
                    onChange={(url) => setCoverImage(url)}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Manuscript Body (WYSIWYG Rich Editor) *
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Supports bolding, blockquotes, embeds, headers, and media
                      </span>
                    </div>
                    <RichEditor
                      value={content}
                      onChange={(html) => setContent(html)}
                      placeholder="Compose your news dispatch, interview transcripts, or investigative findings..."
                      height={400}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {!editingSubmissionId && (
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="px-4 py-2 rounded-xl border border-slate-300 hover:border-slate-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-white"
                        >
                          Save Local Draft
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={editingSubmissionId ? handleCancelEditing : handleClearDraft}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer hover:bg-red-50"
                        title={editingSubmissionId ? "Cancel editing" : "Discard draft"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {editingSubmissionId ? "Re-submit Revised Manuscript" : "Pitch to Editorial Queue"}
                      </span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

          {/* TAB 2: MY PITCHES & MANUSCRIPTS */}
          {activeTab === "submissions" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-5 bg-emerald-600 rounded-xs inline-block" />
                    <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                      My Pitched Manuscripts ({mySubmissions.length})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track desk clearance status, editorial revision requests, and clearance feedback.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setSubmissionFilter("all")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      submissionFilter === "all"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({mySubmissions.length})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter("pending")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      submissionFilter === "pending"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    In Review ({pendingSubmissions.length})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter("needs_revision")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      submissionFilter === "needs_revision"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    Revisions ({revisionSubmissions.length})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter("approved")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      submissionFilter === "approved"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    Approved
                  </button>
                </div>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">No manuscripts found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {submissionFilter !== "all"
                      ? `No pitches currently categorized under "${submissionFilter}".`
                      : "You have not submitted any manuscripts to the desk review queue yet."}
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("composer");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Pitch First Story</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 max-w-3xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 tracking-wider">
                              {sub.category}
                            </span>
                            <span 
                              suppressHydrationWarning 
                              className="text-[11px] text-slate-400 font-medium"
                            >
                              Submitted {sub.submittedAt}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {sub.wordCount} words ({sub.readTime})
                            </span>
                          </div>

                          <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                            {sub.title}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-2">
                            {sub.excerpt}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 flex items-center space-x-2">
                          {sub.submittedAt.includes("Offline") || sub.id.startsWith("offline-sub-") ? (
                            <span className="px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-[11px] font-extrabold uppercase border border-amber-300 flex items-center space-x-1.5 shadow-2xs">
                              <Database className="w-3.5 h-3.5 text-amber-600" />
                              <span>Offline Queued</span>
                            </span>
                          ) : sub.status === "needs_revision" ? (
                            <span className="px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-[11px] font-extrabold uppercase border border-amber-300 flex items-center space-x-1.5 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span>Revision Requested</span>
                            </span>
                          ) : sub.status === "approved" ? (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[11px] font-extrabold uppercase border border-emerald-300 flex items-center space-x-1.5 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved & Published</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-extrabold uppercase border border-blue-200 flex items-center space-x-1.5 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              <span>In Desk Review</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Editorial Feedback Notes if revision requested */}
                      {sub.status === "needs_revision" && (
                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span className="font-extrabold text-[10px] uppercase tracking-wider text-amber-900 block">
                              Desk Editor Feedback:
                            </span>
                            <p className="italic text-amber-900 font-medium">
                              &ldquo;{sub.feedbackNotes || "Please polish quotes, check source attribution, and clarify the policy implications before re-submitting."}&rdquo;
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditSubmission(sub)}
                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shrink-0 shadow-sm cursor-pointer flex items-center space-x-1.5"
                          >
                            <span>Edit & Re-submit</span>
                            <span>→</span>
                          </button>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEditSubmission(sub)}
                            className="text-slate-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
                          >
                            Open in Composer
                          </button>
                          {sub.status === "pending" && (
                            <span className="text-slate-400 text-[11px]">
                              Awaiting senior desk editor clearance
                            </span>
                          )}
                        </div>

                        {sub.status !== "approved" && (
                          <button
                            onClick={() => handleWithdrawSubmission(sub.id, sub.title)}
                            className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer text-[11px] font-semibold"
                          >
                            Withdraw Pitch
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PUBLISHED BYLINES */}
          {activeTab === "stories" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-5 bg-emerald-600 rounded-xs inline-block" />
                    <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                      Live Published Bylines ({filteredArticles.length})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Articles published live on The Zango under your author byline.
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Total Reach: {totalReadsCount.toLocaleString()} reads</span>
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">No published stories found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Once the editorial desk approves your pitched manuscripts, your live stories will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredArticles.map((story) => (
                    <div key={story.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-100">
                          <Image 
                            src={story.coverImage || "/assets/hero-featured.jpg"} 
                            alt={story.title} 
                            fill 
                            sizes="64px" 
                            className="object-cover" 
                          />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <Link 
                            href={`/article/${story.slug}`} 
                            className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors line-clamp-1"
                          >
                            {story.title}
                          </Link>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-sm">
                              {story.category}
                            </span>
                            <span>•</span>
                            <span suppressHydrationWarning>{story.publishedAt}</span>
                            <span>•</span>
                            <span>{story.readTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                          {(story.views || 1240).toLocaleString()} reads
                        </span>
                        <Link
                          href={`/article/${story.slug}`}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                          title="View live article on site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: READERSHIP ANALYTICS */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Published Bylines
                  </span>
                  <span className="text-3xl font-black text-slate-900 block">
                    {myArticles.length}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold block">
                    Live across Northern newsrooms
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Total Readership Reach
                  </span>
                  <span className="text-3xl font-black text-emerald-600 block">
                    {totalReadsCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold block">
                    Verified unique story opens
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Desk Acceptance Rate
                  </span>
                  <span className="text-3xl font-black text-blue-600 block">
                    {acceptanceVelocity}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold block">
                    Pitch clearance velocity
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Average Word Count
                  </span>
                  <span className="text-3xl font-black text-purple-600 block">
                    {avgWords}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold block">
                    Standard deep investigative length
                  </span>
                </div>
              </div>

              {/* Lower Detailed Breakdown Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Top Stories Leaderboard */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                      Top Readership Leaderboard
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Ranked by reader engagement</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {myArticles.slice(0, 5).map((article, index) => (
                      <div key={article.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {article.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {article.category} • {article.readTime}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full shrink-0">
                          {(article.views || 1420).toLocaleString()} reads
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sahelian Editorial Standards Checklist */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                      Newsroom Standards
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block">Dual Source Verification</span>
                        <p className="text-[11px] text-slate-500">Every investigative claim requires at least two independent primary citations.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block">Sahelian Socio-Economic Context</span>
                        <p className="text-[11px] text-slate-500">Highlight community-level impact across Northern states and regional trade hubs.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block">Unbiased Attributions</span>
                        <p className="text-[11px] text-slate-500">Present government, private enterprise, and civil society perspectives equitably.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-6">
              
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-5 bg-emerald-600 rounded-xs inline-block" />
                  <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
                    Staff Writer Profile & Identity
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your journalist byline, assigned beat, profile picture, and author biography shown on articles.
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Official Byline Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Corporate Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || "fatima.sanusi@thezango.org"}
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Assigned Beat / Desk
                    </label>
                    <select
                      value={profileDesk}
                      onChange={(e) => setProfileDesk(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden bg-white cursor-pointer font-medium"
                    >
                      {desksList.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="Executive & Investigation">Executive & Investigation</option>
                      <option value="Technology & Digital Economy">Technology & Digital Economy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Journalist Biography (Shown to Readers)
                    </label>
                    <textarea
                      rows={4}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Brief background on your reporting focus across Northern Nigeria..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs focus:outline-hidden resize-none font-normal"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      This biography and photo will appear under &ldquo;About the Author&rdquo; on all stories published under your byline.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* SUBMISSION SUCCESS MODAL */}
      {submittedSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full border-4 mx-auto flex items-center justify-center shadow-inner ${
              submittedSuccessModal.isOffline
                ? "bg-amber-50 border-amber-100 text-amber-600"
                : "bg-emerald-50 border-emerald-100 text-emerald-600"
            }`}>
              {submittedSuccessModal.isOffline ? (
                <Database className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                submittedSuccessModal.isOffline
                  ? "text-amber-800 bg-amber-50 border-amber-200"
                  : "text-emerald-600 bg-emerald-50 border-emerald-100"
              }`}>
                {submittedSuccessModal.isOffline ? "Offline Queue Buffered" : "Manuscript In Review"}
              </span>
              <h3 className="text-lg font-black text-slate-900">
                {submittedSuccessModal.isOffline ? "Saved Locally to Sync Queue!" : "Pitched to Editorial Desk!"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {submittedSuccessModal.isOffline
                  ? "Your dispatch is stored securely in your device's persistent cache. It will automatically upload to the editorial desk once an internet connection is established."
                  : "Your dispatch has been queued for Desk Editor review and fact-checking."}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">Reference ID:</span>
                <span className="font-mono font-bold text-slate-700">{submittedSuccessModal.id}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">Desk:</span>
                <span className="font-bold text-slate-800">{submittedSuccessModal.category}</span>
              </div>
              {submittedSuccessModal.isOffline && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Sync Status:</span>
                  <span className="font-bold text-amber-700 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Auto-Transmits on Reconnect</span>
                  </span>
                </div>
              )}
              <div className="text-xs font-bold text-slate-900 line-clamp-2 pt-1 border-t border-slate-200/60">
                &ldquo;{submittedSuccessModal.title}&rdquo;
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedSuccessModal(null);
                  setActiveTab("submissions");
                }}
                className={`w-full sm:flex-1 py-2.5 px-4 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer shadow-sm ${
                  submittedSuccessModal.isOffline
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Track in My Pitches
              </button>
              <button
                type="button"
                onClick={() => setSubmittedSuccessModal(null)}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Draft Another Story
              </button>
            </div>
          </div>
        </div>
      )}

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
      <ProtectedRoute
        allowedRoles={["author", "writer", "editor", "admin"]}
        workspaceName="Writer Studio & Editorial Desk"
      >
        <AuthorStudioContent />
      </ProtectedRoute>
    </Suspense>
  );
}
