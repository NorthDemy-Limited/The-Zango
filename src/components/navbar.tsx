"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon } from "@/components/social-icons";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "News", href: "/category/news" },
    { name: "Features", href: "/category/features" },
    { name: "Trending", href: "/trending" },
    { name: "Categories", href: "/categories" },
    { name: "Zango Scope", href: "/scope" },
    { name: "Marketplace", href: "/marketplace" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E6E8] shadow-xs">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="relative w-40 h-12 transition-transform duration-200 group-hover:scale-102">
                <Image
                  src="/assets/logo.png"
                  alt="The Zango Logo"
                  fill
                  sizes="160px"
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-10 h-full">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <div key={link.name} className="relative flex flex-col justify-center h-full">
                  <Link
                    href={link.href}
                    className={`text-[15px] font-semibold transition-colors duration-150 py-2 ${
                      isActive ? "text-[#000000]" : "text-[#535252] hover:text-[#C61D1F]"
                    }`}
                  >
                    {link.name}
                  </Link>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#C61D1F] rounded-t-sm" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Search Bar & Socials (Desktop) */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="flex items-center border border-[#DFDFDF] rounded-md overflow-hidden bg-white shadow-2xs focus-within:border-[#C61D1F] transition-all">
                <input
                  type="text"
                  placeholder="Search News, topic, authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 xl:w-64 px-3.5 py-2 text-sm text-[#111111] placeholder-[#9C9C9C] focus:outline-hidden bg-transparent"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="bg-[#000000] hover:bg-[#C61D1F] text-white p-2.5 transition-colors duration-200 flex items-center justify-center cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Vertical Separator */}
            <div className="h-6 w-px bg-[#DFDFDF]" />

            {/* Social Follow Icons */}
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-[#000000] tracking-wider uppercase">
                Follow Us
              </span>
              <div className="flex items-center space-x-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-[#F5F5F5] hover:bg-[#C61D1F] text-[#535252] hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-[#F5F5F5] hover:bg-[#C61D1F] text-[#535252] hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <TwitterIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-[#F5F5F5] hover:bg-[#C61D1F] text-[#535252] hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-[#F5F5F5] hover:bg-[#C61D1F] text-[#535252] hover:text-white flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <YoutubeIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#535252] hover:text-[#C61D1F] rounded-md transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E6E8] bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
          {/* Mobile Search Input */}
          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div className="flex items-center border border-[#DFDFDF] rounded-md overflow-hidden bg-white">
              <input
                type="text"
                placeholder="Search News, topic, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm text-[#111111] placeholder-[#9C9C9C] focus:outline-hidden"
              />
              <button
                type="submit"
                className="bg-[#000000] text-white p-2.5 flex items-center justify-center"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col space-y-2 pt-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md font-semibold text-base transition-colors ${
                    isActive
                      ? "text-[#C61D1F] bg-[#FDF2F2]"
                      : "text-[#535252] hover:text-[#C61D1F] hover:bg-gray-50"
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#C61D1F]" />}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Socials */}
          <div className="pt-4 border-t border-[#E5E6E8] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#535252] uppercase tracking-wider">
              Follow The Zango
            </span>
            <div className="flex items-center space-x-2">
              <a href="https://facebook.com" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#535252]">
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#535252]">
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#535252]">
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#535252]">
                <YoutubeIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
