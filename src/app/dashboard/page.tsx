import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  PenTool, 
  ArrowRight, 
  BarChart3, 
  FileText, 
  Users, 
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Lock
} from "lucide-react";
import { getPlatformMetrics } from "@/lib/firebase/db";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export default async function DashboardPortalPage() {
  const metrics = await getPlatformMetrics();

  return (
    <div className="py-12 lg:py-20 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#535252] hover:text-[#C61D1F] uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Front Page</span>
          </Link>
        </div>

        {/* Portal Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-3 bg-[#FDF2F2] px-3 py-1 rounded-full border border-red-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Zango Newsroom Portals</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight mb-4">
            Select Your Editorial Workspace
          </h1>
          <p className="text-base sm:text-lg text-[#535252] leading-relaxed">
            The Zango operates with two dedicated dashboards tailored for editorial governance, publication management, and longform investigative storytelling.
          </p>
        </div>

        {/* Live Newsroom Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs">
            <span className="text-xs font-bold text-[#707070] uppercase block mb-1">Total Stories</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#000000]">{metrics.totalArticles}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs">
            <span className="text-xs font-bold text-[#707070] uppercase block mb-1">Total Readers</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#000000]">{metrics.totalViews.toLocaleString()}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs">
            <span className="text-xs font-bold text-[#707070] uppercase block mb-1">Subscribers</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#000000]">{metrics.totalSubscribers}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E5E6E8] shadow-2xs">
            <span className="text-xs font-bold text-[#707070] uppercase block mb-1">Engine Status</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseConfigured ? "bg-green-500" : "bg-amber-400"}`} />
              <span className="text-xs font-bold text-[#111111]">
                {isFirebaseConfigured ? "Firebase Cloud" : "Local Engine"}
              </span>
            </div>
          </div>
        </div>

        {/* The 2 Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Dashboard 1: Chief Editor / Admin CMS */}
          <div className="bg-white border-2 border-[#E5E6E8] hover:border-[#C61D1F] rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#C61D1F] flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="bg-[#000000] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Dashboard 1
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-[#000000] group-hover:text-[#C61D1F] transition-colors mb-3">
                Chief Editor CMS
              </h2>

              <p className="text-sm text-[#707070] leading-relaxed mb-6">
                Central command console for editorial directors and managing editors. Oversee platform-wide publication flows, manage newsletter subscribers, and monitor newsroom KPIs.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center space-x-2 text-xs text-[#535252]">
                  <CheckCircle2 className="w-4 h-4 text-[#C61D1F]" />
                  <span>Publish, unpublish, and delete dispatches</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#535252]">
                  <CheckCircle2 className="w-4 h-4 text-[#C61D1F]" />
                  <span>Assign stories across all 11 regional news desks</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#535252]">
                  <CheckCircle2 className="w-4 h-4 text-[#C61D1F]" />
                  <span>Export newsletter subscriber database to CSV</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#535252]">
                  <CheckCircle2 className="w-4 h-4 text-[#C61D1F]" />
                  <span>Real-time Firebase Firestore status monitoring</span>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/admin"
              className="w-full py-3.5 px-6 rounded-xl bg-[#C61D1F] hover:bg-[#A51719] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 shadow-md cursor-pointer"
            >
              <span>Enter Chief Editor CMS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Dashboard 2: Writer / Author Studio */}
          <div className="bg-white border-2 border-[#E5E6E8] hover:border-[#C61D1F] rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-[#000000] group-hover:bg-[#FDF2F2] group-hover:text-[#C61D1F] transition-colors flex items-center justify-center">
                  <PenTool className="w-7 h-7" />
                </div>
                <span className="bg-[#535252] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Dashboard 2
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-[#000000] group-hover:text-[#C61D1F] transition-colors mb-3">
                Writer / Author Studio
              </h2>

              <p className="text-sm text-[#707070] leading-relaxed mb-6">
                Focused workspace for staff journalists, field correspondents, and contributing fellows. Compose longform investigative drafts with real-time editorial assistance.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center space-x-2 text-xs text-[#535252]">
                  <CheckCircle2 className="w-4 h-4 text-[#C61D1F]" />
                  <span>Distraction-free manuscript editor</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#535252]">
                  <CheckCircle2 className="w-4 h-4 text-[#C61D1F]" />
                  <span>Real-time word counter and read-time calculator</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#535252]">
                  <CheckCircle2 className="w-4 h-4 text-[#C61D1F]" />
                  <span>Submit manuscripts directly for Chief Editor review</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#535252]">
                  <CheckCircle2 className="w-4 h-4 text-[#C61D1F]" />
                  <span>Track story publication milestones and readership</span>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/author"
              className="w-full py-3.5 px-6 rounded-xl bg-[#000000] hover:bg-[#C61D1F] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 shadow-md cursor-pointer"
            >
              <span>Enter Writer Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
