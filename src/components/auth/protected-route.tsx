"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/context/auth-context";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, ArrowRight, Lock, LogOut } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  workspaceName?: string;
}

const emptySubscribe = () => () => {};

export function ProtectedRoute({
  children,
  allowedRoles,
  workspaceName = "Newsroom Workspace",
}: ProtectedRouteProps) {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Compute whether user's role satisfies required clearance
  const hasAccess = (): boolean => {
    if (!isAuthenticated || !role) return false;

    // Admin has universal access to all workspaces
    if (role === "admin") return true;

    // Editor has access to editor workspaces and author/writer studios
    if (role === "editor") {
      return (
        allowedRoles.includes("editor") ||
        allowedRoles.includes("writer") ||
        allowedRoles.includes("author")
      );
    }

    // Author / Writer has access to author studio
    if (role === "writer" || role === "author") {
      return allowedRoles.includes("writer") || allowedRoles.includes("author");
    }

    // Reader only matches if explicitly allowed
    return allowedRoles.includes(role);
  };

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`;
      router.replace(redirectUrl);
    }
  }, [mounted, isLoading, isAuthenticated, pathname, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="relative w-36 h-10 mb-2">
          <Image
            src="/assets/logo.png"
            alt="The Zango"
            fill
            sizes="150px"
            className="object-contain"
            priority
          />
        </div>
        <div className="w-9 h-9 rounded-full border-3 border-[#C61D1F] border-t-transparent animate-spin" />
        <div className="text-center">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
            Newsroom Gatekeeper
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Validating security credentials for {workspaceName}...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Access Denied screen if role is unauthorized
  if (!hasAccess()) {
    const roleFallbackDestination =
      role === "editor"
        ? "/dashboard/editor"
        : role === "writer" || role === "author"
        ? "/dashboard/author"
        : "/";

    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 relative">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider mb-2 border border-amber-200">
              <Lock className="w-3 h-3" />
              <span>Insufficient Clearance</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Access Restricted: {workspaceName}
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Your account is signed in as <strong className="text-slate-800 uppercase font-bold">{user?.badge || role}</strong> ({user?.email}).
              This workspace requires <strong className="text-slate-800 font-bold">{allowedRoles.map((r) => r.toUpperCase()).join(" or ")}</strong> clearance.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href={roleFallbackDestination}
              className="w-full py-3 px-4 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-sm"
            >
              <span>Return to My Authorized Desk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account / Sign In as Different Role</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
