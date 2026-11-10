import React from "react";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="py-12 lg:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#E5E6E8]">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Legal Notice</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-tight mb-3">
            Privacy Policy & Terms
          </h1>
          <p className="text-xs text-[#9C9C9C]">
            Last updated: July 2026 • The Zango Media Group
          </p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-6 text-sm sm:text-base text-[#535252] leading-relaxed">
          <p>
            At The Zango, we take reader privacy seriously. This document outlines how we collect, use, and protect any personal data provided while interacting with our digital news services, newsletters, and marketplace.
          </p>

          <h2 className="text-xl font-bold text-[#000000] pt-4">1. Information We Collect</h2>
          <p>
            When you subscribe to The Zango Brief or submit an editorial inquiry, we may collect your email address, name, and preferences. We do not sell, rent, or trade email lists to third-party brokers.
          </p>

          <h2 className="text-xl font-bold text-[#000000] pt-4">2. Cookies & Analytics</h2>
          <p>
            We use privacy-friendly aggregated analytics to understand article readership, time-on-page, and geographic engagement across African states to improve our news coverage.
          </p>

          <h2 className="text-xl font-bold text-[#000000] pt-4">3. Unsubscribe Anytime</h2>
          <p>
            Every newsletter email from The Zango contains an automated, single-click unsubscribe link at the bottom. You can opt out at any time.
          </p>

          <h2 className="text-xl font-bold text-[#000000] pt-4">4. Inquiries</h2>
          <p>
            For privacy-related questions or data deletion requests, email our data officer at{" "}
            <a href="mailto:privacy@thezango.com" className="text-[#C61D1F] font-semibold hover:underline">
              privacy@thezango.com
            </a>.
          </p>
        </div>

      </div>
    </div>
  );
}
