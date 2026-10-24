import Link from "next/link";
import { Fixture } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";
import Crest from "@/components/ui/Crest";
import LeagueCrest from "@/components/ui/LeagueCrest";
import LiveDot from "@/components/ui/LiveDot";
import LiveMinute from "@/components/ui/LiveMinute";
import LocalTime, { ZoneLabel } from "@/components/ui/LocalTime";
import { cn } from "@/lib/utils";

function StatusLabel({ fixture, showDate }: { fixture: Fixture; showDate?: boolean }) {
  if (fixture.status === "live") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-orange-deep">
        <LiveDot />
        <LiveMinute kickoff={fixture.kickoff} paused={fixture.paused} minute={fixture.minute} className="tabular-nums" />
      </span>
    );
  }
  if (fixture.status === "finished") {
    return <span className="text-xs font-semibold text-muted">{showDate ? <LocalTime iso={fixture.kickoff} day={{ day: "numeric", month: "short" }} time={false} /> : "FT"}</span>;
  }
  if (fixture.pending) {
    return (
      <span className="flex flex-col text-xs font-semibold leading-tight text-muted" title="Kicked off; waiting for the scores feed to update">
        <span>Score</span>
        <span>pending</span>
      </span>
    );
  }
  return (
    <span className="flex flex-col text-xs font-semibold leading-tight text-muted">
      {showDate && <LocalTime iso={fixture.kickoff} day={{ weekday: "short", day: "numeric" }} time={false} />}
      <LocalTime iso={fixture.kickoff} className="tabular-nums whitespace-nowrap text-ink" />
      <ZoneLabel iso={fixture.kickoff} className="text-[10px] font-medium" />
    </span>
  );
}

function TeamLine({ name, crest, score, winner, dim }: { name: string; crest?: string; score: number | null; winner: boolean; dim: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn("flex min-w-0 items-center gap-2.5 text-[15px]", winner ? "font-bold text-ink" : "font-medium text-ink/85", dim && "text-ink/55")}>
        <Crest name={name} src={crest} size={22} />
        <span className="truncate">{name}</span>
      </span>
      <span className={cn("font-display text-2xl leading-none tabular-nums", winner ? "font-black text-ink" : "font-bold text-ink/70")}>
        {score ?? ""}
      </span>
    </div>
  );
}

/**
 * Scoreboard row for one match. `showDate` adds the day for lists that span
 * several dates; `showLeague` adds the competition for mixed lists.
 */
export default function MatchCard({ fixture, showDate, showLeague }: { fixture: Fixture; showDate?: boolean; showLeague?: boolean }) {
  const finished = fixture.status === "finished";
  const hs = fixture.homeScore ?? -1;
  const as = fixture.awayScore ?? -1;
  const league = showLeague ? getCategory(fixture.league) : undefined;

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 rounded-xl border bg-white px-4 py-3 transition-colors hover:border-ink/25",
        fixture.status === "live" ? "border-orange/50 shadow-[0_0_0_3px_rgb(247_148_29/0.12)]" : "border-line"
      )}
    >
      <Link href={`/match/${fixture.id}`} className="absolute inset-0 rounded-xl" aria-label={`${fixture.home} v ${fixture.away}: match details`} />
      <div className="w-14 shrink-0">
        <StatusLabel fixture={fixture} showDate={showDate} />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <TeamLine name={fixture.home} crest={fixture.homeCrest} score={fixture.homeScore} winner={finished && hs > as} dim={finished && hs < as} />
        <TeamLine name={fixture.away} crest={fixture.awayCrest} score={fixture.awayScore} winner={finished && as > hs} dim={finished && as < hs} />
      </div>
      {league && (
        <Link href={`/category/${league.slug}`} aria-label={league.name} className="relative shrink-0 rounded-md">
          <LeagueCrest slug={league.slug} size={26} />
        </Link>
      )}
    </div>
  );
}
