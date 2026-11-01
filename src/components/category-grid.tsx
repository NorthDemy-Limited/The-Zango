import React from "react";
import Link from "next/link";
import { ArrowRight, Newspaper, Briefcase, Cpu, MessageSquareText, Coffee, Trophy } from "lucide-react";
import { CATEGORIES } from "@/data/mock-articles";

export default function CategoryGrid() {
  const iconMap: Record<string, React.ElementType> = {
    news: Newspaper,
    business: Briefcase,
    technology: Cpu,
    opinion: MessageSquareText,
    lifestyle: Coffee,
    sports: Trophy,
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-8 border-b border-[#E5E6E8]">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#000000] tracking-wide uppercase">
              Browse by Category
            </h2>
          </div>
          <Link
            href="/category/news"
            className="text-xs font-bold text-[#000000] hover:text-[#C61D1F] uppercase tracking-wider transition-colors inline-flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Categories Grid (6 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = iconMap[cat.slug] || Newspaper;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative bg-white border border-[#E5E6E8] hover:border-[#C61D1F] rounded-2xl p-5 sm:p-6 text-center shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col items-center justify-between"
              >
                {/* Category Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#F8F9FA] group-hover:bg-[#FDF2F2] flex items-center justify-center text-[#535252] group-hover:text-[#C61D1F] transition-colors mb-3">
                  <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                </div>

                {/* Name */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#000000] group-hover:text-[#C61D1F] transition-colors mb-1">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] font-medium text-[#9C9C9C]">
                    {cat.count} stories
                  </span>
                </div>

                {/* Red Indicator Bar on Hover / Bottom */}
                <div className="w-8 h-1 bg-[#C61D1F] rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
