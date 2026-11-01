import { ARTICLES } from "@/data/mock-articles";
import HeroSection from "@/components/hero-section";
import EditorsPicks from "@/components/editors-picks";
import TrendingPopular from "@/components/trending-popular";
import StayInformedBanner from "@/components/stay-informed-banner";
import CategoryGrid from "@/components/category-grid";
import ZangoExperience from "@/components/zango-experience";

export default function HomePage() {
  const featuredArticle = ARTICLES.find((a) => a.isFeatured) || ARTICLES[0];
  const latestNews = ARTICLES.filter((a) => a.isLatest);
  const editorsPicks = ARTICLES.slice(6, 10);
  const trendingArticle = ARTICLES.find((a) => a.isTrending) || ARTICLES[2];
  const popularArticles = ARTICLES.filter((a) => a.isPopular).sort(
    (a, b) => (a.popularRank || 99) - (b.popularRank || 99)
  );

  return (
    <div className="space-y-2">
      {/* 1. Hero: Featured Headline Article + Latest News Sidebar */}
      <HeroSection featuredArticle={featuredArticle} latestNews={latestNews} />

      {/* 2. Editor's Picks (4-Card Responsive Grid) */}
      <EditorsPicks articles={editorsPicks} />

      {/* 3. Trending Now & Popular On The Zango */}
      <TrendingPopular
        trendingArticle={trendingArticle}
        popularArticles={popularArticles}
      />

      {/* 4. Stay Informed Newsletter & Follow Us Hub */}
      <StayInformedBanner />

      {/* 5. Browse by Category */}
      <CategoryGrid />

      {/* 6. The Zango Experience Multimedia Showcase */}
      <ZangoExperience />
    </div>
  );
}
