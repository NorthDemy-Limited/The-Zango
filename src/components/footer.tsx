"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Send, CheckCircle2 } from "lucide-react";
import { FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon } from "@/components/social-icons";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dashboards operate as full-screen dedicated workspaces without public website footer
  if (pathname?.startsWith("/dashboard") || pathname === "/login") {
    return null;
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setEmail("");
      }
    } catch (err) {
      console.warn("Newsletter subscription error:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: "News", href: "/category/news" },
    { name: "Business", href: "/category/business" },
    { name: "Technology", href: "/category/technology" },
    { name: "Lifestyle", href: "/category/lifestyle" },
    { name: "Sports", href: "/category/sports" },
    { name: "Opinion", href: "/category/opinion" },
    { name: "Politics", href: "/category/politics" },
    { name: "Entertainment", href: "/category/entertainment" },
    { name: "Health", href: "/category/health" },
    { name: "Education", href: "/category/education" },
  ];

  const quickLinks = [
    { name: "About Us", href: "/about" },
    { name: "All Categories", href: "/categories" },
    { name: "Trending Now", href: "/trending" },
    { name: "Advertise With Us", href: "/advertise" },
    { name: "Contact Us", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Use", href: "/terms" },
    { name: "Editor CMS", href: "/dashboard/admin" },
    { name: "Writer Studio", href: "/dashboard/author" },
  ];

  return (
    <footer className="bg-white border-t border-[#DFDFDF] pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#E5E6E8]">
          
          {/* Brand Info (Left - 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-block">
              <div className="relative w-44 h-14">
                <Image
                  src="/assets/logo.png"
                  alt="The Zango Logo"
                  fill
                  sizes="176px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            <p className="text-sm text-[#707070] leading-relaxed max-w-sm">
              The Zango is Your trusted source for breaking news, insightful analysis, and stories that matter to you.
            </p>

            {/* Social Icons */}
            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#C61D1F] text-[#535252] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#C61D1F] text-[#535252] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#C61D1F] text-[#535252] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#C61D1F] text-[#535252] hover:text-white flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categories (3 cols) */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <h4 className="text-sm font-extrabold text-[#000000] uppercase tracking-wider mb-1">
                Categories
              </h4>
              <span className="w-8 h-0.5 bg-[#C61D1F] block rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="text-xs sm:text-sm text-[#707070] hover:text-[#C61D1F] transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links (2 cols) */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h4 className="text-sm font-extrabold text-[#000000] uppercase tracking-wider mb-1">
                Quick Links
              </h4>
              <span className="w-8 h-0.5 bg-[#C61D1F] block rounded-full" />
            </div>

            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-[#707070] hover:text-[#C61D1F] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter (3 cols) */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <h4 className="text-sm font-extrabold text-[#000000] uppercase tracking-wider mb-1">
                Newsletter
              </h4>
              <span className="w-8 h-0.5 bg-[#C61D1F] block rounded-full" />
            </div>

            <p className="text-xs sm:text-sm text-[#707070] mb-4 leading-relaxed">
              Subscribe to our newsletter and get the latest news updates delivered to your inbox.
            </p>

            {submitted ? (
              <div className="bg-[#FDF2F2] border border-red-200 rounded-lg p-3 flex items-center space-x-2 text-xs text-[#C61D1F] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex border border-[#DFDFDF] rounded-lg overflow-hidden bg-white focus-within:border-[#C61D1F]">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-[#111111] placeholder-[#9C9C9C] focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#C61D1F] hover:bg-[#A51719] text-white px-3.5 py-2 text-xs font-bold uppercase transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px] text-[#9C9C9C] block">
                  We respect your privacy. No spam.
                </span>
              </form>
            )}
          </div>

        </div>

        {/* Bottom Copyright & Legal Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#707070] gap-4">
          <p>© 2026 The Zango All Rights Reserved</p>

          <div className="flex items-center space-x-6 text-[#535252]">
            <Link href="/advertise" className="hover:text-[#C61D1F] transition-colors">
              Advertise
            </Link>
            <Link href="/contact" className="hover:text-[#C61D1F] transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-[#C61D1F] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#C61D1F] transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
