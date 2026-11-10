import { getArticles } from "@/lib/firebase/db";
import HeroSection from "@/components/hero-section";
import EditorsPicks from "@/components/editors-picks";
import TrendingPopular from "@/components/trending-popular";
import StayInformedBanner from "@/components/stay-informed-banner";
import CategoryGrid from "@/components/category-grid";
import ZangoExperience from "@/components/zango-experience";

export const instant = false;

export default async function HomePage() {
  const articles = await getArticles();
  const featuredArticle = articles.find((a) => a.isFeatured) || articles[0];
  const latestNews = articles.filter((a) => a.isLatest);
  const editorsPicks = articles.filter((a) => a.isEditorsPick).length > 0
    ? articles.filter((a) => a.isEditorsPick)
    : articles.slice(6, 10);
  const trendingArticle = articles.find((a) => a.isTrending) || articles[2];
  const popularArticles = articles
    .filter((a) => a.isPopular)
    .sort((a, b) => (a.popularRank || 99) - (b.popularRank || 99));

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
