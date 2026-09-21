"use client";

import { useMemo, useState } from "react";
import { Fixture } from "@/lib/types";
import { Category } from "@/lib/types";
import MatchCard from "@/components/MatchCard";

export default function LiveScoresView({ fixtures, categories }: { fixtures: Fixture[]; categories: Category[] }) {
  const [league, setLeague] = useState<string>("all");

  const filtered = useMemo(
    () => (league === "all" ? fixtures : fixtures.filter((f) => f.league === league)),
    [fixtures, league]
  );

  const live = filtered.filter((f) => f.status === "live");
  const upcoming = filtered.filter((f) => f.status === "upcoming");
  const finished = filtered.filter((f) => f.status === "finished");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setLeague("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            league === "all" ? "bg-indigo text-white" : "bg-paper text-ink/70 hover:bg-line"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setLeague(c.slug)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              league === c.slug ? "bg-indigo text-white" : "bg-paper text-ink/70 hover:bg-line"
            }`}
          >
            {c.shortName}
          </button>
        ))}
      </div>

      {live.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-ink">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange" />
            </span>
            Live Now
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {live.map((f) => (
              <MatchCard key={f.id} fixture={f} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-2xl tracking-wide text-ink">Upcoming</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {upcoming.length > 0 ? (
            upcoming.map((f) => <MatchCard key={f.id} fixture={f} />)
          ) : (
            <p className="text-sm text-muted">No upcoming fixtures for this league.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl tracking-wide text-ink">Results</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {finished.length > 0 ? (
            finished.map((f) => <MatchCard key={f.id} fixture={f} />)
          ) : (
            <p className="text-sm text-muted">No finished fixtures for this league yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
