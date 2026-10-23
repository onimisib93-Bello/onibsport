import type { Metadata } from "next";
import { categories } from "@/lib/data/categories";
import { SCORE_LEAGUES, getFixturesForRange, parseDateParam, todayIso } from "@/lib/live/footballData";
import { shiftDate as shift } from "@/lib/time";
import LiveScoresView, { type ScoresView } from "@/components/LiveScoresView";
import AdSlot from "@/components/AdSlot";
import AutoRefresh from "@/components/AutoRefresh";

const description =
  "Live football scores, results and fixtures for any date across the Premier League, La Liga, Serie A, Bundesliga, Champions League and the NPFL.";

export const metadata: Metadata = {
  title: "Live scores, results and fixtures",
  description,
  keywords: ["live football scores", "football results", "football fixtures", "NPFL fixtures", "Premier League scores", "results by date"],
  alternates: { canonical: "/live-scores" },
  openGraph: {
    title: "Live Scores — Onibsport",
    description,
    type: "website",
    url: "/live-scores",
    images: [{ url: "/covers/default-cover.jpg", width: 1200, height: 630, alt: "Onibsport Live Scores" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Scores — Onibsport",
    description,
    images: ["/covers/default-cover.jpg"],
  },
};

export default async function LiveScoresPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const today = todayIso();
  // Without ?date= the browser picks the visitor's own today; the server only knows UTC.
  const pickedDate = parseDateParam(one(params.date));
  const date = pickedDate ?? today;
  const rawView = one(params.view);
  const view: ScoresView = rawView === "results" || rawView === "fixtures" ? rawView : "date";
  const rawLeague = one(params.league);
  const league = rawLeague && categories.some((c) => c.slug === rawLeague) ? rawLeague : "all";

  let fixtures;
  if (view === "results") {
    fixtures = (await getFixturesForRange(shift(today, -7), today))
      .filter((f) => f.status === "finished")
      .sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff));
  } else if (view === "fixtures") {
    fixtures = (await getFixturesForRange(today, shift(today, 7)))
      .filter((f) => f.status === "upcoming")
      .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
  } else {
    // A local day overlaps three UTC days; LiveScoresView keeps the visitor's own.
    fixtures = await getFixturesForRange(shift(date, -1), shift(date, 1));
  }

  const scoreCategories = categories.filter((c) => SCORE_LEAGUES.includes(c.slug));

  return (
    <>
      <section className="relative overflow-hidden bg-night px-4 pb-12 pt-12 text-white sm:px-6">
        <div className="pitch-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl">
          <h1 className="font-display text-6xl font-black leading-[0.85] sm:text-8xl">Scores &amp; fixtures</h1>
          <p className="mt-4 max-w-xl text-lg text-white/70">
            Live scores, full-time results and upcoming kick-offs. Pick any date to see who played and who&apos;s up next. Times are in your own time zone.
          </p>
        </div>
      </section>
      {/* Keep today's scores and the results/fixtures views current while the page is open. */}
      {(view !== "date" || (date >= shift(today, -1) && date <= shift(today, 1))) && <AutoRefresh />}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <LiveScoresView fixtures={fixtures} categories={scoreCategories} pickedDate={pickedDate} today={today} league={league} view={view} />
        <AdSlot placement="scores" className="mt-12" />
      </div>
    </>
  );
}
