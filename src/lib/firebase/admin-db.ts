import { adminDb, isFirebaseAdminConfigured } from "./admin";
import {
  addSubscriber,
  approveSubmission,
  createArticle,
  createMerchantApplication,
  createSubmission,
  createTeamMember,
  deleteArticle,
  deleteTeamMember,
  findStaffByIdentifier,
  getArticleBySlug,
  getArticles,
  getMerchantApplications,
  getOrCreateUserProfile,
  getPlatformMetrics,
  getSubmissions,
  getSubscribers,
  getTeamMembers,
  mapFirestoreToArticle,
  rejectSubmission,
  requestRevisionSubmission,
  toggleArticleFlag,
  updateArticle,
  updateMerchantApplicationStatus,
  updateStaffPassword,
  updateSubmission,
  updateTeamMemberRole,
  updateTeamMemberStatus,
} from "./db";
import { ARTICLES } from "@/data/mock-articles";
import LIVE_WORDPRESS_ARTICLES from "@/data/live-wordpress-articles.json";
import { getSiteSocials, updateSiteSocials } from "@/lib/site-socials";
import { SITE_CONFIG, SiteSocials } from "@/config/site";
import {
  Article,
  MerchantApplication,
  NewsroomMember,
  NewsroomRole,
  Submission,
  Subscriber,
  UserProfile,
  UserRole,
} from "@/types";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        out[k] = stripUndefined(v as Record<string, unknown>);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

const seedArticlesFallback: Article[] = [
  ...(LIVE_WORDPRESS_ARTICLES as Article[]),
  ...ARTICLES,
];

// ==============================================================================
// TEAM MEMBERS & AUTHENTICATION (SERVER ADMIN SDK)
// ==============================================================================

export async function getTeamMembersServer(): Promise<NewsroomMember[]> {
  if (isFirebaseAdminConfigured && adminDb) {
    const snap = await adminDb.collection("team_members").get();
    return snap.docs
      .map((d) => ({ ...d.data(), id: d.id } as NewsroomMember))
      .sort((a, b) => (a.joinedAt || "").localeCompare(b.joinedAt || ""));
  }
  return getTeamMembers();
}

export async function getAllUsernamesServer(): Promise<string[]> {
  const members = await getTeamMembersServer();
  return members
    .map((m) => m.username)
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0);
}

export async function findStaffByIdentifierServer(identifier: string): Promise<NewsroomMember | null> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;

  if (isFirebaseAdminConfigured && adminDb) {
    const col = adminDb.collection("team_members");

    const snapUser = await col.where("username", "==", clean).limit(1).get();
    if (!snapUser.empty) {
      const d = snapUser.docs[0];
      return { ...d.data(), id: d.id } as NewsroomMember;
    }

    const snapEmail = await col.where("email", "==", clean).limit(1).get();
    if (!snapEmail.empty) {
      const d = snapEmail.docs[0];
      return { ...d.data(), id: d.id } as NewsroomMember;
    }

    const allSnap = await col.get();
    const matched = allSnap.docs.find((d) => {
      const data = d.data();
      const u = (data.username || "").toLowerCase();
      const e = (data.email || "").toLowerCase();
      return u === clean || e === clean;
    });
    return matched ? ({ ...matched.data(), id: matched.id } as NewsroomMember) : null;
  }

  return findStaffByIdentifier(clean);
}

export async function createTeamMemberServer(
  data: Omit<NewsroomMember, "id" | "joinedAt" | "articlesCount">
): Promise<NewsroomMember> {
  if (isFirebaseAdminConfigured && adminDb) {
    const newMember: NewsroomMember = {
      ...data,
      id: "member-" + Date.now(),
      joinedAt: new Date().toISOString().split("T")[0],
      articlesCount: 0,
    };
    await adminDb
      .collection("team_members")
      .doc(newMember.id)
      .set(stripUndefined(newMember as unknown as Record<string, unknown>));
    return newMember;
  }
  return createTeamMember(data);
}

export async function updateStaffPasswordServer(
  memberIdOrIdentifier: string,
  newHash: string,
  newSalt: string,
  options?: { mustChangePassword?: boolean; username?: string }
): Promise<boolean> {
  if (isFirebaseAdminConfigured && adminDb) {
    const mustChange = options?.mustChangePassword ?? false;
    const payload = stripUndefined({
      passwordHash: newHash,
      passwordSalt: newSalt,
      mustChangePassword: mustChange,
      username: options?.username,
    });

    const docRef = adminDb.collection("team_members").doc(memberIdOrIdentifier);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.update(payload);
      return true;
    }

    const q = await adminDb
      .collection("team_members")
      .where("id", "==", memberIdOrIdentifier)
      .get();
    if (!q.empty) {
      await Promise.all(q.docs.map((d) => d.ref.update(payload)));
      return true;
    }
    return false;
  }

  return updateStaffPassword(memberIdOrIdentifier, newHash, newSalt, options);
}

export async function updateTeamMemberRoleServer(id: string, role: NewsroomRole): Promise<boolean> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("team_members").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.update({ role });
      return true;
    }
    const q = await adminDb.collection("team_members").where("id", "==", id).get();
    if (!q.empty) {
      await Promise.all(q.docs.map((d) => d.ref.update({ role })));
      return true;
    }
    return false;
  }
  return updateTeamMemberRole(id, role);
}

export async function updateTeamMemberStatusServer(
  id: string,
  status: "active" | "inactive"
): Promise<boolean> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("team_members").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.update({ status });
      return true;
    }
    const q = await adminDb.collection("team_members").where("id", "==", id).get();
    if (!q.empty) {
      await Promise.all(q.docs.map((d) => d.ref.update({ status })));
      return true;
    }
    return false;
  }
  return updateTeamMemberStatus(id, status);
}

export async function deleteTeamMemberServer(id: string): Promise<boolean> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("team_members").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.delete();
      return true;
    }
    const q = await adminDb.collection("team_members").where("id", "==", id).get();
    if (!q.empty) {
      await Promise.all(q.docs.map((d) => d.ref.delete()));
      return true;
    }
    return false;
  }
  return deleteTeamMember(id);
}

export async function getOrCreateUserProfileServer(
  fbUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  },
  defaultRole: UserRole = "reader"
): Promise<UserProfile> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("users").doc(fbUser.uid);
    const snap = await docRef.get();
    if (snap.exists) {
      return snap.data() as UserProfile;
    }

    const email = fbUser.email || "";
    const newProfile: UserProfile = {
      uid: fbUser.uid,
      email,
      displayName: fbUser.displayName || email.split("@")[0] || "The Zango Reader",
      photoURL: fbUser.photoURL || "/assets/social-image-1.png",
      role: defaultRole,
      desk: defaultRole === "reader" ? "General" : "Editorial Desk",
      bio: "Verified member of The Zango digital publishing network.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await docRef.set(newProfile);
    return newProfile;
  }

  return getOrCreateUserProfile(fbUser, defaultRole);
}

// ==============================================================================
// SITE SOCIAL MEDIA LINKS (SERVER ADMIN SDK)
// ==============================================================================

export async function getSiteSocialsServer(): Promise<SiteSocials> {
  if (isFirebaseAdminConfigured && adminDb) {
    const snap = await adminDb.collection("site_settings").doc("socials").get();
    if (snap.exists) {
      const data = snap.data() as Partial<SiteSocials>;
      return {
        twitter: { ...SITE_CONFIG.socials.twitter, ...(data.twitter || {}) },
        linkedin: { ...SITE_CONFIG.socials.linkedin, ...(data.linkedin || {}) },
        instagram: { ...SITE_CONFIG.socials.instagram, ...(data.instagram || {}) },
        facebook: { ...SITE_CONFIG.socials.facebook, ...(data.facebook || {}) },
      };
    }
    return SITE_CONFIG.socials;
  }
  return getSiteSocials();
}

export async function updateSiteSocialsServer(socials: SiteSocials): Promise<SiteSocials> {
  if (isFirebaseAdminConfigured && adminDb) {
    await adminDb.collection("site_settings").doc("socials").set(socials, { merge: true });
    return socials;
  }
  return updateSiteSocials(socials);
}

// ==============================================================================
// ARTICLES (SERVER ADMIN SDK)
// ==============================================================================

export async function getArticlesServer(): Promise<Article[]> {
  if (isFirebaseAdminConfigured && adminDb) {
    try {
      const snap = await adminDb
        .collection("articles")
        .orderBy("publishedAt", "desc")
        .get();
      if (!snap.empty) {
        const fsArticles = snap.docs.map((d) =>
          mapFirestoreToArticle(d.id, d.data() as Record<string, unknown>)
        );
        const liveArticles = fsArticles.filter((a) => a.id.startsWith("wp-"));
        const otherArticles = fsArticles.filter((a) => !a.id.startsWith("wp-"));
        const sortedFs = [...liveArticles, ...otherArticles];
        const fsSlugs = new Set(sortedFs.map((a) => a.slug.toLowerCase()));
        const missing = seedArticlesFallback.filter((a) => !fsSlugs.has(a.slug.toLowerCase()));
        return [...sortedFs, ...missing];
      }
    } catch (err) {
      console.warn("Admin getArticlesServer error, falling back:", err);
    }
  }
  return getArticles();
}

export async function getArticleBySlugServer(slug: string): Promise<Article | null> {
  const slugLower = slug.toLowerCase();
  if (isFirebaseAdminConfigured && adminDb) {
    try {
      const snap = await adminDb
        .collection("articles")
        .where("slug", "==", slugLower)
        .limit(1)
        .get();
      if (!snap.empty) {
        const d = snap.docs[0];
        return mapFirestoreToArticle(d.id, d.data() as Record<string, unknown>);
      }
      const fallback = seedArticlesFallback.find((a) => a.slug.toLowerCase() === slugLower);
      if (fallback) return fallback;
    } catch (err) {
      console.warn("Admin getArticleBySlugServer error:", err);
    }
  }
  return getArticleBySlug(slug);
}

export async function createArticleServer(articleData: Omit<Article, "id">): Promise<Article> {
  if (isFirebaseAdminConfigured && adminDb) {
    const newId = "art-" + Date.now();
    const newArticle: Article = { ...articleData, id: newId };
    await adminDb
      .collection("articles")
      .doc(newId)
      .set(stripUndefined(newArticle as unknown as Record<string, unknown>));
    return newArticle;
  }
  return createArticle(articleData);
}

export async function updateArticleServer(
  id: string,
  updates: Partial<Article>
): Promise<Article | null> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("articles").doc(id);
    const snap = await docRef.get();
    const cleanUpdates = stripUndefined(updates as Record<string, unknown>);
    if (snap.exists) {
      await docRef.update(cleanUpdates);
      const updated = await docRef.get();
      return mapFirestoreToArticle(updated.id, (updated.data() || {}) as Record<string, unknown>);
    }
    const q = await adminDb.collection("articles").where("id", "==", id).limit(1).get();
    if (!q.empty) {
      await q.docs[0].ref.update(cleanUpdates);
      const updated = await q.docs[0].ref.get();
      return mapFirestoreToArticle(updated.id, (updated.data() || {}) as Record<string, unknown>);
    }
    const seedMatch = seedArticlesFallback.find((a) => a.id === id);
    if (seedMatch) {
      const merged = { ...seedMatch, ...updates };
      await docRef.set(stripUndefined(merged as unknown as Record<string, unknown>));
      return merged;
    }
    return null;
  }
  return updateArticle(id, updates);
}

export async function toggleArticleFlagServer(
  id: string,
  flag: "isFeatured" | "isLatest" | "isTrending" | "isPopular" | "isEditorsPick" | "isBreaking"
): Promise<Article | null> {
  if (isFirebaseAdminConfigured && adminDb) {
    const articles = await getArticlesServer();
    const article = articles.find((a) => a.id === id);
    if (!article) return null;
    const currentValue = !!article[flag];
    return updateArticleServer(id, { [flag]: !currentValue });
  }
  if (flag === "isFeatured" || flag === "isLatest" || flag === "isTrending" || flag === "isEditorsPick") {
    return toggleArticleFlag(id, flag);
  }
  return updateArticle(id, {});
}

export async function deleteArticleServer(id: string): Promise<boolean> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("articles").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.delete();
      return true;
    }
    const q = await adminDb.collection("articles").where("id", "==", id).get();
    if (!q.empty) {
      await Promise.all(q.docs.map((d) => d.ref.delete()));
      return true;
    }
    return false;
  }
  return deleteArticle(id);
}

// ==============================================================================
// SUBMISSIONS (SERVER ADMIN SDK)
// ==============================================================================

export async function getSubmissionsServer(): Promise<Submission[]> {
  if (isFirebaseAdminConfigured && adminDb) {
    const snap = await adminDb
      .collection("submissions")
      .orderBy("submittedAt", "desc")
      .get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Submission));
  }
  return getSubmissions();
}

export async function createSubmissionServer(
  subData: Omit<Submission, "id" | "submittedAt" | "status">
): Promise<Submission> {
  if (isFirebaseAdminConfigured && adminDb) {
    const newId = "sub-" + Date.now();
    const newSub: Submission = {
      ...subData,
      id: newId,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    await adminDb
      .collection("submissions")
      .doc(newId)
      .set(stripUndefined(newSub as unknown as Record<string, unknown>));
    return newSub;
  }
  return createSubmission(subData);
}

export async function updateSubmissionServer(
  id: string,
  updates: Partial<Submission>
): Promise<Submission | null> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("submissions").doc(id);
    const snap = await docRef.get();
    const cleanUpdates = stripUndefined(updates as Record<string, unknown>);
    if (snap.exists) {
      await docRef.update(cleanUpdates);
      const updated = await docRef.get();
      return { ...updated.data(), id: updated.id } as Submission;
    }
    return null;
  }
  return updateSubmission(id, updates);
}

export async function approveSubmissionServer(id: string): Promise<Article | null> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("submissions").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const sub = { ...snap.data(), id: snap.id } as Submission;
    await docRef.update({ status: "approved" });

    const slug =
      sub.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60) +
      "-" +
      Date.now().toString().slice(-4);

    return createArticleServer({
      title: sub.title,
      slug,
      excerpt: sub.excerpt,
      content: sub.content,
      coverImage: sub.coverImage || "/assets/hero-featured.jpg",
      category: sub.category,
      tags: sub.tags || [sub.category, "Northern Nigeria"],
      publishedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      readTime: sub.readTime || "4 min read",
      isLatest: true,
      isBreaking: !!sub.isBreaking,
      author: {
        id: "author-" + Date.now(),
        name: sub.authorName,
        slug: sub.authorName.toLowerCase().replace(/\s+/g, "-"),
        role: "Correspondent",
        avatar: "/assets/social-image-1.png",
      },
    });
  }
  return approveSubmission(id);
}

export async function requestRevisionSubmissionServer(
  id: string,
  feedbackNotes: string
): Promise<boolean> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("submissions").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return false;
    await docRef.update({
      status: "needs_revision",
      feedbackNotes,
      reviewedAt: new Date().toISOString(),
    });
    return true;
  }
  return requestRevisionSubmission(id, feedbackNotes);
}

export async function rejectSubmissionServer(id: string): Promise<boolean> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("submissions").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return false;
    await docRef.update({ status: "rejected" });
    return true;
  }
  return rejectSubmission(id);
}

// ==============================================================================
// SUBSCRIBERS & MERCHANTS & METRICS (SERVER ADMIN SDK)
// ==============================================================================

export async function getSubscribersServer(): Promise<Subscriber[]> {
  if (isFirebaseAdminConfigured && adminDb) {
    const snap = await adminDb
      .collection("subscribers")
      .orderBy("subscribedAt", "desc")
      .get();
    return snap.docs.map((d) => d.data() as Subscriber);
  }
  return getSubscribers();
}

export async function addSubscriberServer(email: string): Promise<Subscriber> {
  if (isFirebaseAdminConfigured && adminDb) {
    const cleanEmail = email.trim().toLowerCase();
    const newSub: Subscriber = {
      email: cleanEmail,
      subscribedAt: new Date().toISOString().split("T")[0],
    };
    await adminDb.collection("subscribers").add(newSub);
    return newSub;
  }
  return addSubscriber(email);
}

export async function getMerchantApplicationsServer(): Promise<MerchantApplication[]> {
  if (isFirebaseAdminConfigured && adminDb) {
    const snap = await adminDb
      .collection("merchants")
      .orderBy("submittedAt", "desc")
      .get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MerchantApplication));
  }
  return getMerchantApplications();
}

export async function createMerchantApplicationServer(
  data: Omit<MerchantApplication, "id" | "submittedAt" | "status">
): Promise<MerchantApplication> {
  if (isFirebaseAdminConfigured && adminDb) {
    const newId = "merch-" + Date.now();
    const newMerchant: MerchantApplication = {
      ...data,
      id: newId,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    await adminDb
      .collection("merchants")
      .doc(newId)
      .set(stripUndefined(newMerchant as unknown as Record<string, unknown>));
    return newMerchant;
  }
  return createMerchantApplication(data);
}

export async function updateMerchantApplicationStatusServer(
  id: string,
  status: MerchantApplication["status"],
  notes?: string,
  reviewedBy?: string
): Promise<MerchantApplication | null> {
  if (isFirebaseAdminConfigured && adminDb) {
    const docRef = adminDb.collection("merchants").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    const updates = stripUndefined({ status, notes, reviewedBy });
    await docRef.update(updates);
    const updated = await docRef.get();
    return { ...updated.data(), id: updated.id } as MerchantApplication;
  }
  return updateMerchantApplicationStatus(id, status, notes, reviewedBy);
}

export async function getPlatformMetricsServer() {
  if (isFirebaseAdminConfigured && adminDb) {
    const [articles, subscribers, submissions] = await Promise.all([
      getArticlesServer(),
      getSubscribersServer(),
      getSubmissionsServer(),
    ]);
    return {
      totalArticles: articles.length,
      totalViews: "482.4K",
      totalSubscribers: subscribers.length + 1420,
      draftCount: submissions.filter((s) => s.status === "pending").length,
    };
  }
  return getPlatformMetrics();
}
