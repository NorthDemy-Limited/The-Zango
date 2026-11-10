"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth, PRESET_USERS } from "@/context/auth-context";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff,
  ArrowLeft,
  PenTool,
  Layers,
  Sparkles,
  RefreshCw,
  User
} from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || searchParams.get("callbackUrl");
  const isUnauthorized = searchParams.get("unauthorized") === "true";
  const { login, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<"credentials" | "fastAccess">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const determineTarget = (userEmailOrRole: string): string => {
    if (redirectParam) return redirectParam;
    const clean = userEmailOrRole.trim().toLowerCase();
    if (clean === "editor" || clean.includes("editor") || clean.includes("aisha")) {
      return "/dashboard/editor";
    }
    if (clean === "writer" || clean === "author" || clean.includes("writer") || clean.includes("fatima")) {
      return "/dashboard/author";
    }
    if (clean === "reader" || clean.includes("reader") || clean.includes("amina")) {
      return "/";
    }
    return "/dashboard/admin";
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await signInWithGoogle();
    if (res.success) {
      const target = redirectParam || "/dashboard";
      window.location.href = target;
    } else {
      setLoading(false);
      setErrorMessage(res.error || "Google authentication failed.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    const res = await login(email, password);

    if (res.success) {
      const target = determineTarget(email);
      window.location.href = target;
    } else {
      setLoading(false);
      setErrorMessage(res.error || "Authentication failed. Please verify credentials or choose 1-Click Fast Access.");
    }
  };

  const handleQuickLogin = async (roleKey: string) => {
    setLoading(true);
    setLoadingRole(roleKey);
    setErrorMessage(null);

    const targetUser = PRESET_USERS[roleKey];
    if (targetUser) {
      setEmail(targetUser.email);
      setPassword("password123");
      const res = await login(roleKey);
      if (res.success) {
        const dest = determineTarget(roleKey);
        window.location.href = dest;
      } else {
        setLoading(false);
        setLoadingRole(null);
        setErrorMessage("Fast clearance could not be initialized.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#C61D1F]/10 via-transparent to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top Back Link & Security Badge */}
      <div className="max-w-md w-full mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#C61D1F] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Front Page</span>
        </Link>
        
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Bureau Clearance Gateway</span>
        </div>
      </div>

      {/* Login Card Container */}
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-200/90 relative">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <div className="relative w-44 h-12 mx-auto mb-3">
              <Image
                src="/assets/logo.png"
                alt="The Zango"
                fill
                sizes="180px"
                className="object-contain"
                priority
              />
            </div>
          </Link>
          
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 bg-red-50 text-[#C61D1F] rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 border border-red-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Editorial Gatekeeper</span>
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Newsroom Staff Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with authorized Bureau credentials or select your designated newsroom desk.
          </p>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("credentials");
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === "credentials"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Staff Passcode</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("fastAccess");
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === "fastAccess"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fast Role Access</span>
          </button>
        </div>

        {/* Clearance Alert for Unauthorized Redirects */}
        {isUnauthorized && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center space-x-2.5 animate-in fade-in">
            <Lock className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Clearance Required: Please sign in with an account authorized to access that desk.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center space-x-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: Standard Credentials Form */}
        {activeTab === "credentials" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Newsroom Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@thezango.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold focus:outline-hidden transition-all bg-slate-50/60 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Passcode / Clearance
                </label>
                <span className="text-[11px] text-slate-400">Internal Portal</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold focus:outline-hidden transition-all bg-slate-50/60 focus:bg-white text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors p-1 cursor-pointer"
                  title={showPassword ? "Hide passcode" : "Show passcode"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#C61D1F] focus:ring-[#C61D1F] w-4 h-4"
                />
                <span>Remember this terminal</span>
              </label>

              <button
                type="button"
                onClick={() => setActiveTab("fastAccess")}
                className="text-xs font-semibold text-[#C61D1F] hover:underline cursor-pointer"
              >
                Use Fast Access
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#C61D1F] to-[#A51719] hover:from-[#A51719] hover:to-[#881214] text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer mt-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating Clearance...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white px-3 text-slate-400">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        )}

        {/* MODE 2: 1-Click Fast Role Clearance */}
        {activeTab === "fastAccess" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-3 text-center">
              Select your newsroom role to instantly clear authorization and launch the dedicated workspace:
            </p>

            {/* Role 1: Chief Admin */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin("admin")}
              className="w-full p-3.5 rounded-2xl border border-red-200/90 bg-gradient-to-r from-red-50/70 to-red-50/30 hover:from-red-100/80 hover:to-red-50 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs hover:shadow-sm"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#C61D1F] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900 group-hover:text-[#C61D1F] transition-colors truncate">
                      Usman Bello
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-200">
                      Chief Admin
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    Executive & Investigation Bureau • Full CMS
                  </div>
                </div>
              </div>

              {loadingRole === "admin" ? (
                <RefreshCw className="w-4 h-4 text-[#C61D1F] animate-spin shrink-0 ml-2" />
              ) : (
                <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 group-hover:text-[#C61D1F] transition-all shrink-0 ml-2" />
              )}
            </button>

            {/* Role 2: Desk Editor */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin("editor")}
              className="w-full p-3.5 rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/70 to-blue-50/30 hover:from-blue-100/80 hover:to-blue-50 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs hover:shadow-sm"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                      Aisha Dahiru
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                      Desk Editor
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    Business & Markets Desk • Review Queue & Desks
                  </div>
                </div>
              </div>

              {loadingRole === "editor" ? (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0 ml-2" />
              ) : (
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 group-hover:text-blue-700 transition-all shrink-0 ml-2" />
              )}
            </button>

            {/* Role 3: Staff Writer */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin("writer")}
              className="w-full p-3.5 rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/70 to-emerald-50/30 hover:from-emerald-100/80 hover:to-emerald-50 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs hover:shadow-sm"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PenTool className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      Fatima Sanusi
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                      Staff Writer
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    Technology & Digital Economy • Manuscript Pitches
                  </div>
                </div>
              </div>

              {loadingRole === "writer" ? (
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0 ml-2" />
              ) : (
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 group-hover:text-emerald-700 transition-all shrink-0 ml-2" />
              )}
            </button>

            {/* Role 4: Reader / Subscriber */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin("reader")}
              className="w-full p-3.5 rounded-2xl border border-purple-200/90 bg-gradient-to-r from-purple-50/70 to-purple-50/30 hover:from-purple-100/80 hover:to-purple-50 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs hover:shadow-sm"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                      Amina Yusuf
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                      Public Reader
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    Verified Subscriber • Front Page & Discussion Access
                  </div>
                </div>
              </div>

              {loadingRole === "reader" ? (
                <RefreshCw className="w-4 h-4 text-purple-600 animate-spin shrink-0 ml-2" />
              ) : (
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 group-hover:text-purple-700 transition-all shrink-0 ml-2" />
              )}
            </button>
          </div>
        )}

        {/* Footer Support Info */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            For credentials reset or desk assignment changes, contact the Bureau Systems Desk at{" "}
            <a href="mailto:editorial@thezango.org" className="text-slate-600 font-bold hover:underline">
              editorial@thezango.org
            </a>
          </p>
        </div>

      </div>

      <div className="mt-8 text-center text-[11px] text-slate-400">
        The Zango Digital Publishing Platform • Proprietary & Confidential
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">Newsroom Staff Portal</h1>
          <p className="text-xs text-slate-500">Loading editorial authorization portal...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
