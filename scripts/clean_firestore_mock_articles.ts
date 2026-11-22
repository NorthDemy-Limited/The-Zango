import { db, isFirebaseConfigured } from "../src/lib/firebase/config";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";

async function cleanFirestoreMockArticles() {
  console.log("==================================================================");
  console.log("🧹 PURGING LEGACY MOCK ARTICLES FROM FIRESTORE");
  console.log("==================================================================");

  if (!isFirebaseConfigured || !db) {
    console.error("Firebase is not configured.");
    return;
  }

  const articlesCol = collection(db, "articles");
  const snap = await getDocs(articlesCol);
  console.log(`Scanning ${snap.size} total documents in Firestore 'articles'...`);

  let deletedCount = 0;
  let liveCount = 0;

  for (const docSnap of snap.docs) {
    const id = docSnap.id;
    // Any legacy mock document starting with 'art-' or test titles
    if (id.startsWith("art-") || docSnap.data().title?.includes("Investigative Dispatch: Northern Agritech Frontiers")) {
      await deleteDoc(doc(db, "articles", id));
      console.log(`Deleted legacy mock article: ${id} - "${docSnap.data().title}"`);
      deletedCount++;
    } else if (id.startsWith("wp-")) {
      liveCount++;
    }
  }

  console.log(`\n✓ Deleted ${deletedCount} legacy mock documents.`);
  console.log(`✓ Retained ${liveCount} genuine live WordPress articles in Firestore.`);
  console.log("==================================================================");
}

cleanFirestoreMockArticles()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
