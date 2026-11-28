import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { SITE_CONFIG, SiteSocials } from "@/config/site";

let localSiteSocialsStore: SiteSocials = {
  twitter: { ...SITE_CONFIG.socials.twitter },
  linkedin: { ...SITE_CONFIG.socials.linkedin },
  instagram: { ...SITE_CONFIG.socials.instagram },
  facebook: { ...SITE_CONFIG.socials.facebook },
  youtube: { ...SITE_CONFIG.socials.youtube },
};

export async function getSiteSocials(): Promise<SiteSocials> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "site_settings", "socials");
      const snap = await Promise.race([
        getDoc(docRef),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
      ]);
      if (snap && snap.exists()) {
        const data = snap.data() as Partial<SiteSocials>;
        const merged: SiteSocials = {
          twitter: { ...SITE_CONFIG.socials.twitter, ...(data.twitter || {}) },
          linkedin: { ...SITE_CONFIG.socials.linkedin, ...(data.linkedin || {}) },
          instagram: { ...SITE_CONFIG.socials.instagram, ...(data.instagram || {}) },
          facebook: { ...SITE_CONFIG.socials.facebook, ...(data.facebook || {}) },
          youtube: { ...SITE_CONFIG.socials.youtube, ...(data.youtube || {}) },
        };
        localSiteSocialsStore = merged;
        return merged;
      }
    } catch (err) {
      console.warn("Could not fetch site socials from Firestore:", err);
    }
  }

  return localSiteSocialsStore;
}

export async function updateSiteSocials(socials: SiteSocials): Promise<SiteSocials> {
  localSiteSocialsStore = socials;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "site_settings", "socials");
      await setDoc(docRef, socials, { merge: true });
    } catch (err) {
      console.warn("Could not save site socials to Firestore:", err);
    }
  }

  return socials;
}

