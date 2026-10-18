import HeroCarousel from "@/components/HeroCarousel";
import ArticleCard from "@/components/ArticleCard";
import SectionHeading from "@/components/SectionHeading";
import TrendingSidebar from "@/components/TrendingSidebar";
import NigeriaRail from "@/components/NigeriaRail";
import TransferTicker from "@/components/TransferTicker";
import YouTubeSection from "@/components/YouTubeSection";
import AdSlot from "@/components/AdSlot";
import ScoresStrip from "@/components/home/ScoresStrip";
import LeagueDesk, { type DeskData } from "@/components/home/LeagueDesk";
import LeagueHubs from "@/components/home/LeagueHubs";
import EditorsPicks from "@/components/home/EditorsPicks";
import WeekInPictures from "@/components/home/WeekInPictures";
import {
  getLatestArticles,
  getFeaturedArticles,
  getArticlesByCategory,
  getFeaturedVideoArticle,
} from "@/lib/data/db-articles";
import { getFixturesForLeague, getScoreboard, getStandingsForLeague } from "@/lib/live/footballData";
import { videos } from "@/lib/data/videos";
import { CategorySlug } from "@/lib/types";

export const revalidate = 60;

const DESK_LEAGUES: CategorySlug[] = ["premier-league", "la-liga", "serie-a", "bundesliga", "champions-league", "npfl"];

export default async function Home() {
  const [latest, featured, nigeriaFootball, npfl, transferArticles, videoArticle, scoreboard, naijaFixtures, npflFixtures, deskArticles, deskTables] =
    await Promise.all([
      getLatestArticles(30),
      getFeaturedArticles(10),
      getArticlesByCategory("nigeria-football", 6),
      getArticlesByCategory("npfl", 6),
      getArticlesByCategory("transfers", 10),
      getFeaturedVideoArticle(),
      getScoreboard(),
      getFixturesForLeague("nigeria-football"),
      getFixturesForLeague("npfl"),
      Promise.all(DESK_LEAGUES.map((slug) => getArticlesByCategory(slug, 5))),
      Promise.all(DESK_LEAGUES.map((slug) => getStandingsForLeague(slug))),
    ]);

  // Articles marked "Feature on homepage" in the admin get priority for the hero
  // and Editor's Picks, while staying listed under their own category too.
  // Featured stories lead (breaking first); the latest stories fill any remaining slots.
  const featuredSlugs = new Set(featured.map((a) => a.slug));
  const heroPool = [...[...featured].sort((a, b) => Number(!!b.isBreaking) - Number(!!a.isBreaking)), ...latest.filter((a) => !featuredSlugs.has(a.slug))];
  const heroSlides = heroPool.slice(0, 4);
  const heroSlugs = new Set(heroSlides.map((a) => a.slug));
  const river = latest.filter((a) => !heroSlugs.has(a.slug));
  const [riverLead, ...riverRest] = river;
  const trending = latest.slice(0, 6);
  const editorsPicks = heroPool.filter((a) => !heroSlugs.has(a.slug)).slice(0, 8);
  const moreStories = river.slice(7, 15);

  const nigeriaArticles = [...nigeriaFootball, ...npfl].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)).slice(0, 5);
  const naijaUpcoming = [...naijaFixtures, ...npflFixtures]
    .filter((f) => f.status !== "finished")
    .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));

  const desks: DeskData[] = DESK_LEAGUES.map((slug, i) => ({ slug, articles: deskArticles[i], standings: deskTables[i] })).filter(
    (d) => d.articles.length > 0 || (d.standings?.length ?? 0) > 0
  );

  return (
    <>
      <h1 className="sr-only">Onibsport — football news, transfers and live scores</h1>

      {heroSlides.length > 0 && (
        <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-5 sm:px-6">
          <HeroCarousel articles={heroSlides} />
        </div>
      )}

      <ScoresStrip initial={scoreboard} />

      <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6">
        <AdSlot variant="leaderboard" />
      </div>

      {river.length > 0 && (
        <section aria-labelledby="latest-title" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
          <SectionHeading id="latest-title" title="Latest" href="/search" linkLabel="Search the archive" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              {riverLead && <ArticleCard article={riverLead} size="large" />}
              <div className="mt-10 divide-y divide-line border-t border-line">
                {riverRest.slice(0, 6).map((article) => (
                  <div key={article.slug} className="py-6">
                    <ArticleCard article={article} size="row" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
              <TrendingSidebar articles={trending} />
              <AdSlot variant="sidebar" />
            </div>
          </div>
        </section>
      )}

      <TransferTicker articles={transferArticles} />

      {desks.length > 0 && <LeagueDesk desks={desks} />}

      <LeagueHubs />

      <EditorsPicks articles={editorsPicks} />

      <NigeriaRail articles={nigeriaArticles} npflTable={deskTables[DESK_LEAGUES.indexOf("npfl")]} upcoming={naijaUpcoming} />

      <YouTubeSection videos={videos} featured={videoArticle} />

      <WeekInPictures articles={latest} />

      {moreStories.length > 0 && (
        <section aria-labelledby="more-title" className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
          <SectionHeading id="more-title" title="More stories" />
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {moreStories.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-[1400px] px-4 pb-6 sm:px-6">
        <AdSlot variant="leaderboard" />
      </div>
    </>
  );
}
