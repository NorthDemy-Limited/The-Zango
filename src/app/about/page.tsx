import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Target, Users, Globe2, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="py-12 lg:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-3">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Our Mission</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight mb-6">
            The Definitive Voice of Northern Nigeria&apos;s Renaissance
          </h1>
          <p className="text-base sm:text-lg text-[#535252] leading-relaxed">
            The Zango is an independent digital publication committed to uncovering, analyzing, and amplifying stories of enterprise, technology innovation, and civic progress across Northern Nigeria and the wider African continent.
          </p>
        </div>

        {/* Brand Banner */}
        <div className="relative w-full h-[320px] sm:h-[420px] rounded-3xl overflow-hidden mb-16 shadow-lg">
          <Image
            src="/assets/experience-banner.png"
            alt="The Zango Editorial Team"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 rounded-2xl border border-[#E5E6E8] bg-[#FAFAFA]">
            <Target className="w-8 h-8 text-[#C61D1F] mb-4" />
            <h3 className="text-lg font-bold text-[#000000] mb-2">Rigorous Fact-Checking</h3>
            <p className="text-xs sm:text-sm text-[#707070] leading-relaxed">
              We uphold uncompromising journalistic standards. Our newsroom independently verifies economic data, company announcements, and public disclosures.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-[#E5E6E8] bg-[#FAFAFA]">
            <Users className="w-8 h-8 text-[#C61D1F] mb-4" />
            <h3 className="text-lg font-bold text-[#000000] mb-2">Ground-Level Perspective</h3>
            <p className="text-xs sm:text-sm text-[#707070] leading-relaxed">
              Our network of correspondents lives and works directly within communities from Sokoto, Kano, and Maiduguri to Kaduna, Jos, and Abuja.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-[#E5E6E8] bg-[#FAFAFA]">
            <ShieldCheck className="w-8 h-8 text-[#C61D1F] mb-4" />
            <h3 className="text-lg font-bold text-[#000000] mb-2">Editorial Independence</h3>
            <p className="text-xs sm:text-sm text-[#707070] leading-relaxed">
              Our reporting is free from commercial or political censorship. We serve our readers first, delivering transparent insights without bias.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-[#000000] text-white rounded-3xl p-8 sm:p-12 text-center shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Join the Conversation
          </h2>
          <p className="text-sm text-gray-300 max-w-lg mx-auto mb-6">
            Have a story lead or pitch? Our editorial desk welcomes investigative contributions and guest columns.
          </p>
          <Link
            href="/contact"
            className="px-6 py-3 bg-[#C61D1F] hover:bg-[#A51719] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors inline-flex items-center space-x-2"
          >
            <span>Contact the Newsroom</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
