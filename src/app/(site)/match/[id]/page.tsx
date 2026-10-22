import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatch, getStandingsForLeague, MatchUnavailableError, type MatchInfo } from "@/lib/live/footballData";
import { getMatchDetails } from "@/lib/live/highlightly";
import { searchArticles } from "@/lib/data/db-articles";
import { leagueThemes } from "@/lib/leagues";
import type { Article, StandingRow } from "@/lib/types";
import MatchHero from "@/components/match/MatchHero";
import MatchTabs, { type MatchTab } from "@/components/match/MatchTabs";
import MatchTimeline from "@/components/match/MatchTimeline";
import MatchStats from "@/components/match/MatchStats";
import MatchLineups from "@/components/match/MatchLineups";
import KickoffCountdown from "@/components/match/KickoffCountdown";
import StandingsTable from "@/components/StandingsTable";
import ArticleCard from "@/components/ArticleCard";
import AutoRefresh from "@/components/AutoRefresh";
import AdSlot from "@/components/AdSlot";

export const revalidate = 30;

function scoreLine(info: MatchInfo) {
  const f = info.fixture;
  return `${f.home} ${f.homeScore ?? 0}–${f.awayScore ?? 0} ${f.away}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const info = await getMatch(id).catch(() => undefined);
  if (info === undefined) return { title: "Match centre" };
  if (!info) return { title: "Match not found" };
  const f = info.fixture;
  const title =
    f.status === "live"
      ? `${scoreLine(info)} live: score, stats and line-ups`
      : f.status === "finished"
        ? `${scoreLine(info)}: result, goals, stats and line-ups`
        : `${f.home} vs ${f.away}: kick-off time, line-ups and team news`;
  const description = `${f.home} vs ${f.away}${info.competition ? ` in the ${info.competition}` : ""}: live score, goal scorers, cards, substitutions, possession, shots and full line-ups on Onibsport.`;
  return {
    title,
    description,
    alternates: { canonical: `/match/${id}` },
    openGraph: { title, description, type: "website", url: `/match/${id}`, images: [{ url: "/covers/default-cover.jpg", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: ["/covers/default-cover.jpg"] },
  };
}

function minutesUntil(iso: string) {
  return (new Date(iso).getTime() - Date.now()) / 60_000;
}

/** Latest stories that mention either team. */
async function relatedNews(info: MatchInfo): Promise<Article[]> {
  const names = [...new Set([info.fixture.home, info.fixture.away, info.homeName, info.awayName])];
  const results = await Promise.all(names.map((n) => searchArticles(n, 4)));
  const seen = new Set<string>();
  return results
    .flat()
    .filter((a) => (seen.has(a.slug) ? false : (seen.add(a.slug), true)))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 3);
}

function FormStrip({ rows, home, away }: { rows: StandingRow[]; home: string; away: string }) {
  const pick = (team: string) => rows.find((r) => r.team === team);
  const teams = [pick(home), pick(away)].filter((r): r is StandingRow => !!r?.form);
  if (!teams.length) return null;
  const style: Record<string, string> = { W: "bg-[#1f9d5c] text-white", D: "bg-line text-ink", L: "bg-[#d23b3b] text-white" };
  return (
    <div className="mt-10 border-t border-line pt-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Recent form</h3>
      <ul className="mt-3 space-y-2.5">
        {teams.map((r) => {
          const results = r.form!.split(",").filter(Boolean).slice(-5);
          return (
            <li key={r.team} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">{r.team}</span>
              <span className="flex gap-1" aria-label={`Last ${results.length}: ${results.join(" ")}`}>
                {results.map((x, i) => (
                  <span key={i} aria-hidden="true" className={`grid h-6 w-6 place-items-center rounded text-[11px] font-bold ${style[x] ?? "bg-line"}`}>
                    {x}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let info: MatchInfo | null;
  try {
    info = await getMatch(id);
  } catch (error) {
    if (!(error instanceof MatchUnavailableError)) throw error;
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <AutoRefresh seconds={20} />
        <h1 className="font-display text-4xl font-black text-ink">Loading the match centre…</h1>
        <p className="mt-3 text-muted">The scores feed is busy for a moment. This page refreshes by itself in a few seconds.</p>
        <Link href="/live-scores" className="mt-8 inline-block rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo">
          All scores and fixtures
        </Link>
      </div>
    );
  }
  if (!info) notFound();

  const f = info.fixture;
  const ref = {
    league: f.league,
    kickoff: f.kickoff,
    homeNames: [f.home, info.homeName],
    awayNames: [f.away, info.awayName],
  };
  const [details, standings, news] = await Promise.all([
    getMatchDetails(ref, f.status),
    leagueThemes[f.league]?.hasTable ? getStandingsForLeague(f.league) : Promise.resolve(undefined),
    relatedNews(info),
  ]);

  const events = details?.events ?? [];
  const halftime = details?.halftime ?? info.halftime;
  const halftimeScore = halftime ? `${halftime.home}–${halftime.away}` : null;
  const refreshLive = f.status === "live" || (f.status === "upcoming" && minutesUntil(f.kickoff) < 10);

  let summary;
  if (f.status === "upcoming") {
    summary = (
      <div>
        <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-wider text-muted">Kick-off in</h2>
        <KickoffCountdown kickoff={f.kickoff} />
        <p className="mt-6 text-center text-sm text-muted">
          {details?.lineups.home || details?.lineups.away
            ? "Line-ups are in. See the Line-ups tab."
            : "Line-ups are usually confirmed about an hour before kick-off. Goals, cards and stats appear here once the match starts."}
        </p>
      </div>
    );
  } else if (events.length > 0) {
    summary = <MatchTimeline events={events} finished={f.status === "finished"} halftimeScore={halftimeScore} />;
  } else {
    summary = (
      <p className="py-6 text-center text-sm text-muted">
        {details
          ? f.status === "live"
            ? "No goals or cards yet. Events appear here as they happen."
            : "No goals, cards or substitutions were recorded for this match."
          : "Goal scorers, cards and team stats for this match aren't available right now. Check back shortly."}
      </p>
    );
  }

  const tabs: MatchTab[] = [
    {
      id: "summary",
      label: "Summary",
      content: (
        <>
          {summary}
          {standings && <FormStrip rows={standings} home={f.home} away={f.away} />}
        </>
      ),
    },
  ];
  if (details?.stats.length) {
    tabs.push({ id: "stats", label: "Stats", content: <MatchStats stats={details.stats} home={f.home} away={f.away} /> });
  }
  if (details?.lineups.home || details?.lineups.away) {
    tabs.push({
      id: "lineups",
      label: "Line-ups",
      content: <MatchLineups home={details.lineups.home} away={details.lineups.away} homeName={f.home} awayName={f.away} events={events} />,
    });
  }
  if (standings?.length) {
    tabs.push({
      id: "table",
      label: "Table",
      content: (
        <div className="-m-5 sm:-m-8">
          <StandingsTable rows={standings} accent={leagueThemes[f.league]?.deep} highlight={[f.home, f.away]} />
        </div>
      ),
    });
  }

  return (
    <>
      {refreshLive && <AutoRefresh seconds={60} />}
      <MatchHero info={info} details={details} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <MatchTabs tabs={tabs} />

        {news.length > 0 && (
          <section aria-labelledby="match-news" className="mt-14">
            <div className="mb-5 flex items-end justify-between gap-3">
              <h2 id="match-news" className="font-display text-3xl font-black text-ink">
                Latest on {f.home} and {f.away}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {news.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 flex justify-center">
          <Link href={`/live-scores?league=${f.league}&date=${f.kickoff.slice(0, 10)}`} className="rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo">
            More scores from this day
          </Link>
        </div>
        <AdSlot variant="leaderboard" className="mt-12" />
      </div>
    </>
  );
}
