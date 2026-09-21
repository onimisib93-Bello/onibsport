import HeroCarousel from "@/components/HeroCarousel";
import ArticleCard from "@/components/ArticleCard";
import SectionHeading from "@/components/SectionHeading";
import TrendingSidebar from "@/components/TrendingSidebar";
import NigeriaRail from "@/components/NigeriaRail";
import FeaturedVideo from "@/components/FeaturedVideo";
import TransferTicker from "@/components/TransferTicker";
import YouTubeSection from "@/components/YouTubeSection";
import AdSlot from "@/components/AdSlot";
import Reveal from "@/components/motion/Reveal";
import { getLatestArticles, getArticlesByCategory, articles } from "@/lib/data/articles";
import { videos } from "@/lib/data/videos";

export default function Home() {
  const latest = getLatestArticles(9);
  const heroSlides = [...latest].sort((a, b) => Number(!!b.isBreaking) - Number(!!a.isBreaking)).slice(0, 4);
  const gridArticles = latest.slice(1, 7);
  const trending = latest.slice(0, 5);
  const nigeriaArticles = [...getArticlesByCategory("nigeria-football"), ...getArticlesByCategory("npfl")].slice(0, 3);
  const transferArticles = getArticlesByCategory("transfers");
  const videoArticle = articles.find((a) => a.featuredVideoUrl);
  const editorsPicks = latest.slice(4, 7);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <HeroCarousel articles={heroSlides} />
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <AdSlot variant="leaderboard" />
      </div>

      <TransferTicker articles={transferArticles} />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SectionHeading title="Latest News" href="/category/premier-league" />
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
          <Reveal stagger className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {gridArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </Reveal>
          <div className="space-y-6">
            <TrendingSidebar articles={trending} />
            <AdSlot variant="sidebar" />
          </div>
        </div>
      </section>

      <NigeriaRail articles={nigeriaArticles} />

      {videoArticle && (
        <Reveal>
          <FeaturedVideo article={videoArticle} />
        </Reveal>
      )}

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SectionHeading title="Editor's Picks" accent="gold" />
        <Reveal stagger className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {editorsPicks.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </Reveal>
      </section>

      <YouTubeSection videos={videos} />

      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <AdSlot variant="leaderboard" />
      </div>
    </>
  );
}
