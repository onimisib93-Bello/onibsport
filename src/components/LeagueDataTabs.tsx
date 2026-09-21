"use client";

import { useState } from "react";
import { Fixture, StandingRow } from "@/lib/types";
import MatchCard from "@/components/MatchCard";
import StandingsTable from "@/components/StandingsTable";

export default function LeagueDataTabs({ fixtures, standings }: { fixtures: Fixture[]; standings?: StandingRow[] }) {
  const [tab, setTab] = useState<"fixtures" | "table">("fixtures");

  return (
    <div>
      <div className="flex gap-1 border-b border-line">
        <button
          onClick={() => setTab("fixtures")}
          className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
            tab === "fixtures" ? "border-indigo text-indigo" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Fixtures & Results
        </button>
        {standings && (
          <button
            onClick={() => setTab("table")}
            className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              tab === "table" ? "border-indigo text-indigo" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Table
          </button>
        )}
      </div>

      <div className="mt-4">
        {tab === "fixtures" ? (
          fixtures.length > 0 ? (
            <div className="space-y-3">
              {fixtures.map((f) => (
                <MatchCard key={f.id} fixture={f} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No fixtures scheduled right now.</p>
          )
        ) : standings ? (
          <StandingsTable rows={standings} />
        ) : null}
      </div>
    </div>
  );
}
