import { db, isFirebaseConfigured } from "./config";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Article, Subscriber } from "@/types";
import { ARTICLES } from "@/data/mock-articles";

let localArticlesStore: Article[] = [...ARTICLES];
let localSubscribersStore: Subscriber[] = [
  { email: "ibrahim.k@startupkano.com", subscribedAt: "2026-07-20" },
  { email: "fatima.al@kadunahub.ng", subscribedAt: "2026-07-21" },
  { email: "usman.tech@innovate.ng", subscribedAt: "2026-07-22" },
  { email: "maryam.s@oxfordalumni.org", subscribedAt: "2026-07-23" },
  { email: "bello.invest@savannah.vc", subscribedAt: "2026-07-24" },
];

export async function getArticles(): Promise<Article[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "articles"), orderBy("publishedAt", "desc"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
      }
    } catch (err) {
      console.warn("Could not fetch articles from Firestore, using local store:", err);
    }
  }

  // Ensure any newly added mock articles are synchronized into the local store
  const existingIds = new Set(localArticlesStore.map((a) => a.id));
  const missingArticles = ARTICLES.filter((a) => !existingIds.has(a.id));
  if (missingArticles.length > 0) {
    localArticlesStore = [...localArticlesStore, ...missingArticles];
  }

  return localArticlesStore;
}

export async function createArticle(articleData: Omit<Article, "id">): Promise<Article> {
  const newArticle: Article = {
    ...articleData,
    id: `art-${Date.now()}`,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "articles"), newArticle);
      newArticle.id = docRef.id;
    } catch (err) {
      console.warn("Could not add article to Firestore, saving locally:", err);
    }
  }

  localArticlesStore = [newArticle, ...localArticlesStore];
  return newArticle;
}

export async function deleteArticle(id: string): Promise<boolean> {
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
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "subscribers"), orderBy("subscribedAt", "desc"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
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

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, "articles", id), updates as any);
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

let localSubmissionsStore: import("@/types").Submission[] = [
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

export async function getSubmissions(): Promise<import("@/types").Submission[]> {
  return localSubmissionsStore;
}

export async function createSubmission(
  subData: Omit<import("@/types").Submission, "id" | "submittedAt" | "status">
): Promise<import("@/types").Submission> {
  const newSubmission: import("@/types").Submission = {
    ...subData,
    id: `sub-${Date.now()}`,
    submittedAt: "Just now",
    status: "pending",
  };
  localSubmissionsStore = [newSubmission, ...localSubmissionsStore];
  return newSubmission;
}

export async function approveSubmission(id: string): Promise<Article | null> {
  const submission = localSubmissionsStore.find((s) => s.id === id);
  if (!submission) return null;

  submission.status = "approved";

  const slug = submission.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const newArticle = await createArticle({
    title: submission.title,
    slug,
    category: submission.category,
    coverImage: submission.coverImage || "/assets/hero-featured.jpg",
    excerpt: submission.excerpt,
    content: submission.content,
    publishedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    readTime: submission.readTime,
    isLatest: true,
    views: 0,
    author: {
      id: "author-contributor",
      name: submission.authorName,
      slug: submission.authorName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      role: "Contributing Correspondent",
    },
  });

  return newArticle;
}

export async function rejectSubmission(id: string): Promise<boolean> {
  const submission = localSubmissionsStore.find((s) => s.id === id);
  if (!submission) return false;
  submission.status = "rejected";
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
