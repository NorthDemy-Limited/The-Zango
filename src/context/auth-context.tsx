"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { UserRole } from "@/types";

export type { UserRole };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  desk: string;
  avatar: string;
  bio?: string;
  badge: string;
  mustChangePassword?: boolean;
}

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
  logout: () => {},
  signOut: async () => {},
  switchRole: () => {},
  updateUser: () => {},
});

const SESSION_STORAGE_KEY = "thezango_session_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const persistClientUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (typeof window !== "undefined") {
      if (nextUser) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // Hydrate authenticated session from server-side HttpOnly cookie
  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!active) return;

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            persistClientUser(data.user);
            return;
          }
        }
        persistClientUser(null);
      } catch {
        if (active) {
          persistClientUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY) {
        if (!e.newValue) {
          setUser(null);
        } else {
          verifySession();
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", handleStorage);
    };
  }, [persistClientUser]);

  const exchangeFirebaseToken = async (idToken: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/firebase-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        persistClientUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.message || "Could not establish server session." };
    } catch {
      return { success: false, error: "Network error establishing server session." };
    }
  };

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const clean = identifier.trim().toLowerCase();

    if (!clean) {
      return { success: false, error: "Username or corporate email is required." };
    }

    if (!password) {
      return { success: false, error: "Passcode is required." };
    }

    // 1. Verify staff credentials via server-side scrypt check + signed HttpOnly cookie
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: clean, password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        persistClientUser(data.user);
        return { success: true };
      }

      // 2. If not found in staff roster and looks like email, try Firebase Auth (for readers)
      if (res.status === 401 && isFirebaseConfigured && auth && clean.includes("@")) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, clean, password);
          if (userCred.user) {
            const idToken = await userCred.user.getIdToken();
            return await exchangeFirebaseToken(idToken);
          }
        } catch {
          // Fall through to primary API error message
        }
      }

      return { success: false, error: data.message || "Invalid clearance credentials." };
    } catch (apiErr) {
      console.warn("API login verification failed:", apiErr);
      return { success: false, error: "Network error during authentication. Please try again." };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    return login(email, password);
  };

  const signUpWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: "Authentication service is not configured." };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      return await exchangeFirebaseToken(idToken);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      return { success: false, error: message };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: "Google authentication is not configured in this environment." };
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        const idToken = await res.user.getIdToken();
        return await exchangeFirebaseToken(idToken);
      }
      return { success: false, error: "Google sign-in did not return a user." };
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr?.code === "auth/popup-closed-by-user" || firebaseErr?.code === "auth/popup-blocked") {
        return {
          success: false,
          error:
            "Google sign-in popup was blocked or closed. If using Brave Browser, please disable Brave Shields for this tab or allow popups.",
        };
      }
      if (firebaseErr?.code === "auth/unauthorized-domain") {
        return {
          success: false,
          error:
            "This domain is not authorized in Firebase Console. Add your domain under Firebase Authentication > Settings > Authorized domains.",
        };
      }
      if (firebaseErr?.code === "auth/operation-not-allowed") {
        return {
          success: false,
          error: "Google sign-in is not enabled in Firebase Console.",
        };
      }
      return { success: false, error: firebaseErr?.message || "Google sign-in failed." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore network errors on logout
    }
    if (isFirebaseConfigured && auth) {
      firebaseSignOut(auth).catch(() => {});
    }
    persistClientUser(null);
    router.push("/login");
  };

  const signOut = async () => {
    await logout();
  };

  const switchRole = () => {
    // Role switching is disabled in production; roles are enforced server-side.
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      }
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
