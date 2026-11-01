import React from "react";
import Link from "next/link";
import { Megaphone, BarChart3, Users, Mail, ArrowRight } from "lucide-react";

export default function AdvertisePage() {
  return (
    <div className="py-12 lg:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-3">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Commercial Partnerships</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight mb-4">
            Reach Nigeria&apos;s Most Influential Decision-Makers
          </h1>
          <p className="text-base sm:text-lg text-[#535252] leading-relaxed">
            Partner with The Zango to amplify your brand across Northern Nigeria and the wider African market. We connect enterprise founders, institutional investors, and public sector leaders through customized media placements.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E6E8] text-center">
            <Users className="w-7 h-7 text-[#C61D1F] mx-auto mb-2" />
            <span className="text-3xl font-extrabold text-[#000000] block mb-1">250K+</span>
            <span className="text-xs text-[#707070] font-semibold uppercase">Monthly Active Readers</span>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E6E8] text-center">
            <Mail className="w-7 h-7 text-[#C61D1F] mx-auto mb-2" />
            <span className="text-3xl font-extrabold text-[#000000] block mb-1">42%</span>
            <span className="text-xs text-[#707070] font-semibold uppercase">Newsletter Open Rate</span>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E6E8] text-center">
            <BarChart3 className="w-7 h-7 text-[#C61D1F] mx-auto mb-2" />
            <span className="text-3xl font-extrabold text-[#000000] block mb-1">68%</span>
            <span className="text-xs text-[#707070] font-semibold uppercase">C-Suite & Founders</span>
          </div>
        </div>

        {/* Ad Products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 rounded-2xl border border-[#E5E6E8] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#000000] mb-2">Sponsored Content</h3>
              <p className="text-xs text-[#707070] leading-relaxed mb-4">
                In-depth editorial native features written by our staff and amplified across our homepage and social feeds.
              </p>
            </div>
            <span className="text-xs font-bold text-[#C61D1F] uppercase tracking-wider">Custom Packaging</span>
          </div>

          <div className="p-8 rounded-2xl border border-[#E5E6E8] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#000000] mb-2">Newsletter Takeovers</h3>
              <p className="text-xs text-[#707070] leading-relaxed mb-4">
                Exclusive top-of-email and mid-email sponsor placement in our daily curated newsletter briefing.
              </p>
            </div>
            <span className="text-xs font-bold text-[#C61D1F] uppercase tracking-wider">High Conversion</span>
          </div>

          <div className="p-8 rounded-2xl border border-[#E5E6E8] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#000000] mb-2">Display & Digital Banners</h3>
              <p className="text-xs text-[#707070] leading-relaxed mb-4">
                High-impact billboard, sticky sidebar, and in-article premium responsive ad placements.
              </p>
            </div>
            <span className="text-xs font-bold text-[#C61D1F] uppercase tracking-wider">Direct Media Kit</span>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#000000] text-white rounded-3xl p-8 sm:p-12 text-center shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Request The Zango Media Kit
          </h2>
          <p className="text-sm text-gray-300 max-w-lg mx-auto mb-6">
            Get our complete readership demographic breakdown, case studies, and ad rate sheet.
          </p>
          <Link
            href="/contact"
            className="px-6 py-3 bg-[#C61D1F] hover:bg-[#A51719] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors inline-flex items-center space-x-2"
          >
            <span>Contact Advertising Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
