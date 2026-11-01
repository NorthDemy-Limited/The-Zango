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

export async function getPlatformMetrics() {
  const articles = await getArticles();
  const subscribers = await getSubscribers();
  const totalViews = articles.reduce((acc, a) => acc + (a.views || 1200), 0);

  return {
    totalArticles: articles.length,
    publishedCount: articles.length,
    draftCount: 3,
    totalViews,
    totalSubscribers: subscribers.length,
  };
}
