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
      router.replace("/login?redirect=/dashboard");
    } else if (role === "writer" || role === "author") {
      router.replace("/dashboard/author");
    } else if (role === "editor") {
      router.replace("/dashboard/editor");
    } else if (role === "admin") {
      router.replace("/dashboard/admin");
    } else {
      router.replace("/login?unauthorized=true");
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
