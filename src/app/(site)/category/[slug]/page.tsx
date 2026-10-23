import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { categories, getCategory } from "@/lib/data/categories";
import { getArticlesByCategory } from "@/lib/data/db-articles";
import { getFixturesForLeague, getFixturesForRange, getStandingsForLeague, getTopScorers, todayIso } from "@/lib/live/footballData";
import { shiftDate } from "@/lib/time";
import type { Fixture } from "@/lib/types";
import { leagueTheme } from "@/lib/leagues";
import ArticleCard from "@/components/ArticleCard";
import LeagueDataTabs from "@/components/LeagueDataTabs";
import StandingsTable from "@/components/StandingsTable";
import TrendingSidebar from "@/components/TrendingSidebar";
import AdSlot from "@/components/AdSlot";
import AutoRefresh from "@/components/AutoRefresh";
import HubIntro from "@/components/league/HubIntro";
import HubPortal from "@/components/league/HubPortal";
import TransferTimeline from "@/components/league/TransferTimeline";
import { breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 60;

/** Refresh the open page every minute only while a match is live or about to kick off. */
function liveOrSoon(fixtures: Fixture[]) {
  const soon = Date.now() + 15 * 60_000;
  return fixtures.some((f) => f.status === "live" || (f.status === "upcoming" && +new Date(f.kickoff) <= soon));
}

/** World Football has no single league, so its match centre covers every competition this week. */
async function hubFixtures(slug: string): Promise<Fixture[]> {
  if (slug === "world-football") {
    const today = todayIso();
    return getFixturesForRange(shiftDate(today, -3), shiftDate(today, 5));
  }
  return getFixturesForLeague(slug as Parameters<typeof getFixturesForLeague>[0]);
}

/** Hubs that open with the glyph-portal camera move, and the word it flies through. */
const PORTAL_WORDS: Record<string, string> = {
  "nigeria-football": "NAIJA",
  npfl: "NPFL",
};

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const description = `${leagueTheme(slug).blurb} The latest ${category.name} news, results, fixtures and table on Onibsport.`;
  return {
    title: `${category.name} news, results, fixtures and table`,
    description,
    keywords: [category.name, `${category.name} news`, `${category.name} results`, `${category.name} fixtures`, `${category.name} table`, "Onibsport"],
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${category.name} — Onibsport`,
      description,
      type: "website",
      url: `/category/${category.slug}`,
      images: [{ url: "/covers/default-cover.jpg", width: 1200, height: 630, alt: `Onibsport — ${category.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} — Onibsport`,
      description,
      images: ["/covers/default-cover.jpg"],
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const theme = leagueTheme(slug);

  const [articles, fixtures, standings, scorers] = await Promise.all([
    getArticlesByCategory(slug),
    hubFixtures(category.slug),
    getStandingsForLeague(category.slug),
    getTopScorers(category.slug),
  ]);
  const [lead, ...rest] = articles;
  const gridArticles = rest.slice(0, 4);
  const riverArticles = rest.slice(4);
  const hasTable = !!standings && standings.length > 0;
  // The match centre shows whenever there is anything to put in it.
  const hasMatches = fixtures.length > 0 || hasTable || scorers.length > 0;
  const next = fixtures.filter((f) => f.status === "upcoming").sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff))[0];
  const portalWord = PORTAL_WORDS[slug];

  const jsonLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: category.name, path: `/category/${category.slug}` },
  ]);

  const intro = <HubIntro category={category} theme={theme} storyCount={articles.length} standings={standings} next={next} />;

  const sections = [
    { href: "#latest", label: "Latest", show: true },
    { href: "#match-centre", label: fixtures.length > 0 ? "Results & fixtures" : "Match centre", show: hasMatches },
    { href: "#table", label: "Table", show: hasTable },
    { href: "#timeline", label: "Timeline", show: slug === "transfers" },
  ].filter((s) => s.show);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {liveOrSoon(fixtures) && <AutoRefresh />}

      {portalWord ? (
        <HubPortal word={portalWord} image={lead?.image || lead?.coverImage} deep={theme.deep} tint={theme.tint} eyebrow={`Onibsport ${category.name} desk`}>
          {intro}
        </HubPortal>
      ) : (
        <section className="relative overflow-hidden px-4 pb-14 pt-14 sm:px-6 sm:pt-20" style={{ background: theme.deep }}>
          <div className="pitch-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
            style={{ background: theme.tint }}
            aria-hidden="true"
          />
          <div className="relative">{intro}</div>
        </section>
      )}

      {sections.length > 1 && (
        <nav aria-label={`${category.name} sections`} className="border-b border-line bg-white">
          <ul className="no-scrollbar mx-auto flex h-14 max-w-[1400px] items-center gap-2 overflow-x-auto px-4 sm:px-6">
            {sections.map((s) => (
              <li key={s.href} className="shrink-0">
                <a href={s.href} className="rounded-full px-4 py-2 text-sm font-bold text-ink/70 transition-colors hover:bg-paper hover:text-ink">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div id="latest" className="mx-auto max-w-[1400px] scroll-mt-32 px-4 py-12 sm:px-6">
        <div className={hasMatches ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px]" : "grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"}>
          <div>
            {articles.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 ring-1 ring-line">
                <h2 className="font-display text-3xl font-black text-ink">No {category.name} stories yet</h2>
                <p className="mt-2 text-muted">New stories appear here as soon as they&apos;re published. Meanwhile, catch up on the rest of the site.</p>
                <Link href="/" className="mt-5 inline-flex rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo">
                  Back to the front page
                </Link>
              </div>
            ) : (
              <>
                {lead && <ArticleCard article={lead} size="large" priority />}
                {gridArticles.length > 0 && (
                  <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2">
                    {gridArticles.map((article) => (
                      <ArticleCard key={article.slug} article={article} />
                    ))}
                  </div>
                )}
                {riverArticles.length > 0 && (
                  <div className="mt-12 divide-y divide-line border-t border-line">
                    {riverArticles.map((article) => (
                      <div key={article.slug} className="py-6">
                        <ArticleCard article={article} size="row" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="space-y-6">
            {hasMatches ? (
              <section id="match-centre" aria-labelledby="match-centre-title" className="scroll-mt-32">
                <h2 id="match-centre-title" className="mb-4 font-display text-4xl font-black text-ink">
                  Match centre
                </h2>
                <LeagueDataTabs
                  league={category.slug}
                  fixtures={fixtures}
                  standings={standings}
                  scorers={scorers}
                  showLeague={category.slug === "world-football"}
                  accent={theme.deep}
                />
              </section>
            ) : (
              <TrendingSidebar articles={articles.slice(0, 6)} title={`More ${category.shortName}`} />
            )}
            <AdSlot placement="hub-sidebar" />
          </aside>
        </div>
      </div>

      {slug === "transfers" && articles.length >= 3 && <TransferTimeline articles={articles} />}

      {hasTable && (
        <section id="table" aria-labelledby="table-title" className="mx-auto max-w-[1400px] scroll-mt-32 px-4 pb-6 pt-6 sm:px-6">
          <h2 id="table-title" className="mb-5 font-display text-4xl font-black text-ink sm:text-5xl">
            {category.name} table
          </h2>
          <StandingsTable rows={standings!} accent={theme.deep} league={category.slug} />
        </section>
      )}
    </>
  );
}
