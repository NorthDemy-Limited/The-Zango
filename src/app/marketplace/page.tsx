"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Store, ShieldCheck, Zap, Sparkles } from "lucide-react";
import MerchantRegistrationModal from "@/components/merchant-registration-modal";

export default function MarketplacePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  return (
    <div className="py-10 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-3">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>The Zango Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight mb-4">
            Connecting Regional Creators, Agro-Producers & Tech Vendors
          </h1>
          <p className="text-base sm:text-lg text-[#535252] leading-relaxed">
            The Zango Marketplace is a curated commerce ecosystem showcasing certified northern Nigerian goods, software services, creative arts, and enterprise tools to national and global buyers.
          </p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-2xl border border-[#E5E6E8] bg-[#FAFAFA]">
            <Store className="w-8 h-8 text-[#C61D1F] mb-4" />
            <h3 className="text-lg font-bold text-[#000000] mb-2">Verified Regional Merchants</h3>
            <p className="text-xs sm:text-sm text-[#707070] leading-relaxed">
              Every vendor passes rigorous supply chain and business entity verification before listing products.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#E5E6E8] bg-[#FAFAFA]">
            <Zap className="w-8 h-8 text-[#C61D1F] mb-4" />
            <h3 className="text-lg font-bold text-[#000000] mb-2">Digital Exports & B2B</h3>
            <p className="text-xs sm:text-sm text-[#707070] leading-relaxed">
              Wholesale agricultural commodities, artisanal leatherware, and engineering talent contracts.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#E5E6E8] bg-[#FAFAFA]">
            <ShieldCheck className="w-8 h-8 text-[#C61D1F] mb-4" />
            <h3 className="text-lg font-bold text-[#000000] mb-2">Escrow Protection</h3>
            <p className="text-xs sm:text-sm text-[#707070] leading-relaxed">
              Seamless local currency and cross-border settlement with milestone escrow protections.
            </p>
          </div>
        </div>

        {/* Registration Callout Box */}
        <div className="bg-[#000000] text-white rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#C61D1F]/20 rounded-full blur-2xl" />
          
          <span className="bg-[#C61D1F] text-white px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider mb-4 inline-block">
            Beta Cohort Application
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Want to list your brand on The Zango Marketplace?
          </h2>
          <p className="text-sm text-gray-300 max-w-lg mx-auto mb-6">
            Early merchant applications are currently being reviewed for our pilot vendor cohort. Join certified regional suppliers connecting directly with verified institutional buyers.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-6 py-3.5 bg-[#C61D1F] hover:bg-[#A51719] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg inline-flex items-center space-x-2 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Register as a Merchant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <Link
              href="/contact?subject=Marketplace+Inquiry"
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all inline-flex items-center space-x-2"
            >
              <span>Contact Commercial Desk</span>
            </Link>
          </div>

          {registeredSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Your merchant application has been successfully dispatched to the Bureau!</span>
            </div>
          )}
        </div>

      </div>

      {/* Dedicated Merchant Registration Modal */}
      <MerchantRegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setRegisteredSuccess(true);
          setTimeout(() => setRegisteredSuccess(false), 8000);
        }}
      />
    </div>
  );
}
