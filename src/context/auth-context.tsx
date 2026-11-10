"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getOrCreateUserProfile } from "@/lib/firebase/db";
import { UserRole } from "@/types";

export type { UserRole };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  desk: string;
  avatar: string;
  bio?: string;
  badge: string;
}

export const PRESET_USERS: Record<string, AuthUser> = {
  "admin": {
    id: "usr-admin-1",
    name: "Usman Bello",
    email: "usman.bello@thezango.org",
    role: "admin",
    desk: "Executive & Investigation",
    avatar: "/assets/social-image-1.png",
    bio: "Chief Executive & Bureau Chief with 15+ years in Sahelian socio-political investigative reporting.",
    badge: "Chief Admin",
  },
  "editor": {
    id: "usr-editor-2",
    name: "Aisha Dahiru",
    email: "aisha.dahiru@thezango.org",
    role: "editor",
    desk: "Business & Capital Markets",
    avatar: "/assets/social-image-2.png",
    bio: "Senior Markets Editor analyzing private equity, agribusiness finance, and trade dynamics across Northern Nigeria.",
    badge: "Desk Editor",
  },
  "writer": {
    id: "usr-writer-3",
    name: "Fatima Sanusi",
    email: "fatima.sanusi@thezango.org",
    role: "writer",
    desk: "Technology & Digital Economy",
    avatar: "/assets/social-image-4.png",
    bio: "Tech correspondent tracking venture capital, AI hubs, and mobile banking adoption from Kano to Kaduna.",
    badge: "Staff Writer",
  },
  "reader": {
    id: "usr-reader-4",
    name: "Amina Yusuf",
    email: "amina.yusuf@gmail.com",
    role: "reader",
    desk: "Public Reader",
    avatar: "/assets/social-image-3.png",
    bio: "Passionate reader and follower of Northern Nigerian investigative journalism and Sahelian markets.",
    badge: "Reader",
  },
};

export interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (roleOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signOut: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  loading: true,
  login: async () => ({ success: false }),
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signInWithGoogle: async () => ({ success: false }),
  logout: () => { },
  signOut: async () => { },
  switchRole: () => { },
  updateUser: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("thezango_session_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.email) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return PRESET_USERS.admin;
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Listen to external window storage events for multi-tab sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "thezango_session_user" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.email) {
            setUser(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Listen to Firebase Auth state changes and sync with Firestore UserProfile
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getOrCreateUserProfile({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
          });
          const authUser: AuthUser = {
            id: fbUser.uid,
            name: profile.displayName,
            email: profile.email,
            role: profile.role,
            desk: profile.desk || (profile.role === "editor" ? "Editorial Desk" : profile.role === "admin" ? "Executive Desk" : "Contributor Desk"),
            avatar: profile.photoURL || "/assets/social-image-1.png",
            bio: profile.bio,
            badge: profile.role === "admin" ? "Chief Admin" : profile.role === "editor" ? "Desk Editor" : profile.role === "reader" ? "Reader" : "Staff Writer",
          };
          setUser(authUser);
          localStorage.setItem("thezango_session_user", JSON.stringify(authUser));
        } catch (err) {
          console.warn("Could not sync Firebase Auth profile with Firestore:", err);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (roleOrEmail: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const clean = roleOrEmail.trim().toLowerCase();

    // 1. Direct role key matching
    if (PRESET_USERS[clean]) {
      const selected = PRESET_USERS[clean];
      setUser(selected);
      localStorage.setItem("thezango_session_user", JSON.stringify(selected));
      return { success: true };
    }

    // 2. Email matching with local preset or Firebase Auth
    const found = Object.values(PRESET_USERS).find((u) => u.email.toLowerCase() === clean);

    // If Firebase Auth is configured and credentials are supplied, attempt Firebase sign-in
    if (isFirebaseConfigured && auth && clean.includes("@") && password) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, clean, password);
        if (userCred.user) {
          const profile = await getOrCreateUserProfile({
            uid: userCred.user.uid,
            email: userCred.user.email,
            displayName: userCred.user.displayName,
            photoURL: userCred.user.photoURL,
          });
          const authUser: AuthUser = found || {
            id: userCred.user.uid,
            name: profile.displayName || userCred.user.displayName || clean.split("@")[0].replace(".", " ").toUpperCase(),
            email: userCred.user.email || clean,
            role: profile.role,
            desk: profile.desk || (clean.includes("editor") ? "Business & Capital Markets" : "Technology & Digital Economy"),
            avatar: profile.photoURL || "/assets/social-image-1.png",
            badge: profile.role === "admin" ? "Chief Admin" : profile.role === "editor" ? "Desk Editor" : profile.role === "reader" ? "Reader" : "Staff Writer",
          };
          setUser(authUser);
          localStorage.setItem("thezango_session_user", JSON.stringify(authUser));
          return { success: true };
        }
      } catch (fbErr: unknown) {
        console.warn("Firebase Auth sign-in attempted, checking local credentials fallback:", fbErr);
      }
    }

    if (found) {
      if (password && password.length < 4) {
        return { success: false, error: "Password must be at least 4 characters." };
      }
      setUser(found);
      localStorage.setItem("thezango_session_user", JSON.stringify(found));
      return { success: true };
    }

    // 3. Custom dynamic user login
    if (clean.includes("@")) {
      const customUser: AuthUser = {
        id: `usr-${Date.now()}`,
        name: clean.split("@")[0].replace(/[._-]/g, " ").toUpperCase(),
        email: clean,
        role: "writer",
        desk: "General News Desk",
        avatar: "/assets/social-image-1.png",
        badge: "Staff Writer",
      };
      setUser(customUser);
      localStorage.setItem("thezango_session_user", JSON.stringify(customUser));
      return { success: true };
    }

    return { success: false, error: "Invalid credentials. Use a verified newsroom account." };
  };

  const signInWithEmail = async (email: string, password: string) => {
    return login(email, password);
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name?: string,
    role: UserRole = "reader"
  ): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const profile = await getOrCreateUserProfile(
          {
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: name || email.split("@")[0],
            photoURL: cred.user.photoURL,
          },
          role
        );
        const authUser: AuthUser = {
          id: cred.user.uid,
          name: profile.displayName,
          email: profile.email,
          role: profile.role,
          desk: profile.desk || "General",
          avatar: profile.photoURL || "/assets/social-image-1.png",
          bio: profile.bio,
          badge: profile.role === "admin" ? "Chief Admin" : profile.role === "editor" ? "Desk Editor" : profile.role === "reader" ? "Reader" : "Staff Writer",
        };
        setUser(authUser);
        localStorage.setItem("thezango_session_user", JSON.stringify(authUser));
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Registration failed.";
        return { success: false, error: message };
      }
    }

    const newUid = `usr-${Date.now()}`;
    const localUser: AuthUser = {
      id: newUid,
      name: name || email.split("@")[0].toUpperCase(),
      email,
      role,
      desk: "General",
      avatar: "/assets/social-image-1.png",
      badge: role === "admin" ? "Chief Admin" : role === "editor" ? "Desk Editor" : role === "reader" ? "Reader" : "Staff Writer",
    };
    setUser(localUser);
    localStorage.setItem("thezango_session_user", JSON.stringify(localUser));
    return { success: true };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured && auth) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const res = await signInWithPopup(auth, provider);
        if (res.user) {
          const profile = await getOrCreateUserProfile(
            {
              uid: res.user.uid,
              email: res.user.email,
              displayName: res.user.displayName,
              photoURL: res.user.photoURL,
            },
            "reader"
          );
          const authUser: AuthUser = {
            id: res.user.uid,
            name: profile.displayName,
            email: profile.email,
            role: profile.role,
            desk: profile.desk || "General",
            avatar: profile.photoURL || "/assets/social-image-1.png",
            bio: profile.bio,
            badge: profile.role === "admin" ? "Chief Admin" : profile.role === "editor" ? "Desk Editor" : profile.role === "reader" ? "Reader" : "Staff Writer",
          };
          setUser(authUser);
          localStorage.setItem("thezango_session_user", JSON.stringify(authUser));
          return { success: true };
        }
      } catch (err: unknown) {
        const firebaseErr = err as { code?: string; message?: string };
        if (firebaseErr?.code === "auth/popup-closed-by-user") {
          return { success: false, error: "Sign-in popup was closed." };
        }
        return { success: false, error: firebaseErr?.message || "Google sign-in failed." };
      }
    }
    return { success: false, error: "Google authentication is not available in current environment." };
  };

  const logout = () => {
    if (isFirebaseConfigured && auth) {
      firebaseSignOut(auth).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem("thezango_session_user");
    router.push("/login");
  };

  const signOut = async () => {
    logout();
  };

  const switchRole = (newRole: UserRole) => {
    const target = PRESET_USERS[newRole];
    if (target) {
      setUser(target);
      localStorage.setItem("thezango_session_user", JSON.stringify(target));
    }
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("thezango_session_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        loading: isLoading,
        login,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        signOut,
        switchRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
