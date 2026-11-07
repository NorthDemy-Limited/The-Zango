"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "admin" | "editor" | "writer";

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
};

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (roleOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => { },
  switchRole: () => { },
  updateUser: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("thezango_session_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      } else {
        // Default to Chief Admin in initial development/preview mode
        setUser(PRESET_USERS.admin);
        localStorage.setItem("thezango_session_user", JSON.stringify(PRESET_USERS.admin));
      }
    } catch (e) {
      setUser(PRESET_USERS.admin);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (roleOrEmail: string, password?: string) => {
    const clean = roleOrEmail.trim().toLowerCase();

    // 1. Direct role key matching
    if (PRESET_USERS[clean]) {
      const selected = PRESET_USERS[clean];
      setUser(selected);
      localStorage.setItem("thezango_session_user", JSON.stringify(selected));
      return { success: true };
    }

    // 2. Email matching
    const found = Object.values(PRESET_USERS).find((u) => u.email.toLowerCase() === clean);
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
        name: clean.split("@")[0].replace(".", " ").toUpperCase(),
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem("thezango_session_user");
    router.push("/login");
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
        login,
        logout,
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

