import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="py-12 lg:py-20 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
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

        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#E5E6E8]">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-3">
            <FileText className="w-3.5 h-3.5" />
            <span>Editorial & Commercial Policies</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-tight mb-3">
            Terms of Use
          </h1>
          <p className="text-xs text-[#9C9C9C]">
            Effective Date: July 2026 • The Zango Digital Media
          </p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-6 text-sm sm:text-base text-[#535252] leading-relaxed">
          <p>
            Welcome to The Zango. By accessing or using our websites, digital publications, newsletters, podcasts, or marketplace, you agree to be bound by these Terms of Use.
          </p>

          <h2 className="text-xl font-bold text-[#000000] pt-4">1. Intellectual Property & Syndication</h2>
          <p>
            All articles, investigative reports, audio recordings, graphic layouts, and proprietary data produced by The Zango are protected by copyright. Non-commercial quoting with explicit attribution and a backlink is permitted. Commercial syndication requires prior written approval from our licensing desk.
          </p>

          <h2 className="text-xl font-bold text-[#000000] pt-4">2. Reader Conduct & Moderation</h2>
          <p>
            Readers engaging in public discussions or submitting story leads must refrain from defamation, hate speech, unauthorized dissemination of non-public personal information, or commercial spam.
          </p>

          <h2 className="text-xl font-bold text-[#000000] pt-4">3. Market Information Disclaimer</h2>
          <p>
            Articles regarding venture funding rounds, commodity valuations, and financial instruments are published for educational and journalistic purposes and do not constitute registered investment or legal advice.
          </p>

          <h2 className="text-xl font-bold text-[#000000] pt-4">4. Amendments</h2>
          <p>
            We may revise these Terms periodically. Continued use of our platform constitutes agreement with any revised standards.
          </p>
        </div>

      </div>
    </div>
  );
}
