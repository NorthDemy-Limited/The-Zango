"use client";

import React, { useState } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle2, Share2 } from "lucide-react";
import { TwitterIcon, LinkedinIcon, InstagramIcon } from "@/components/social-icons";
import { SITE_CONFIG } from "@/config/site";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string>("Thank you for reaching out. An editor or desk representative will follow up within 24 hours.");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.isMerchant) {
          setSuccessNote("Your Merchant Onboarding Application has been registered and forwarded to the Executive Newsroom and Marketplace Desk. You will receive an official notification.");
        }
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setErrorMessage(data.message || "Failed to submit message. Please try again.");
      }
    } catch {
      // Offline fallback: still acknowledge user
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 lg:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center space-x-2 text-[#C61D1F] text-xs font-bold uppercase tracking-widest mb-3">
            <Mail className="w-3.5 h-3.5" />
            <span>Get In Touch</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight mb-4">
            Contact The Zango
          </h1>
          <p className="text-base text-[#535252] leading-relaxed">
            Reach out to our editorial desk, send news tips, inquire about advertising, or discuss strategic partnerships.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Contact Information (Left - 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E6E8]">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#C61D1F] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#000000] mb-1">Newsroom & Tips</h3>
                  <p className="text-xs text-[#707070] mb-2">Send anonymous leads, press releases, and inquiries:</p>
                  <a href="mailto:tips@thezango.com" className="text-sm font-bold text-[#C61D1F] hover:underline">
                    tips@thezango.com
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E6E8]">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#C61D1F] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#000000] mb-1">Bureaus</h3>
                  <p className="text-xs text-[#707070]">
                    Kano Bureau: Bompai District, Kano State, Nigeria.<br />
                    Abuja Bureau: Central Business District, FCT, Nigeria.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E6E8]">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#C61D1F] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#000000] mb-1">Direct Line</h3>
                  <p className="text-xs text-[#707070] mb-1">Operational desk (9 AM - 6 PM WAT):</p>
                  <p className="text-sm font-bold text-[#000000]">+234 (0) 800-ZANGO-NEWS</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E6E8]">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#C61D1F] flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#000000] mb-1">Official Channels</h3>
                  <p className="text-xs text-[#707070] mb-3">Follow and engage with our newsroom desks:</p>
                  <div className="flex items-center space-x-2">
                    <a
                      href={SITE_CONFIG.socials.twitter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white border border-[#E5E6E8] hover:border-[#C61D1F] text-[#535252] hover:text-[#C61D1F] flex items-center justify-center transition-colors"
                      title="Follow on X (Twitter)"
                      aria-label="Follow on X (Twitter)"
                    >
                      <TwitterIcon className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={SITE_CONFIG.socials.linkedin.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white border border-[#E5E6E8] hover:border-[#C61D1F] text-[#535252] hover:text-[#C61D1F] flex items-center justify-center transition-colors"
                      title="Connect on LinkedIn"
                      aria-label="Connect on LinkedIn"
                    >
                      <LinkedinIcon className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={SITE_CONFIG.socials.instagram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white border border-[#E5E6E8] hover:border-[#C61D1F] text-[#535252] hover:text-[#C61D1F] flex items-center justify-center transition-colors"
                      title="Follow on Instagram"
                      aria-label="Follow on Instagram"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form (Right - 7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E5E6E8] p-8 rounded-3xl shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold text-[#000000]">Message Received!</h3>
                <p className="text-sm text-[#707070] max-w-sm mx-auto">
                  {successNote}
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 bg-[#C61D1F] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#A51719] transition-colors mt-4 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amina Garba"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-sm text-[#111111] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="amina@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-sm text-[#111111] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="News Tip / Editorial / Advertising"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-sm text-[#111111] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider mb-2">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Write your story tip or message in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-sm text-[#111111] focus:outline-hidden resize-none"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#C61D1F] hover:bg-[#A51719] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? "Delivering..." : "Submit Inquiry"}</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
