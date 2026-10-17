"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarBlank, X } from "@phosphor-icons/react/dist/ssr";
import { Fixture, StandingRow } from "@/lib/types";
import MatchCard from "@/components/MatchCard";
import StandingsTable from "@/components/StandingsTable";
import LiveDot from "@/components/ui/LiveDot";
import { formatDay } from "@/lib/time";
import { cn } from "@/lib/utils";

type Tab = "results" | "fixtures" | "table";

const PAGE = 8;

/** Matches grouped under a day heading, in the order given. */
export function DayGroups({ fixtures, showLeague = false }: { fixtures: Fixture[]; showLeague?: boolean }) {
  const groups: { day: string; items: Fixture[] }[] = [];
  for (const f of fixtures) {
    const day = formatDay(f.kickoff, { weekday: "long", day: "numeric", month: "long" });
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(f);
    else groups.push({ day, items: [f] });
  }
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.day}>
          <h4 className="mb-2 text-xs font-bold text-muted">{g.day}</h4>
          <div className="space-y-2">
            {g.items.map((f) => (
              <MatchCard key={f.id} fixture={f} showLeague={showLeague} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A league's match centre: live games pinned on top, then results, fixtures
 * and the table in tabs, plus a date search that loads any single day.
 */
export default function LeagueDataTabs({
  league,
  fixtures,
  standings,
  accent = "#2d1b69",
  initialTab,
}: {
  league: string;
  fixtures: Fixture[];
  standings?: StandingRow[];
  accent?: string;
  initialTab?: Tab;
}) {
  const reduce = useReducedMotion();
  const baseId = useId();
  const live = fixtures.filter((f) => f.status === "live");
  const results = fixtures.filter((f) => f.status === "finished").sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff));
  const upcoming = fixtures.filter((f) => f.status === "upcoming").sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));

  const [tab, setTab] = useState<Tab>(initialTab ?? (results.length > 0 ? "results" : "fixtures"));
  const [shown, setShown] = useState(PAGE);
  const [date, setDate] = useState("");
  const [dayFixtures, setDayFixtures] = useState<Fixture[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchDate(value: string) {
    setDate(value);
    setError(null);
    if (!value) {
      setDayFixtures(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/fixtures?date=${value}&league=${league}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load that date.");
      setDayFixtures(data.fixtures ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load that date.");
      setDayFixtures(null);
    } finally {
      setLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "results", label: "Results", show: true },
    { id: "fixtures", label: "Fixtures", show: true },
    { id: "table", label: "Table", show: !!standings && standings.length > 0 },
  ];
  const list = tab === "results" ? results : upcoming;

  return (
    <div>
      {live.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-deep">
            <LiveDot />
            Live now
          </p>
          <div className="space-y-2">
            {live.map((f) => (
              <MatchCard key={f.id} fixture={f} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Match centre" className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-line">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                id={`${baseId}-${t.id}`}
                aria-selected={tab === t.id && !dayFixtures}
                aria-controls={`${baseId}-panel`}
                onClick={() => {
                  setTab(t.id);
                  setShown(PAGE);
                  setDayFixtures(null);
                  setDate("");
                }}
                className={cn(
                  "relative cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  tab === t.id && !dayFixtures ? "text-white" : "text-ink/65 hover:text-ink"
                )}
              >
                {tab === t.id && !dayFixtures && (
                  <motion.span
                    layoutId={`${baseId}-pill`}
                    className="absolute inset-0 rounded-full"
                    style={{ background: accent }}
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
        </div>

        <label className="flex h-11 items-center gap-2 rounded-full bg-white px-3 text-sm ring-1 ring-line focus-within:ring-2 focus-within:ring-sky">
          <CalendarBlank size={18} weight="bold" className="shrink-0 text-muted" aria-hidden="true" />
          <span className="sr-only">Show matches on a date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => searchDate(e.target.value)}
            className="w-[8.5rem] bg-transparent font-semibold text-ink focus:outline-none"
          />
          {date && (
            <button type="button" onClick={() => searchDate("")} aria-label="Clear date" className="grid h-7 w-7 cursor-pointer place-items-center rounded-full hover:bg-paper">
              <X size={14} weight="bold" />
            </button>
          )}
        </label>
      </div>

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-${tab}`} className="mt-5" aria-busy={loading}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={dayFixtures ? `day-${date}` : tab}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.25 }}
          >
            {error && <p className="rounded-xl bg-white p-4 text-sm font-semibold text-[#b42318] ring-1 ring-line">{error} Try another date.</p>}

            {loading && (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-[74px] rounded-xl" />
                ))}
              </div>
            )}

            {!loading && dayFixtures && (
              <>
                <p className="mb-3 text-sm font-semibold text-ink">
                  {formatDay(`${date}T12:00:00Z`, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
                {dayFixtures.length > 0 ? (
                  <div className="space-y-2">
                    {dayFixtures.map((f) => (
                      <MatchCard key={f.id} fixture={f} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-white p-4 text-sm text-muted ring-1 ring-line">No matches in this competition on that day. Pick another date.</p>
                )}
              </>
            )}

            {!loading && !dayFixtures && tab !== "table" && (
              <>
                {list.length > 0 ? (
                  <DayGroups fixtures={list.slice(0, shown)} />
                ) : (
                  <p className="rounded-xl bg-white p-4 text-sm text-muted ring-1 ring-line">
                    {tab === "results" ? "No results in the last two weeks. Search a date to look further back." : "No fixtures scheduled in the next three weeks yet."}
                  </p>
                )}
                {list.length > shown && (
                  <button
                    type="button"
                    onClick={() => setShown((n) => n + PAGE)}
                    className="mt-4 w-full cursor-pointer rounded-full bg-white py-2.5 text-sm font-bold text-ink ring-1 ring-line hover:ring-ink"
                  >
                    Show more {tab}
                  </button>
                )}
              </>
            )}

            {!loading && !dayFixtures && tab === "table" && standings && <StandingsTable rows={standings} accent={accent} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
