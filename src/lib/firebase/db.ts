import { db, isFirebaseConfigured } from "./config";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { collection, getDocs, getDoc, setDoc, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where, limit, terminate } from "firebase/firestore";
import { Article, Subscriber, Submission, NewsroomMember, NewsroomRole, UserProfile, UserRole } from "@/types";
import { ARTICLES } from "@/data/mock-articles";

function sanitizeForFirestore<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        clean[key] = sanitizeForFirestore(val as Record<string, unknown>);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

let isFirestoreAvailable = true;

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 3500, fallbackVal: T): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackVal), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const disableFirestore = (reason?: unknown) => {
  if (!isFirestoreAvailable) return;
  isFirestoreAvailable = false;
  if (db) {
    try {
      void terminate(db);
    } catch {
      // ignore
    }
  }
  const msg = (reason as { message?: string })?.message || String(reason || "");
  if (msg.includes("PERMISSION_DENIED") || msg.includes("permission-denied") || msg.includes("has not been used")) {
    console.warn(
      "Notice: Cloud Firestore API is not yet enabled in Firebase Console (project: the-zango). " +
      "Falling back to local newsroom storage until database is created."
    );
  }
};

let localArticlesStore: Article[] = [...ARTICLES];
let localSubscribersStore: Subscriber[] = [
  { email: "ibrahim.k@startupkano.com", subscribedAt: "2026-07-20" },
  { email: "fatima.al@kadunahub.ng", subscribedAt: "2026-07-21" },
  { email: "usman.tech@innovate.ng", subscribedAt: "2026-07-22" },
  { email: "maryam.s@oxfordalumni.org", subscribedAt: "2026-07-23" },
  { email: "bello.invest@savannah.vc", subscribedAt: "2026-07-24" },
];

interface SupabaseArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags?: string[];
  published_at: string;
  read_time?: string;
  is_featured?: boolean;
  is_latest?: boolean;
  is_trending?: boolean;
  is_popular?: boolean;
  is_editors_pick?: boolean;
  is_breaking?: boolean;
  popular_rank?: number;
  views?: number;
  author_id?: string;
  author_name?: string;
  author_slug?: string;
  author_role?: string;
  author_avatar?: string;
  author_bio?: string;
}

function mapSupabaseToArticle(row: SupabaseArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image,
    category: row.category,
    tags: row.tags || [],
    publishedAt: row.published_at,
    readTime: row.read_time || "4 min read",
    isFeatured: !!row.is_featured,
    isLatest: !!row.is_latest,
    isTrending: !!row.is_trending,
    isPopular: !!row.is_popular,
    isEditorsPick: !!row.is_editors_pick,
    isBreaking: !!row.is_breaking || row.slug.includes("tomato-jos"),
    popularRank: row.popular_rank,
    views: row.views || 0,
    author: {
      id: row.author_id || "author-1",
      name: row.author_name || "The Zango Bureau",
      slug: row.author_slug || "the-zango-bureau",
      role: row.author_role || "Editorial Desk",
      avatar: row.author_avatar,
      bio: row.author_bio,
    },
  };
}

function mapArticleToSupabase(article: Partial<Article>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (article.id !== undefined) row.id = article.id;
  if (article.slug !== undefined) row.slug = article.slug;
  if (article.title !== undefined) row.title = article.title;
  if (article.excerpt !== undefined) row.excerpt = article.excerpt;
  if (article.content !== undefined) row.content = article.content;
  if (article.coverImage !== undefined) row.cover_image = article.coverImage;
  if (article.category !== undefined) row.category = article.category;
  if (article.tags !== undefined) row.tags = article.tags;
  if (article.publishedAt !== undefined) row.published_at = article.publishedAt;
  if (article.readTime !== undefined) row.read_time = article.readTime;
  if (article.isFeatured !== undefined) row.is_featured = article.isFeatured;
  if (article.isLatest !== undefined) row.is_latest = article.isLatest;
  if (article.isTrending !== undefined) row.is_trending = article.isTrending;
  if (article.isPopular !== undefined) row.is_popular = article.isPopular;
  if (article.isEditorsPick !== undefined) row.is_editors_pick = article.isEditorsPick;
  if (article.isBreaking !== undefined) row.is_breaking = article.isBreaking;
  if (article.popularRank !== undefined) row.popular_rank = article.popularRank;
  if (article.views !== undefined) row.views = article.views;
  if (article.author) {
    if (article.author.name) row.author_name = article.author.name;
    if (article.author.slug) row.author_slug = article.author.slug;
    if (article.author.role) row.author_role = article.author.role;
    if (article.author.avatar) row.author_avatar = article.author.avatar;
    if (article.author.bio) row.author_bio = article.author.bio;
  }
  return row;
}

function mapFirestoreToArticle(id: string, data: Record<string, unknown>): Article {
  const localMatch = ARTICLES.find(
    (m) => m.slug.toLowerCase() === String(data.slug || "").toLowerCase()
  );

  const rawAuthor = (data.author as Record<string, unknown>) || {};
  const authorName = String(
    rawAuthor.name ||
    data.authorName ||
    data.author_name ||
    localMatch?.author.name ||
    "The Zango Bureau"
  );
  const authorSlug = String(
    rawAuthor.slug ||
    data.authorSlug ||
    data.author_slug ||
    localMatch?.author.slug ||
    "the-zango-bureau"
  );
  const authorRole = String(
    rawAuthor.role ||
    data.authorRole ||
    data.author_role ||
    localMatch?.author.role ||
    "Editorial Desk"
  );
  const authorAvatar =
    (rawAuthor.avatar as string) ||
    (data.authorAvatar as string) ||
    (data.author_avatar as string) ||
    localMatch?.author.avatar;
  const authorBio =
    (rawAuthor.bio as string) ||
    (data.authorBio as string) ||
    (data.author_bio as string) ||
    localMatch?.author.bio;

  return {
    id,
    slug: String(data.slug || localMatch?.slug || id),
    title: String(data.title || localMatch?.title || "Untitled Dispatch"),
    excerpt: String(data.excerpt || localMatch?.excerpt || ""),
    content: String(data.content || localMatch?.content || ""),
    coverImage: String(
      data.coverImage || data.cover_image || localMatch?.coverImage || "/assets/hero-featured.jpg"
    ),
    category: String(data.category || localMatch?.category || "News"),
    tags: Array.isArray(data.tags)
      ? (data.tags as string[])
      : localMatch?.tags || ["News", "Sahel"],
    publishedAt: String(
      data.publishedAt || data.published_at || localMatch?.publishedAt || "Today"
    ),
    readTime: String(data.readTime || data.read_time || localMatch?.readTime || "4 min read"),
    isFeatured: data.isFeatured !== undefined ? !!data.isFeatured : !!localMatch?.isFeatured,
    isLatest: data.isLatest !== undefined ? !!data.isLatest : !!localMatch?.isLatest,
    isTrending: data.isTrending !== undefined ? !!data.isTrending : !!localMatch?.isTrending,
    isPopular: data.isPopular !== undefined ? !!data.isPopular : !!localMatch?.isPopular,
    isEditorsPick:
      data.isEditorsPick !== undefined ? !!data.isEditorsPick : !!localMatch?.isEditorsPick,
    isBreaking:
      data.isBreaking !== undefined
        ? !!data.isBreaking
        : !!localMatch?.isBreaking || String(data.slug || "").includes("tomato-jos"),
    popularRank: (data.popularRank as number) ?? localMatch?.popularRank,
    views: (data.views as number) ?? localMatch?.views ?? 0,
    author: {
      id: String(rawAuthor.id || data.author_id || "author-1"),
      name: authorName,
      slug: authorSlug,
      role: authorRole,
      avatar: authorAvatar,
      bio: authorBio,
    },
  };
}

export async function getArticles(): Promise<Article[]> {
  // 1. Check Supabase PostgreSQL
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseToArticle);
      }
    } catch (err) {
      console.warn("Could not fetch articles from Supabase:", err);
    }
  }

  // 2. Check Firebase Firestore with timeout
  if (isFirebaseConfigured && db && isFirestoreAvailable) {
    try {
      const q = query(collection(db, "articles"), orderBy("publishedAt", "desc"));
      const querySnapshot = await withTimeout(getDocs(q), 3500, null);
      if (querySnapshot && !querySnapshot.empty) {
        const fsArticles = querySnapshot.docs.map((d) =>
          mapFirestoreToArticle(d.id, d.data() as Record<string, unknown>)
        );
        // Include any in-memory store articles that are not yet indexed in Firestore
        const fsSlugs = new Set(fsArticles.map((a) => a.slug.toLowerCase()));
        const missing = localArticlesStore.filter((a) => !fsSlugs.has(a.slug.toLowerCase()));
        return [...fsArticles, ...missing];
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || String(err || "");
      if (msg.includes("PERMISSION_DENIED") || msg.includes("permission-denied") || msg.includes("has not been used")) {
        disableFirestore(err);
      } else {
        console.warn("Could not fetch articles from Firestore, using local store:", err);
      }
    }
  }

  // 3. Fallback to Local Store
  const existingIds = new Set(localArticlesStore.map((a) => a.id));
  const missingArticles = ARTICLES.filter((a) => !existingIds.has(a.id));
  if (missingArticles.length > 0) {
    localArticlesStore = [...localArticlesStore, ...missingArticles];
  }

  return localArticlesStore;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const slugLower = slug.toLowerCase();

  // 1. Supabase lookup
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slugLower)
        .single();
      if (!error && data) {
        return mapSupabaseToArticle(data);
      }
    } catch (err) {
      console.warn("Supabase slug lookup failed:", err);
    }
  }

  // 2. Query Firebase Firestore by slug directly with timeout
  if (isFirebaseConfigured && db && isFirestoreAvailable) {
    try {
      const q = query(collection(db, "articles"), where("slug", "==", slugLower), limit(1));
      const querySnapshot = await withTimeout(getDocs(q), 3500, null);
      if (querySnapshot && !querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return mapFirestoreToArticle(docSnap.id, docSnap.data() as Record<string, unknown>);
      }
    } catch (err) {
      console.warn("Could not query article by slug from Firestore:", err);
    }
  }

  // 3. Check in-memory localArticlesStore
  const localFound = localArticlesStore.find((a) => a.slug.toLowerCase() === slugLower);
  if (localFound) return localFound;

  // 4. Fallback to static mock articles
  return ARTICLES.find((a) => a.slug.toLowerCase() === slugLower) || null;
}

export async function createArticle(articleData: Omit<Article, "id">): Promise<Article> {
  const newArticle: Article = {
    ...articleData,
    id: `art-${Date.now()}`,
  };

  // Persist to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const row = mapArticleToSupabase(newArticle);
      await supabase.from("articles").insert([row]);
    } catch (err) {
      console.warn("Could not save article to Supabase:", err);
    }
  }

  // Persist to Firebase Firestore (sanitizing undefined fields)
  if (isFirebaseConfigured && db) {
    try {
      const sanitized = sanitizeForFirestore(newArticle as unknown as Record<string, unknown>);
      const docRef = await addDoc(collection(db, "articles"), sanitized);
      newArticle.id = docRef.id;
    } catch (err) {
      console.warn("Could not add article to Firestore:", err);
    }
  }

  localArticlesStore = [newArticle, ...localArticlesStore];
  return newArticle;
}

export async function deleteArticle(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("articles").delete().eq("id", id);
    } catch (err) {
      console.warn("Could not delete from Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "articles", id));
    } catch (err) {
      console.warn("Could not delete from Firestore:", err);
    }
  }
  localArticlesStore = localArticlesStore.filter((a) => a.id !== id);
  return true;
}

export async function getSubscribers(): Promise<Subscriber[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("subscribers")
        .select("email, subscribed_at")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((d: { email: string; subscribed_at: string }) => ({
          email: d.email,
          subscribedAt: d.subscribed_at,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch subscribers from Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db && isFirestoreAvailable) {
    try {
      const q = query(collection(db, "subscribers"), orderBy("subscribedAt", "desc"));
      const querySnapshot = await withTimeout(getDocs(q), 3000, null);
      if (querySnapshot && !querySnapshot.empty) {
        return querySnapshot.docs.map((d) => d.data() as Subscriber);
      }
    } catch (err) {
      console.warn("Could not fetch subscribers from Firestore:", err);
    }
  }
  return localSubscribersStore;
}

export async function addSubscriber(email: string): Promise<Subscriber> {
  const newSubscriber: Subscriber = {
    email,
    subscribedAt: new Date().toISOString().split("T")[0],
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("subscribers").insert([
        {
          email,
          subscribed_at: newSubscriber.subscribedAt,
        },
      ]);
    } catch (err) {
      console.warn("Could not add subscriber to Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "subscribers"), newSubscriber);
    } catch (err) {
      console.warn("Could not add subscriber to Firestore:", err);
    }
  }

  localSubscribersStore = [newSubscriber, ...localSubscribersStore];
  return newSubscriber;
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
  const index = localArticlesStore.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updated: Article = { ...localArticlesStore[index], ...updates };

  if (isSupabaseConfigured && supabase) {
    try {
      const rowUpdates = mapArticleToSupabase(updates);
      await supabase.from("articles").update(rowUpdates).eq("id", id);
    } catch (err) {
      console.warn("Could not update article in Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const sanitized = sanitizeForFirestore(updates as unknown as Record<string, unknown>);
      await updateDoc(doc(db, "articles", id), sanitized);
    } catch (err) {
      console.warn("Could not update article in Firestore:", err);
    }
  }

  localArticlesStore[index] = updated;
  return updated;
}

export async function toggleArticleFlag(
  id: string,
  flag: "isFeatured" | "isTrending" | "isEditorsPick" | "isLatest"
): Promise<Article | null> {
  const article = localArticlesStore.find((a) => a.id === id);
  if (!article) return null;

  const currentValue = !!article[flag];
  return updateArticle(id, { [flag]: !currentValue });
}

let localSubmissionsStore: Submission[] = [
  {
    id: "sub-1",
    title: "Kano Solar Irrigation Co-Op Triples Dry-Season Yields for 400 Smallholders",
    excerpt: "Field report from Danbatta agricultural cluster detailing how solar-powered drip irrigation is insulating smallholder farmers from diesel price spikes.",
    content: "Full investigative manuscript examining cooperative solar pump financing...",
    category: "Technology",
    authorName: "Amina Dahiru",
    authorEmail: "amina@thezango.ng",
    submittedAt: "2 hours ago",
    wordCount: 840,
    readTime: "4 min read",
    coverImage: "/assets/trending-hero.jpg",
    status: "pending",
  },
  {
    id: "sub-2",
    title: "Fintech Cross-Border Remittances: Navigating CFA-Naira Liquidity Corridors",
    excerpt: "Analysis of cross-border merchant trade settlements between Maradi, Niger and Kano, Nigeria using mobile money wallets.",
    content: "Detailed market study analyzing foreign exchange clearing houses...",
    category: "Business",
    authorName: "Ibrahim Bello",
    authorEmail: "ibrahim@thezango.ng",
    submittedAt: "5 hours ago",
    wordCount: 1120,
    readTime: "6 min read",
    coverImage: "/assets/hero-featured.jpg",
    status: "pending",
  },
  {
    id: "sub-3",
    title: "Preserving Sahelian Architecture: Low-Carbon Compressed Earth Bricks in Modern Public Housing",
    excerpt: "Architects and urban planners in Niamey and Kaduna are reviving passive-cooling earth architecture to reduce air conditioning energy loads by 45%.",
    content: "Exploration of sustainable building materials suited for Sahelian climatic extremes...",
    category: "Features",
    authorName: "Zainab Usman",
    authorEmail: "zainab@thezango.ng",
    submittedAt: "Yesterday",
    wordCount: 960,
    readTime: "5 min read",
    coverImage: "/assets/news-hausa-digital.png",
    status: "pending",
  },
];

interface SupabaseSubmissionRow {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  author_email?: string;
  submitted_at: string;
  word_count?: number;
  read_time: string;
  cover_image?: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  feedback_notes?: string;
}

export async function getSubmissions(): Promise<Submission[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((d: SupabaseSubmissionRow) => ({
          id: d.id,
          title: d.title,
          excerpt: d.excerpt,
          content: d.content,
          category: d.category,
          authorName: d.author_name,
          authorEmail: d.author_email,
          submittedAt: d.submitted_at,
          wordCount: d.word_count || 0,
          readTime: d.read_time,
          coverImage: d.cover_image,
          status: d.status,
          feedbackNotes: d.feedback_notes,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch submissions from Supabase:", err);
    }
  }

  // 2. Check Firebase Firestore
  if (isFirebaseConfigured && db && isFirestoreAvailable) {
    try {
      const q = query(collection(db, "submissions"));
      const querySnapshot = await withTimeout(getDocs(q), 3000, null);
      if (querySnapshot && !querySnapshot.empty) {
        const firestoreSubs = querySnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Submission));
        firestoreSubs.sort((a, b) => {
          const timeA = Date.parse(a.submittedAt) || 0;
          const timeB = Date.parse(b.submittedAt) || 0;
          return timeB - timeA;
        });
        const fsIds = new Set(firestoreSubs.map((s) => s.id));
        const merged = [...firestoreSubs, ...localSubmissionsStore.filter((s) => !fsIds.has(s.id))];
        return merged;
      }
    } catch (err) {
      console.warn("Could not fetch submissions from Firestore, using local store:", err);
    }
  }

  return localSubmissionsStore;
}

export async function createSubmission(
  subData: Omit<Submission, "id" | "submittedAt" | "status">
): Promise<Submission> {
  const newSubmission: Submission = {
    ...subData,
    id: `sub-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: "pending",
    tags: subData.tags || [],
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("submissions").insert([
        {
          id: newSubmission.id,
          title: newSubmission.title,
          excerpt: newSubmission.excerpt,
          content: newSubmission.content,
          category: newSubmission.category,
          author_name: newSubmission.authorName,
          author_email: newSubmission.authorEmail,
          submitted_at: newSubmission.submittedAt,
          word_count: newSubmission.wordCount,
          read_time: newSubmission.readTime,
          cover_image: newSubmission.coverImage,
          status: newSubmission.status,
        },
      ]);
    } catch (err) {
      console.warn("Could not save submission to Supabase:", err);
    }
  }

  // Persist to Firebase Firestore (sanitizing undefined fields)
  if (isFirebaseConfigured && db) {
    try {
      const sanitized = sanitizeForFirestore(newSubmission as unknown as Record<string, unknown>);
      const docRef = await addDoc(collection(db, "submissions"), sanitized);
      newSubmission.id = docRef.id;
    } catch (err) {
      console.warn("Could not add submission to Firestore:", err);
    }
  }

  localSubmissionsStore = [newSubmission, ...localSubmissionsStore];
  return newSubmission;
}

export async function approveSubmission(id: string): Promise<Article | null> {
  let submission = localSubmissionsStore.find((s) => s.id === id);

  if (!submission && isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "submissions", id));
      if (snap.exists()) {
        submission = { ...snap.data(), id: snap.id } as Submission;
        localSubmissionsStore = [submission, ...localSubmissionsStore];
      }
    } catch (e) {
      console.warn("Could not find submission by id in Firestore:", e);
    }
  }

  if (!submission) return null;

  submission.status = "approved";

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("submissions").update({ status: "approved" }).eq("id", id);
    } catch (err) {
      console.warn("Could not approve submission in Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "submissions", id);
      await updateDoc(docRef, { status: "approved" });
    } catch (err) {
      console.warn("Could not approve submission in Firestore:", err);
    }
  }

  const slug = submission.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Link author metadata if author is registered in newsroom members
  const member = localTeamMembersStore.find(
    (m) =>
      (submission.authorEmail && m.email.toLowerCase() === submission.authorEmail.toLowerCase()) ||
      m.name.toLowerCase() === submission.authorName.toLowerCase()
  );

  const newArticle = await createArticle({
    title: submission.title,
    slug,
    category: submission.category,
    coverImage: submission.coverImage || "/assets/hero-featured.jpg",
    excerpt: submission.excerpt,
    content: submission.content,
    tags: submission.tags || [],
    publishedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    readTime: submission.readTime,
    isLatest: true,
    isBreaking: submission.isBreaking || false,
    isFeatured: submission.isFeatured || false,
    scheduledAt: submission.scheduledAt,
    views: 0,
    author: {
      id: member ? member.id : "author-contributor",
      name: submission.authorName,
      slug: submission.authorName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      role: member ? `${member.desk} Journalist` : "Contributing Correspondent",
      avatar: member?.avatar || "/assets/social-image-1.png",
      bio: member?.bio || `Contributing journalist covering the ${submission.category} desk for The Zango.`,
    },
  });

  return newArticle;
}

export async function requestRevisionSubmission(id: string, feedbackNotes: string): Promise<boolean> {
  let submission = localSubmissionsStore.find((s) => s.id === id);
  if (!submission && isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "submissions", id));
      if (snap.exists()) {
        submission = { ...snap.data(), id: snap.id } as Submission;
        localSubmissionsStore = [submission, ...localSubmissionsStore];
      }
    } catch {
      // ignore
    }
  }
  if (!submission) return false;
  submission.status = "needs_revision";
  submission.feedbackNotes = feedbackNotes;

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("submissions")
        .update({ status: "needs_revision", feedback_notes: feedbackNotes })
        .eq("id", id);
    } catch (err) {
      console.warn("Could not update submission revision status in Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "submissions", id);
      await updateDoc(docRef, { status: "needs_revision", feedbackNotes });
    } catch (err) {
      console.warn("Could not update submission revision status in Firestore:", err);
    }
  }

  return true;
}

export async function updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | null> {
  let index = localSubmissionsStore.findIndex((s) => s.id === id);
  if (index === -1 && isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "submissions", id));
      if (snap.exists()) {
        const sub = { ...snap.data(), id: snap.id } as Submission;
        localSubmissionsStore = [sub, ...localSubmissionsStore];
        index = 0;
      }
    } catch {
      // ignore
    }
  }
  if (index === -1) return null;
  localSubmissionsStore[index] = { ...localSubmissionsStore[index], ...updates };

  if (isSupabaseConfigured && supabase) {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.excerpt) dbUpdates.excerpt = updates.excerpt;
      if (updates.content) dbUpdates.content = updates.content;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.coverImage) dbUpdates.cover_image = updates.coverImage;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.feedbackNotes !== undefined) dbUpdates.feedback_notes = updates.feedbackNotes;
      await supabase.from("submissions").update(dbUpdates).eq("id", id);
    } catch (err) {
      console.warn("Could not update submission in Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "submissions", id);
      const sanitized = sanitizeForFirestore(updates as Record<string, unknown>);
      await updateDoc(docRef, sanitized);
    } catch (err) {
      console.warn("Could not update submission in Firestore:", err);
    }
  }

  return localSubmissionsStore[index];
}

export async function rejectSubmission(id: string): Promise<boolean> {
  let submission = localSubmissionsStore.find((s) => s.id === id);
  if (!submission && isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "submissions", id));
      if (snap.exists()) {
        submission = { ...snap.data(), id: snap.id } as Submission;
        localSubmissionsStore = [submission, ...localSubmissionsStore];
      }
    } catch {
      // ignore
    }
  }
  if (!submission) return false;
  submission.status = "rejected";

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("submissions").update({ status: "rejected" }).eq("id", id);
    } catch (err) {
      console.warn("Could not reject submission in Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "submissions", id);
      await updateDoc(docRef, { status: "rejected" });
    } catch (err) {
      console.warn("Could not reject submission in Firestore:", err);
    }
  }

  return true;
}

export async function getPlatformMetrics() {
  const articles = await getArticles();
  const subscribers = await getSubscribers();
  const submissions = await getSubmissions();
  const pendingSubmissions = submissions.filter((s) => s.status === "pending").length;
  const totalViews = articles.reduce((acc, a) => acc + (a.views || 1200), 0);

  return {
    totalArticles: articles.length,
    publishedCount: articles.length,
    draftCount: pendingSubmissions,
    totalViews,
    totalSubscribers: subscribers.length,
  };
}


// ==============================================================================
// NEWSROOM TEAM ROSTER & ROLE MANAGEMENT
// ==============================================================================
let localTeamMembersStore: NewsroomMember[] = [
  {
    id: "member-1",
    name: "Usman Bello",
    email: "usman.bello@thezango.org",
    role: "admin",
    desk: "Executive & Investigation",
    avatar: "/assets/social-image-1.png",
    bio: "Chief Executive & Bureau Chief with 15+ years in Sahelian socio-political investigative reporting.",
    status: "active",
    articlesCount: 42,
    joinedAt: "2024-01-15",
  },
  {
    id: "member-2",
    name: "Aisha Dahiru",
    email: "aisha.dahiru@thezango.org",
    role: "editor",
    desk: "Business & Capital Markets",
    avatar: "/assets/social-image-2.png",
    bio: "Senior Markets Editor analyzing private equity, agribusiness finance, and trade dynamics across Northern Nigeria.",
    status: "active",
    articlesCount: 28,
    joinedAt: "2024-03-01",
  },
  {
    id: "member-3",
    name: "Ibrahim Garba",
    email: "ibrahim.garba@thezango.org",
    role: "editor",
    desk: "Security & Regional Conflict",
    avatar: "/assets/social-image-3.png",
    bio: "Defense and Lake Chad basin correspondent, specializing in counter-insurgency and humanitarian corridors.",
    status: "active",
    articlesCount: 35,
    joinedAt: "2024-04-10",
  },
  {
    id: "member-4",
    name: "Fatima Sanusi",
    email: "fatima.sanusi@thezango.org",
    role: "writer",
    desk: "Technology & Digital Economy",
    avatar: "/assets/social-image-4.png",
    bio: "Tech correspondent tracking venture capital, AI hubs, and mobile banking adoption from Kano to Kaduna.",
    status: "active",
    articlesCount: 19,
    joinedAt: "2024-06-20",
  },
  {
    id: "member-5",
    name: "Zainab Aliyu",
    email: "zainab.aliyu@thezango.org",
    role: "writer",
    desk: "Culture, Heritage & Arts",
    avatar: "/assets/social-image-1.png",
    bio: "Cultural essayist documenting Sahelian architecture, Hausa literature, and contemporary creative movements.",
    status: "active",
    articlesCount: 14,
    joinedAt: "2024-08-05",
  },
];

interface SupabaseTeamMemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  desk: string;
  avatar?: string;
  bio?: string;
  status: string;
  articles_count?: number;
  joined_at?: string;
  created_at?: string;
}

export async function getTeamMembers(): Promise<NewsroomMember[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("newsroom_members")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((d: SupabaseTeamMemberRow) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          role: d.role as NewsroomRole,
          desk: d.desk,
          avatar: d.avatar,
          bio: d.bio,
          status: d.status as "active" | "inactive",
          articlesCount: d.articles_count || 0,
          joinedAt: d.joined_at || d.created_at || "2024-01-01",
        }));
      }
    } catch (err) {
      console.warn("Could not fetch team members from Supabase:", err);
    }
  }

  // 2. Check Firebase Firestore
  if (isFirebaseConfigured && db && isFirestoreAvailable) {
    try {
      const q = query(collection(db, "team_members"), orderBy("joinedAt", "asc"));
      const querySnapshot = await withTimeout(getDocs(q), 3000, null);
      if (querySnapshot && !querySnapshot.empty) {
        return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NewsroomMember));
      }
    } catch (err) {
      console.warn("Could not fetch team members from Firestore, using local store:", err);
    }
  }

  return localTeamMembersStore;
}

export async function createTeamMember(
  data: Omit<NewsroomMember, "id" | "joinedAt" | "articlesCount">
): Promise<NewsroomMember> {
  const newMember: NewsroomMember = {
    ...data,
    id: "member-" + Date.now(),
    joinedAt: new Date().toISOString().split("T")[0],
    articlesCount: 0,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("newsroom_members").insert([
        {
          id: newMember.id,
          name: newMember.name,
          email: newMember.email,
          role: newMember.role,
          desk: newMember.desk,
          avatar: newMember.avatar || "/assets/social-image-1.png",
          bio: newMember.bio || "",
          status: newMember.status,
          articles_count: 0,
          joined_at: newMember.joinedAt,
        },
      ]);
    } catch (err) {
      console.warn("Could not save team member to Supabase:", err);
    }
  }

  // Persist to Firebase Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "team_members"), newMember);
      newMember.id = docRef.id;
    } catch (err) {
      console.warn("Could not add team member to Firestore:", err);
    }
  }

  localTeamMembersStore = [newMember, ...localTeamMembersStore];
  return newMember;
}

export async function updateTeamMemberRole(id: string, role: NewsroomRole): Promise<boolean> {
  const member = localTeamMembersStore.find((m) => m.id === id);
  if (!member) return false;
  member.role = role;

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("newsroom_members").update({ role }).eq("id", id);
    } catch (err) {
      console.warn("Could not update team member role in Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "team_members", id);
      await updateDoc(docRef, { role });
    } catch (err) {
      console.warn("Could not update team member role in Firestore:", err);
    }
  }

  return true;
}

export async function updateTeamMemberStatus(id: string, status: "active" | "inactive"): Promise<boolean> {
  const member = localTeamMembersStore.find((m) => m.id === id);
  if (!member) return false;
  member.status = status;

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("newsroom_members").update({ status }).eq("id", id);
    } catch (err) {
      console.warn("Could not update team member status in Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "team_members", id);
      await updateDoc(docRef, { status });
    } catch (err) {
      console.warn("Could not update team member status in Firestore:", err);
    }
  }

  return true;
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  localTeamMembersStore = localTeamMembersStore.filter((m) => m.id !== id);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("newsroom_members").delete().eq("id", id);
    } catch (err) {
      console.warn("Could not delete team member in Supabase:", err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "team_members", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Could not delete team member in Firestore:", err);
    }
  }

  return true;
}

// ==============================================================================
// USER PROFILES & ROLE-BASED ACCESS CONTROL (FIRESTORE)
// ==============================================================================
const localUserProfilesStore: Record<string, UserProfile> = {};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (localUserProfilesStore[uid]) {
    return localUserProfilesStore[uid];
  }

  if (isFirebaseConfigured && db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, "users", uid);
      const snap = await withTimeout(getDoc(docRef), 3000, null);
      if (snap && snap.exists()) {
        const data = snap.data() as UserProfile;
        const profile: UserProfile = {
          ...data,
          uid: snap.id,
        };
        localUserProfilesStore[uid] = profile;
        return profile;
      }
    } catch (err) {
      console.warn("Could not fetch user profile from Firestore:", err);
    }
  }

  return null;
}

export async function getOrCreateUserProfile(
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  },
  defaultRole: UserRole = "author"
): Promise<UserProfile> {
  const existing = await getUserProfile(user.uid);
  if (existing) {
    return existing;
  }

  // Derive role based on known staff email or default
  const emailLower = (user.email || "").toLowerCase();
  let assignedRole: UserRole = defaultRole;
  if (emailLower.includes("usman") || emailLower.includes("admin")) {
    assignedRole = "admin";
  } else if (emailLower.includes("editor") || emailLower.includes("aisha") || emailLower.includes("ibrahim")) {
    assignedRole = "editor";
  } else if (emailLower.includes("writer") || emailLower.includes("fatima") || emailLower.includes("sanusi")) {
    assignedRole = "author";
  }

  const now = new Date().toISOString();
  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email?.split("@")[0].replace(/[._-]/g, " ").toUpperCase() || "Newsroom Contributor",
    photoURL: user.photoURL || "/assets/social-image-1.png",
    role: assignedRole,
    desk: assignedRole === "admin" ? "Executive & Investigation" : assignedRole === "editor" ? "Editorial Desk" : "Technology & Digital Economy",
    bio: "",
    created_at: now,
    updated_at: now,
  };

  localUserProfilesStore[user.uid] = newProfile;

  if (isFirebaseConfigured && db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, sanitizeForFirestore(newProfile as unknown as Record<string, unknown>));
    } catch (err) {
      console.warn("Could not save new user profile to Firestore:", err);
    }
  }

  return newProfile;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  const now = new Date().toISOString();
  const current = localUserProfilesStore[uid];
  if (current) {
    localUserProfilesStore[uid] = {
      ...current,
      ...updates,
      updated_at: now,
    };
  }

  if (isFirebaseConfigured && db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, sanitizeForFirestore({ ...updates, updated_at: now }));
      return true;
    } catch (err) {
      console.warn("Could not update user profile in Firestore:", err);
      return false;
    }
  }

  return true;
}

export async function setUserRole(uid: string, role: UserRole): Promise<boolean> {
  return await updateUserProfile(uid, { role });
}
