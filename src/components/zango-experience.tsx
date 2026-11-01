import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Headphones, Video, Sparkles } from "lucide-react";

export default function ZangoExperience() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center space-x-2.5 pb-3.5 mb-8 border-b border-[#E5E6E8]">
          <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#000000] tracking-wide uppercase">
            The Zango Experience
          </h2>
        </div>

        {/* Experience Banner Card */}
        <div className="relative rounded-3xl overflow-hidden bg-neutral-900 border border-[#E5E6E8] shadow-lg">
          <div className="relative w-full h-[320px] sm:h-[400px]">
            <Image
              src="/assets/experience-banner.png"
              alt="The Zango Experience"
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover object-center brightness-75 hover:scale-101 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

            {/* Content overlay */}
            <div className="absolute inset-0 p-6 sm:p-10 lg:p-14 flex flex-col justify-center max-w-2xl text-white">
              <div className="inline-flex items-center space-x-2 bg-[#C61D1F] text-white px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider mb-4 w-fit shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Multimedia & Deep Dives</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
                Immersive Journalism for Northern Africa
              </h3>

              <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-6">
                Go beyond headlines. Experience serialized investigative podcasts, video field essays, and interactive data infographics documenting Africa&apos;s cultural and technological revolution.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/scope"
                  className="px-6 py-3 bg-[#C61D1F] hover:bg-[#A51719] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center space-x-2 shadow-md cursor-pointer"
                >
                  <span>Explore Zango Scope</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center space-x-4 text-xs font-semibold text-gray-300">
                  <span className="flex items-center space-x-1.5">
                    <Headphones className="w-4 h-4 text-red-400" />
                    <span>Audio Podcasts</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1.5">
                    <Video className="w-4 h-4 text-red-400" />
                    <span>Video Essays</span>
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
