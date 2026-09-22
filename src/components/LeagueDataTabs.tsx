"use client";

import { useState } from "react";
import { Fixture, StandingRow } from "@/lib/types";
import MatchCard from "@/components/MatchCard";
import StandingsTable from "@/components/StandingsTable";

type Tab = "results" | "fixtures" | "table";

const RESULT_LIMIT = 6;
const FIXTURE_LIMIT = 6;

export default function LeagueDataTabs({ fixtures, standings }: { fixtures: Fixture[]; standings?: StandingRow[] }) {
  const live = fixtures.filter((f) => f.status === "live");
  const results = fixtures
    .filter((f) => f.status === "finished")
    .sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff))
    .slice(0, RESULT_LIMIT);
  const upcoming = fixtures
    .filter((f) => f.status === "upcoming")
    .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff))
    .slice(0, FIXTURE_LIMIT);

  const [tab, setTab] = useState<Tab>(live.length > 0 || results.length > 0 ? "results" : "fixtures");

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "results", label: "Results", show: true },
    { id: "fixtures", label: "Fixtures", show: true },
    { id: "table", label: "Table", show: !!standings },
  ];

  return (
    <div>
      {live.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-orange">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
            </span>
            LIVE NOW
          </p>
          <div className="space-y-3">
            {live.map((f) => (
              <MatchCard key={f.id} fixture={f} />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-line">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                tab === t.id ? "border-indigo text-indigo" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      <div className="mt-4">
        {tab === "results" &&
          (results.length > 0 ? (
            <div className="space-y-3">
              {results.map((f) => (
                <MatchCard key={f.id} fixture={f} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No recent results.</p>
          ))}

        {tab === "fixtures" &&
          (upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((f) => (
                <MatchCard key={f.id} fixture={f} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No upcoming fixtures scheduled yet.</p>
          ))}

        {tab === "table" && standings && <StandingsTable rows={standings} />}
      </div>
    </div>
  );
}
