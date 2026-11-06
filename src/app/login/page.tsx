"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, PRESET_USERS, UserRole } from "@/context/auth-context";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff,
  User,
  ArrowLeft,
  Sparkles,
  KeyRound
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard/admin";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (email.toLowerCase().includes("writer") || email.toLowerCase().includes("fatima")) {
        router.push("/dashboard/author");
      } else {
        router.push(redirectPath);
      }
    } else {
      setErrorMessage(res.error || "Authentication failed. Please verify credentials.");
    }
  };

  const handleQuickLogin = async (roleKey: string) => {
    setLoading(true);
    setErrorMessage(null);
    const target = PRESET_USERS[roleKey];
    if (target) {
      setEmail(target.email);
      setPassword("password123");
      const res = await login(roleKey);
      setLoading(false);
      if (res.success) {
        if (roleKey === "writer") {
          router.push("/dashboard/author");
        } else {
          router.push(redirectPath);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#C61D1F]/10 via-transparent to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top Back link */}
      <div className="max-w-md w-full mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#535252] hover:text-[#C61D1F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Front Page</span>
        </Link>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          ● Bureau Security Active
        </span>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#E5E6E8]">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="relative w-44 h-12 mx-auto mb-4">
            <Image
              src="/assets/logo.png"
              alt="The Zango"
              fill
              sizes="180px"
              className="object-contain"
              priority
            />
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-50 text-[#C61D1F] rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Editorial Gatekeeper</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#111111] tracking-tight">
            Newsroom Executive Portal
          </h1>
          <p className="text-xs text-[#707070] mt-1.5">
            Sign in with authorized Bureau credentials to access publishing, review queue, and desk analytics.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
              Newsroom Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@thezango.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs font-medium focus:outline-hidden transition-all bg-[#FAFAFA] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                Passcode / Clearance
              </label>
              <span className="text-[11px] text-[#707070]">Internal Portal</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-[#DFDFDF] focus:border-[#C61D1F] text-xs font-medium focus:outline-hidden transition-all bg-[#FAFAFA] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            <span>{loading ? "Verifying Clearance..." : "Authenticate & Open Workspace"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Fast Role Demo Switcher (Requested for Team & Testing) */}
        <div className="mt-8 pt-6 border-t border-[#E5E6E8]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#707070]">
              Instant Role Test Access
            </span>
            <span className="text-[10px] text-gray-400 font-medium">1-Click Sign In</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin")}
              className="w-full p-2.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-100/60 transition-colors flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                  👑
                </span>
                <div>
                  <div className="text-xs font-extrabold text-red-950 group-hover:text-red-700">
                    Chief Admin (Usman Bello)
                  </div>
                  <div className="text-[10px] text-red-600/80">Full CMS, Roster, Desks & Publishing</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("editor")}
              className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition-colors flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  ✍️
                </span>
                <div>
                  <div className="text-xs font-extrabold text-blue-950 group-hover:text-blue-700">
                    Desk Editor (Aisha Dahiru)
                  </div>
                  <div className="text-[10px] text-blue-600/80">Review Queue & Desk Stories</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("writer")}
              className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  📝
                </span>
                <div>
                  <div className="text-xs font-extrabold text-emerald-950 group-hover:text-emerald-700">
                    Staff Writer (Fatima Sanusi)
                  </div>
                  <div className="text-[10px] text-emerald-600/80">Author Studio & Pitch Submissions</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      <div className="mt-8 text-center text-[11px] text-[#707070]">
        The Zango Digital Publishing Platform • Proprietary & Confidential
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs text-[#707070]">
          Loading editorial portal...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
