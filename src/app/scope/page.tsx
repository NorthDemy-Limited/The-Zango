import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Compass, FileText } from "lucide-react";

export default function ScopePage() {
  return (
    <div className="py-10 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-2 text-[#84CC16] text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Zango Scope</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight mb-4">
            In-Depth Investigative Journalism & Special Dispatches
          </h1>
          <p className="text-base sm:text-lg text-[#535252] leading-relaxed">
            Zango Scope is our premier investigative desk and in-depth storytelling unit, dedicated to deep-dives into policy, climate transitions, cultural heritage, and the frontier digital economy across Northern Nigeria and the Sahel.
          </p>
        </div>

        {/* Feature Hero Card */}
        <div className="relative rounded-3xl overflow-hidden bg-neutral-900 border border-[#E5E6E8] shadow-xl mb-16">
          <div className="relative w-full h-[400px] sm:h-[480px]">
            <Image
              src="/assets/experience-banner.png"
              alt="Zango Scope Special Edition"
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover object-center brightness-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

            <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-end max-w-2xl text-white">
              <span className="bg-[#84CC16] text-black font-bold px-3 py-1 rounded-sm text-xs uppercase tracking-wider mb-3 w-fit">
                Special Series
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
                The Sahelian Green Corridor: Engineering Drought Resilience
              </h2>
              <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-6">
                A multi-part investigative field dossier following agronomists, solar-pump pioneers, and pastoralist co-ops revitalizing dried river basins from Sokoto to Borno.
              </p>
              <div className="flex items-center space-x-4">
                <Link
                  href="/category/scope"
                  className="px-5 py-3 rounded-xl bg-white text-[#111111] hover:bg-[#84CC16] hover:text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center space-x-2 cursor-pointer shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>Read Full Special Dispatch</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#FAFAFA] border border-[#E5E6E8] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-[#F7FEE7] text-[#84CC16] flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#000000] mb-2">
              Investigative Dossiers
            </h3>
            <p className="text-sm text-[#707070] leading-relaxed mb-6">
              Rigorous, data-backed policy investigations and field research dissecting governance, climate resilience, and industrial growth across West Africa.
            </p>
            <Link
              href="/category/scope"
              className="text-xs font-bold text-[#84CC16] uppercase tracking-wider flex items-center space-x-1 hover:underline"
            >
              <span>Explore In-Depth Dossiers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-[#FAFAFA] border border-[#E5E6E8] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-[#F7FEE7] text-[#84CC16] flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#000000] mb-2">
              Sahelian Field Dispatches
            </h3>
            <p className="text-sm text-[#707070] leading-relaxed mb-6">
              First-hand journalistic dispatches capturing ground-level innovation, rural entrepreneurship, and grassroots community transformations.
            </p>
            <Link
              href="/category/scope"
              className="text-xs font-bold text-[#84CC16] uppercase tracking-wider flex items-center space-x-1 hover:underline"
            >
              <span>Read Field Dispatches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
