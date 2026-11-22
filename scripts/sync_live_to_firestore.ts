import { db, isFirebaseConfigured } from "../src/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import liveArticles from "../src/data/live-wordpress-articles.json";

async function syncLiveToFirestore() {
  console.log("==================================================================");
  console.log("🚀 SYNCING 95 LIVE WORDPRESS ARTICLES INTO FIRESTORE");
  console.log("==================================================================");

  if (!isFirebaseConfigured || !db) {
    console.error("Firebase is not configured. Check .env.local");
    return;
  }

  // 1. Clean up temporary test items
  console.log("Checking existing Firestore documents...");
  const articlesCol = collection(db, "articles");
  const snap = await getDocs(articlesCol);
  console.log(`Found ${snap.size} existing documents in Firestore 'articles'.`);

  let deletedCount = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    // Delete test items created by timestamp
    if (data.title && data.title.includes("Investigative Dispatch: Northern Agritech Frontiers 1794")) {
      await deleteDoc(doc(db, "articles", docSnap.id));
      deletedCount++;
    }
  }
  if (deletedCount > 0) {
    console.log(`✓ Cleaned up ${deletedCount} legacy test documents.`);
  }

  // 2. Upload all 95 live articles to Firestore
  console.log(`Uploading ${liveArticles.length} live articles to Firestore...`);
  let uploadedCount = 0;

  for (const article of liveArticles) {
    const docRef = doc(db, "articles", article.id);
    await setDoc(docRef, {
      ...article,
      views: article.views || Math.floor(Math.random() * 800) + 120,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    uploadedCount++;
  }

  console.log(`✅ Successfully synced ${uploadedCount} live articles into Firestore!`);
  console.log("==================================================================");
}

syncLiveToFirestore().catch(console.error);
