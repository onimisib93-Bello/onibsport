"use client";

import Link from "next/link";
import type { Scoreboard } from "@/lib/live/footballData";
import { useLiveScores } from "@/lib/live/useLiveScores";
import { formatKickoff } from "@/lib/time";
import Marquee from "@/components/ui/Marquee";
import LeagueCrest from "@/components/ui/LeagueCrest";
import LiveDot from "@/components/ui/LiveDot";
import LiveMinute from "@/components/ui/LiveMinute";

/** The LED perimeter board, kept current in the browser (see useLiveScores). */
export default function TickerBoard({ initial }: { initial: Scoreboard }) {
  const fixtures = useLiveScores(initial).ticker;
  if (fixtures.length === 0) return null;
  const liveCount = fixtures.filter((f) => f.status === "live").length;

  return (
    <div className="relative z-50 border-b border-white/10 bg-night text-white">
      <div className="mx-auto flex h-10 max-w-[1400px] items-stretch">
        <Link
          href="/live-scores"
          className="flex shrink-0 items-center gap-2 bg-orange px-3 font-display text-[15px] font-extrabold tracking-wide text-ink transition-colors hover:bg-gold sm:px-4"
        >
          {liveCount > 0 ? <LiveDot className="[&>span]:bg-ink" /> : null}
          {liveCount > 0 ? `${liveCount} live` : "Scores"}
        </Link>
        <Marquee label="Live scores ticker" seconds={Math.max(30, fixtures.length * 6)} controlClassName="text-white/60 hover:text-white border-l border-white/10">
          {fixtures.map((f) => (
            <Link
              key={f.id}
              href={`/match/${f.id}`}
              className="flex shrink-0 items-center gap-2.5 border-r border-white/10 px-5 text-[13px] font-semibold whitespace-nowrap transition-colors hover:bg-white/5"
            >
              <LeagueCrest slug={f.league} size={18} />
              <span>{f.home}</span>
              {f.status === "upcoming" ? (
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-display text-sm font-bold tabular-nums text-white/80">{formatKickoff(f.kickoff)}</span>
              ) : (
                <span className={`font-display text-lg font-black leading-none tabular-nums ${f.status === "live" ? "led-glow text-orange" : "text-white"}`}>
                  {f.homeScore}–{f.awayScore}
                </span>
              )}
              <span>{f.away}</span>
              <span className="text-[11px] font-medium text-white/50">
                {f.status === "live" ? <LiveMinute kickoff={f.kickoff} paused={f.paused} minute={f.minute} /> : f.status === "finished" ? "FT" : "WAT"}
              </span>
            </Link>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
