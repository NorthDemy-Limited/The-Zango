"use client";

import React, { useState } from "react";
import { CheckCircle2, Mail, Send } from "lucide-react";
import { FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon } from "@/components/social-icons";

export default function StayInformedBanner() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes("@")) {
      setSubmitted(true);
      setEmail("");
    }
  };

  const socials = [
    {
      name: "Facebook",
      label: "Like us on Facebook",
      href: "https://facebook.com",
      icon: FacebookIcon,
      bgColor: "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white",
    },
    {
      name: "Twitter",
      label: "Follow us on Twitter",
      href: "https://twitter.com",
      icon: TwitterIcon,
      bgColor: "bg-neutral-100 text-neutral-800 hover:bg-black hover:text-white",
    },
    {
      name: "Instagram",
      label: "Follow us on Instagram",
      href: "https://instagram.com",
      icon: InstagramIcon,
      bgColor: "bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white",
    },
    {
      name: "YouTube",
      label: "Subscribe on YouTube",
      href: "https://youtube.com",
      icon: YoutubeIcon,
      bgColor: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Social Channels Widget (Left - 5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E6E8] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 pb-3 mb-5 border-b border-[#E5E6E8]">
                <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
                <h3 className="text-lg font-bold text-[#000000] uppercase tracking-wide">
                  Follow Us
                </h3>
              </div>

              <div className="space-y-3.5">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E6E8] hover:border-[#C61D1F] group transition-all duration-200 hover:shadow-2xs"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${s.bgColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-[#535252] group-hover:text-[#000000]">
                          {s.label}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#9C9C9C] group-hover:text-[#C61D1F] transition-colors">
                        →
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5E6E8] text-center">
              <span className="text-xs text-[#9C9C9C]">
                Join 100K+ engaged followers across all channels
              </span>
            </div>
          </div>

          {/* Stay Informed Newsletter Card (Right - 7 cols) */}
          <div className="lg:col-span-7 bg-[#000000] text-white rounded-2xl p-6 sm:p-10 shadow-xl flex flex-col justify-between relative overflow-hidden">
            {/* Visual Red Dot Accent */}
            <div className="absolute top-6 right-6 flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-white opacity-40 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#C61D1F] inline-block animate-pulse" />
            </div>

            <div>
              {/* Header */}
              <div className="flex items-center space-x-2 text-red-500 mb-2">
                <Mail className="w-5 h-5 text-[#C61D1F]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#C61D1F]">
                  Daily Briefing
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-white mb-2">
                Stay Informed
              </h2>
              <p className="text-sm sm:text-base text-gray-300 max-w-xl mb-8 leading-relaxed">
                Get the biggest stories in your inbox, once a day. Curated analysis, breaking updates, and insider stories from Northern Nigeria.
              </p>

              {/* Subscription Form */}
              {submitted ? (
                <div className="bg-white/10 border border-green-500/40 rounded-xl p-4 flex items-center space-x-3 text-green-300">
                  <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">You are now subscribed to The Zango Brief!</p>
                    <p className="text-xs text-gray-300">Check your inbox to confirm your subscription.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg bg-white text-[#111111] placeholder-[#9C9C9C] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#C61D1F] shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-lg bg-[#C61D1F] hover:bg-[#A51719] text-white font-bold text-xs uppercase tracking-wider transition-colors duration-200 flex items-center justify-center space-x-2 shrink-0 cursor-pointer shadow-md"
                  >
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>

            {/* Footer / Privacy note */}
            <div className="pt-6 mt-6 border-t border-white/15">
              <p className="text-xs text-gray-400">
                No spam. Unsubscribe anytime. We respect your privacy.
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
