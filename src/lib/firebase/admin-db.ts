import { adminDb, isFirebaseAdminConfigured } from "./admin";
import {
  createTeamMember,
  deleteTeamMember,
  findStaffByIdentifier,
  getAllUsernames,
  getOrCreateUserProfile,
  getTeamMembers,
  updateStaffPassword,
  updateTeamMemberRole,
  updateTeamMemberStatus,
} from "./db";
import { getSiteSocials, updateSiteSocials } from "@/lib/site-socials";
import { SITE_CONFIG, SiteSocials } from "@/config/site";
import { NewsroomMember, NewsroomRole, UserProfile, UserRole } from "@/types";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

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
        youtube: { ...SITE_CONFIG.socials.youtube, ...(data.youtube || {}) },
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

