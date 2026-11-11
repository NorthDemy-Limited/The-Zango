"use client";

import React, { useState } from "react";
import { 
  X, 
  Store, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Tag, 
  Globe, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { MerchantApplication } from "@/types";

interface MerchantRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (merchant: MerchantApplication) => void;
}

const MERCHANT_CATEGORIES = [
  "Agro-Commodities & Produce",
  "Artisanal Leatherware & Crafts",
  "Textiles & Modest Fashion",
  "Tech, Software & Digital Services",
  "Food Processing & FMCG",
  "Renewable Energy & Solar Hardware",
  "Publishing, Media & Creative Arts",
  "Other Enterprise Supplies",
];

const NORTHERN_STATES = [
  "Kano State",
  "Kaduna State",
  "FCT Abuja",
  "Sokoto State",
  "Katsina State",
  "Borno State",
  "Bauchi State",
  "Jigawa State",
  "Niger State",
  "Gombe State",
  "Zamfara State",
  "Kebbi State",
  "Adamawa State",
  "Plateau State",
  "Yobe State",
  "Nasarawa State",
  "Taraba State",
  "Benue State",
  "Kogi State",
  "Other Regional Hub",
];

export default function MerchantRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: MerchantRegistrationModalProps) {
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    category: MERCHANT_CATEGORIES[0],
    location: NORTHERN_STATES[0],
    description: "",
    website: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.email.trim() || !formData.description.trim()) {
      setErrorMessage("Please complete all required fields (*).");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/marketplace/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        if (onSuccess && data.merchant) {
          onSuccess(data.merchant);
        }
      } else {
        setErrorMessage(data.message || "Failed to submit merchant registration. Please try again.");
      }
    } catch {
      setErrorMessage("Network error connecting to marketplace registry. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setErrorMessage(null);
    setFormData({
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      category: MERCHANT_CATEGORIES[0],
      location: NORTHERN_STATES[0],
      description: "",
      website: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-7 border-b border-slate-100 bg-[#FDFBF7]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF2F2] text-[#C61D1F] flex items-center justify-center border border-red-100 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#C61D1F]">
                <Sparkles className="w-3 h-3" />
                <span>Marketplace Onboarding</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                Register as a Verified Merchant
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex-1">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Application Received & Forwarded</span>
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {formData.businessName} has been Registered!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your merchant onboarding dossier has been dispatched directly to the Executive Bureau and Marketplace Desk. You will receive an official notification and clearance update at <span className="font-semibold text-slate-800">{formData.email}</span>.
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-in fade-in">
                  {errorMessage}
                </div>
              )}

              {/* Grid 1: Business Name & Contact Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Brand / Business Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sahel Agro Commodities Ltd"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold text-slate-900 focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Contact Person Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aliyu Mustapha"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold text-slate-900 focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Business Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="orders@yourbrand.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold text-slate-900 focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Phone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="+234 803 000 0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold text-slate-900 focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 3: Category & Operational State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Merchant Category *
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold text-slate-900 focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all cursor-pointer"
                    >
                      {MERCHANT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Primary Operational Hub / State *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold text-slate-900 focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all cursor-pointer"
                    >
                      {NORTHERN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description / Products */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Products, Services & Supply Capacity *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe what your brand produces, monthly capacity, packaging standards, and target buyers..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold text-slate-900 focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>

              {/* Website / Social Profile (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Website / Social Showcase Link (Optional)
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://yourbrand.com or https://instagram.com/yourbrand"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#C61D1F] text-xs font-semibold text-slate-900 focus:outline-hidden bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#C61D1F] hover:bg-[#A51719] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? "Submitting Application..." : "Submit Merchant Application"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2.5">
                  All merchant applications undergo entity and supply chain authentication before inclusion.
                </p>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
