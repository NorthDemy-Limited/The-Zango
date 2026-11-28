import {
  fsAddDoc,
  fsDeleteDoc,
  fsGetDoc,
  fsListDocs,
  fsSetDoc,
  fsUpdateDoc,
  isFirebaseAdminConfigured,
} from "./admin";
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
// TEAM MEMBERS & AUTHENTICATION (SERVER REST CLIENT WITH ADMIN PRIVILEGE)
// ==============================================================================

export async function getTeamMembersServer(): Promise<NewsroomMember[]> {
  if (isFirebaseAdminConfigured) {
    const docs = await fsListDocs("team_members");
    return docs
      .map((d) => d as unknown as NewsroomMember)
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

  if (isFirebaseAdminConfigured) {
    const docs = await fsListDocs("team_members");
    const matched = docs.find((d) => {
      const u = String(d.username || "").toLowerCase();
      const e = String(d.email || "").toLowerCase();
      return u === clean || e === clean;
    });
    return matched ? (matched as unknown as NewsroomMember) : null;
  }

  return findStaffByIdentifier(clean);
}

export async function createTeamMemberServer(
  data: Omit<NewsroomMember, "id" | "joinedAt" | "articlesCount">
): Promise<NewsroomMember> {
  if (isFirebaseAdminConfigured) {
    const newMember: NewsroomMember = {
      ...data,
      id: "member-" + Date.now(),
      joinedAt: new Date().toISOString().split("T")[0],
      articlesCount: 0,
    };
    await fsSetDoc(
      "team_members",
      newMember.id,
      stripUndefined(newMember as unknown as Record<string, unknown>)
    );
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
  if (isFirebaseAdminConfigured) {
    const mustChange = options?.mustChangePassword ?? false;
    const payload = stripUndefined({
      passwordHash: newHash,
      passwordSalt: newSalt,
      mustChangePassword: mustChange,
      username: options?.username,
    });

    const existing = await fsGetDoc("team_members", memberIdOrIdentifier);
    if (existing) {
      await fsUpdateDoc("team_members", memberIdOrIdentifier, payload);
      return true;
    }

    const all = await fsListDocs("team_members");
    const clean = memberIdOrIdentifier.trim().toLowerCase();
    const match = all.find(
      (d) =>
        d.id === memberIdOrIdentifier ||
        String(d.username || "").toLowerCase() === clean ||
        String(d.email || "").toLowerCase() === clean
    );
    if (match) {
      await fsUpdateDoc("team_members", match.id, payload);
      return true;
    }
    return false;
  }

  return updateStaffPassword(memberIdOrIdentifier, newHash, newSalt, options);
}

export async function updateTeamMemberRoleServer(id: string, role: NewsroomRole): Promise<boolean> {
  if (isFirebaseAdminConfigured) {
    const existing = await fsGetDoc("team_members", id);
    if (existing) {
      await fsUpdateDoc("team_members", id, { role });
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
  if (isFirebaseAdminConfigured) {
    const existing = await fsGetDoc("team_members", id);
    if (existing) {
      await fsUpdateDoc("team_members", id, { status });
      return true;
    }
    return false;
  }
  return updateTeamMemberStatus(id, status);
}

export async function deleteTeamMemberServer(id: string): Promise<boolean> {
  if (isFirebaseAdminConfigured) {
    await fsDeleteDoc("team_members", id);
    return true;
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
  if (isFirebaseAdminConfigured) {
    const existing = await fsGetDoc("users", fbUser.uid);
    if (existing) {
      return existing as unknown as UserProfile;
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
    await fsSetDoc("users", fbUser.uid, newProfile as unknown as Record<string, unknown>);
    return newProfile;
  }

  return getOrCreateUserProfile(fbUser, defaultRole);
}

// ==============================================================================
// SITE SOCIAL MEDIA LINKS (SERVER REST CLIENT)
// ==============================================================================

export async function getSiteSocialsServer(): Promise<SiteSocials> {
  if (isFirebaseAdminConfigured) {
    const data = await fsGetDoc("site_settings", "socials");
    if (data) {
      const parsed = data as unknown as Partial<SiteSocials>;
      return {
        twitter: { ...SITE_CONFIG.socials.twitter, ...(parsed.twitter || {}) },
        linkedin: { ...SITE_CONFIG.socials.linkedin, ...(parsed.linkedin || {}) },
        instagram: { ...SITE_CONFIG.socials.instagram, ...(parsed.instagram || {}) },
        facebook: { ...SITE_CONFIG.socials.facebook, ...(parsed.facebook || {}) },
      };
    }
    return SITE_CONFIG.socials;
  }
  return getSiteSocials();
}

export async function updateSiteSocialsServer(socials: SiteSocials): Promise<SiteSocials> {
  if (isFirebaseAdminConfigured) {
    await fsSetDoc(
      "site_settings",
      "socials",
      stripUndefined(socials as unknown as Record<string, unknown>)
    );
    return socials;
  }
  return updateSiteSocials(socials);
}

// ==============================================================================
// ARTICLES (SERVER REST CLIENT)
// ==============================================================================

export async function getArticlesServer(revalidateSeconds?: number): Promise<Article[]> {
  if (isFirebaseAdminConfigured) {
    try {
      const docs = await fsListDocs("articles", revalidateSeconds);
      if (docs.length > 0) {
        const fsArticles = docs
          .map((d) => mapFirestoreToArticle(d.id, d))
          .sort((a, b) =>
            String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""))
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
  const articles = await getArticlesServer();
  return articles.find((a) => a.slug.toLowerCase() === slugLower) || null;
}

export async function createArticleServer(articleData: Omit<Article, "id">): Promise<Article> {
  if (isFirebaseAdminConfigured) {
    const newId = "art-" + Date.now();
    const newArticle: Article = { ...articleData, id: newId };
    await fsSetDoc(
      "articles",
      newId,
      stripUndefined(newArticle as unknown as Record<string, unknown>)
    );
    return newArticle;
  }
  return createArticle(articleData);
}

export async function updateArticleServer(
  id: string,
  updates: Partial<Article>
): Promise<Article | null> {
  if (isFirebaseAdminConfigured) {
    const cleanUpdates = stripUndefined(updates as Record<string, unknown>);
    const existing = await fsGetDoc("articles", id);
    if (existing) {
      await fsUpdateDoc("articles", id, cleanUpdates);
      const updated = await fsGetDoc("articles", id);
      return updated ? mapFirestoreToArticle(id, updated) : null;
    }
    const seedMatch = seedArticlesFallback.find((a) => a.id === id);
    if (seedMatch) {
      const merged = { ...seedMatch, ...updates };
      await fsSetDoc(
        "articles",
        id,
        stripUndefined(merged as unknown as Record<string, unknown>)
      );
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
  if (isFirebaseAdminConfigured) {
    const articles = await getArticlesServer();
    const article = articles.find((a) => a.id === id);
    if (!article) return null;
    const currentValue = !!article[flag];
    return updateArticleServer(id, { [flag]: !currentValue });
  }
  if (
    flag === "isFeatured" ||
    flag === "isLatest" ||
    flag === "isTrending" ||
    flag === "isEditorsPick"
  ) {
    return toggleArticleFlag(id, flag);
  }
  return updateArticle(id, {});
}

export async function deleteArticleServer(id: string): Promise<boolean> {
  if (isFirebaseAdminConfigured) {
    await fsDeleteDoc("articles", id);
    return true;
  }
  return deleteArticle(id);
}

// ==============================================================================
// SUBMISSIONS (SERVER REST CLIENT)
// ==============================================================================

export async function getSubmissionsServer(): Promise<Submission[]> {
  if (isFirebaseAdminConfigured) {
    const docs = await fsListDocs("submissions");
    return docs
      .map((d) => d as unknown as Submission)
      .sort((a, b) =>
        String(b.submittedAt || "").localeCompare(String(a.submittedAt || ""))
      );
  }
  return getSubmissions();
}

export async function createSubmissionServer(
  subData: Omit<Submission, "id" | "submittedAt" | "status">
): Promise<Submission> {
  if (isFirebaseAdminConfigured) {
    const newId = "sub-" + Date.now();
    const newSub: Submission = {
      ...subData,
      id: newId,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    await fsSetDoc(
      "submissions",
      newId,
      stripUndefined(newSub as unknown as Record<string, unknown>)
    );
    return newSub;
  }
  return createSubmission(subData);
}

export async function updateSubmissionServer(
  id: string,
  updates: Partial<Submission>
): Promise<Submission | null> {
  if (isFirebaseAdminConfigured) {
    const existing = await fsGetDoc("submissions", id);
    if (!existing) return null;
    await fsUpdateDoc("submissions", id, stripUndefined(updates as Record<string, unknown>));
    const updated = await fsGetDoc("submissions", id);
    return updated ? (updated as unknown as Submission) : null;
  }
  return updateSubmission(id, updates);
}

export async function approveSubmissionServer(id: string): Promise<Article | null> {
  if (isFirebaseAdminConfigured) {
    const existing = await fsGetDoc("submissions", id);
    if (!existing) return null;

    const sub = existing as unknown as Submission;
    await fsUpdateDoc("submissions", id, { status: "approved" });

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
  if (isFirebaseAdminConfigured) {
    const existing = await fsGetDoc("submissions", id);
    if (!existing) return false;
    await fsUpdateDoc("submissions", id, {
      status: "needs_revision",
      feedbackNotes,
      reviewedAt: new Date().toISOString(),
    });
    return true;
  }
  return requestRevisionSubmission(id, feedbackNotes);
}

export async function rejectSubmissionServer(id: string): Promise<boolean> {
  if (isFirebaseAdminConfigured) {
    const existing = await fsGetDoc("submissions", id);
    if (!existing) return false;
    await fsUpdateDoc("submissions", id, { status: "rejected" });
    return true;
  }
  return rejectSubmission(id);
}

// ==============================================================================
// SUBSCRIBERS, MERCHANTS & METRICS (SERVER REST CLIENT)
// ==============================================================================

export async function getSubscribersServer(): Promise<Subscriber[]> {
  if (isFirebaseAdminConfigured) {
    const docs = await fsListDocs("subscribers");
    return docs
      .map((d) => ({
        email: String(d.email || ""),
        subscribedAt: String(d.subscribedAt || ""),
      }))
      .sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));
  }
  return getSubscribers();
}

export async function addSubscriberServer(email: string): Promise<Subscriber> {
  if (isFirebaseAdminConfigured) {
    const cleanEmail = email.trim().toLowerCase();
    const newSub: Subscriber = {
      email: cleanEmail,
      subscribedAt: new Date().toISOString().split("T")[0],
    };
    await fsAddDoc("subscribers", newSub as unknown as Record<string, unknown>);
    return newSub;
  }
  return addSubscriber(email);
}

export async function getMerchantApplicationsServer(): Promise<MerchantApplication[]> {
  if (isFirebaseAdminConfigured) {
    const docs = await fsListDocs("merchants");
    return docs
      .map((d) => d as unknown as MerchantApplication)
      .sort((a, b) =>
        String(b.submittedAt || "").localeCompare(String(a.submittedAt || ""))
      );
  }
  return getMerchantApplications();
}

export async function createMerchantApplicationServer(
  data: Omit<MerchantApplication, "id" | "submittedAt" | "status">
): Promise<MerchantApplication> {
  if (isFirebaseAdminConfigured) {
    const newId = "merch-" + Date.now();
    const newMerchant: MerchantApplication = {
      ...data,
      id: newId,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    await fsSetDoc(
      "merchants",
      newId,
      stripUndefined(newMerchant as unknown as Record<string, unknown>)
    );
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
  if (isFirebaseAdminConfigured) {
    const existing = await fsGetDoc("merchants", id);
    if (!existing) return null;
    await fsUpdateDoc("merchants", id, stripUndefined({ status, notes, reviewedBy }));
    const updated = await fsGetDoc("merchants", id);
    return updated ? (updated as unknown as MerchantApplication) : null;
  }
  return updateMerchantApplicationStatus(id, status, notes, reviewedBy);
}

export async function getPlatformMetricsServer() {
  if (isFirebaseAdminConfigured) {
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

export { getArticleBySlug };
