"use client";

import Link from "next/link";
import { Fixture } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";
import { dateKey, formatDate, formatDay, formatKickoff, zoneLabel, type Viewer } from "@/lib/time";
import { useViewer } from "@/lib/useViewer";
import Crest from "@/components/ui/Crest";
import LeagueCrest from "@/components/ui/LeagueCrest";
import LiveDot from "@/components/ui/LiveDot";
import LiveMinute from "@/components/ui/LiveMinute";
import SwipeRow from "@/components/ui/SwipeRow";
import { cn } from "@/lib/utils";
import type { Scoreboard } from "@/lib/live/footballData";
import { useLiveScores } from "@/lib/live/useLiveScores";

function Tile({ f, today, viewer }: { f: Fixture; today: string; viewer: Viewer }) {
  const dayLabel = dateKey(f.kickoff, viewer.timeZone) !== today ? formatDay(f.kickoff, { weekday: "short" }, viewer) : null;
  const league = getCategory(f.league);
  const live = f.status === "live";
  const done = f.status === "finished";
  const row = (name: string, crest: string | undefined, score: number | null, other: number | null) => {
    const lost = done && score != null && other != null && score < other;
    return (
      <div className="flex items-center justify-between gap-2">
        <span className={cn("flex min-w-0 items-center gap-2 text-sm font-semibold", lost ? "text-white/55" : "text-white")}>
          <Crest name={name} src={crest} size={20} />
          <span className="truncate">{name}</span>
        </span>
        {f.status !== "upcoming" && (
          <span className={cn("font-display text-[26px] font-black leading-none tabular-nums", live ? "led-glow text-orange" : lost ? "text-white/55" : "text-white")}>{score}</span>
        )}
      </div>
    );
  };

  return (
    <Link
      href={`/match/${f.id}`}
      className={cn(
        "flex w-[248px] shrink-0 snap-start flex-col gap-3 rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5",
        live ? "bg-night-2 ring-1 ring-orange/50" : "bg-night-2/70 ring-1 ring-white/10 hover:ring-white/25"
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-white/70">
          <LeagueCrest slug={f.league} size={18} />
          <span className="truncate">{league?.shortName}</span>
        </span>
        {live ? (
          <span className="flex items-center gap-1.5 font-bold text-orange">
            <LiveDot />
            <LiveMinute kickoff={f.kickoff} paused={f.paused} minute={f.minute} className="tabular-nums" />
          </span>
        ) : done ? (
          <span className="font-semibold text-white/55">{dayLabel ? `FT, ${dayLabel}` : "Full time"}</span>
        ) : (
          <span className="font-display text-base font-bold tabular-nums text-white">
            {dayLabel && <span className="mr-1 font-body text-xs font-semibold text-white/60">{dayLabel}</span>}
            {formatKickoff(f.kickoff, viewer)}
            <span className="ml-1 font-body text-[11px] font-semibold text-white/60">{zoneLabel(f.kickoff, viewer)}</span>
          </span>
        )}
      </div>
      <div className="space-y-2">
        {row(f.home, f.homeCrest, f.homeScore, f.awayScore)}
        {row(f.away, f.awayCrest, f.awayScore, f.homeScore)}
      </div>
    </Link>
  );
}

/** Today's matches as a swipeable scoreboard strip, refreshed live in the browser. */
export default function ScoresStrip({ initial }: { initial: Scoreboard }) {
  const board = useLiveScores(initial);
  const viewer = useViewer();
  const fixtures = board.strip;
  const today = viewer.today ?? board.today;
  const quietDay = board.quietDay;
  if (fixtures.length === 0) return null;
  const live = fixtures.filter((f) => f.status === "live").length;

  return (
    <section aria-labelledby="scores-strip-title" className="relative overflow-hidden bg-night py-8 text-white">
      <div className="pitch-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="scores-strip-title" className="font-display text-4xl font-black leading-none">
              Match centre
            </h2>
            <p className="mt-1.5 text-sm text-white/60">
              {formatDate(today, { weekday: "long", day: "numeric", month: "long" }, viewer)}
              {live > 0 && <span className="ml-2 font-semibold text-orange">{live} live now</span>}
              {quietDay && <span className="ml-2">No matches today. Latest results and next kick-offs.</span>}
            </p>
          </div>
          <Link href="/live-scores" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-orange">
            All scores and fixtures
          </Link>
        </div>
        <SwipeRow label="Today's matches" tone="dark">
          {fixtures.map((f) => (
            <Tile key={f.id} f={f} today={today} viewer={viewer} />
          ))}
        </SwipeRow>
      </div>
    </section>
  );
}
