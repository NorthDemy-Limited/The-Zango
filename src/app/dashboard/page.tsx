"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function DashboardIndexPage() {
  const router = useRouter();
  const { role, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/dashboard/admin";
    } else if (role === "writer") {
      window.location.href = "/dashboard/author";
    } else if (role === "editor") {
      window.location.href = "/dashboard/editor";
    } else {
      window.location.href = "/dashboard/admin";
    }
  }, [isAuthenticated, isLoading, role, router]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#C61D1F] border-t-transparent animate-spin" />
      <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
        Routing to authorized newsroom workspace...
      </span>
    </div>
  );
}
