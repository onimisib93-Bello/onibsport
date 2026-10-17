import Link from "next/link";
import { Article, Fixture, StandingRow } from "@/lib/types";
import { leagueTheme } from "@/lib/leagues";
import ArticleCard from "@/components/ArticleCard";
import MatchCard from "@/components/MatchCard";
import { MiniTable } from "@/components/StandingsTable";

/** Home-front coverage: Super Eagles, Super Falcons and the NPFL in one band. */
export default function NigeriaRail({
  articles,
  npflTable,
  upcoming,
}: {
  articles: Article[];
  npflTable?: StandingRow[];
  upcoming: Fixture[];
}) {
  if (articles.length === 0) return null;
  const naija = leagueTheme("nigeria-football");
  const npfl = leagueTheme("npfl");
  const [lead, ...rest] = articles;

  return (
    <section aria-labelledby="nigeria-title" className="relative overflow-hidden py-16 text-white" style={{ background: naija.deep }}>
      <div className="pitch-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      {/* Flag bands: green-white-green, at the edge of the section */}
      <div className="absolute inset-y-0 left-0 flex w-2 flex-col sm:w-3" aria-hidden="true">
        <span className="flex-1 bg-[#008751]" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-[#008751]" />
      </div>
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="nigeria-title" className="font-display text-5xl font-black leading-[0.9] sm:text-6xl">
            Naija football
          </h2>
          <div className="flex gap-2">
            <Link href="/category/nigeria-football" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-[#2fd38a]">
              Super Eagles hub
            </Link>
            <Link href="/category/npfl" className="rounded-full px-4 py-2 text-sm font-bold ring-1 ring-white/30 hover:bg-white/10">
              NPFL hub
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr_340px]">
          <ArticleCard article={lead} size="overlay" />
          <ul className="flex flex-col gap-3">
            {rest.slice(0, 4).map((a) => (
              <li key={a.slug}>
                <ArticleCard
                  article={a}
                  size="compact"
                  className="rounded-2xl bg-white p-3 text-ink [&_h3]:text-ink"
                />
              </li>
            ))}
          </ul>
          <div className="space-y-4">
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-black">Coming up</h3>
                {upcoming.slice(0, 3).map((f) => (
                  <MatchCard key={f.id} fixture={f} showDate showLeague />
                ))}
              </div>
            )}
            {npflTable && npflTable.length > 0 && (
              <div className="rounded-2xl bg-white p-4 text-ink">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-black">NPFL table</h3>
                  <Link href="/category/npfl#table" className="text-sm font-bold text-indigo hover:text-sky-dark">
                    Full table
                  </Link>
                </div>
                <MiniTable rows={npflTable} limit={5} accent={npfl.deep} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
