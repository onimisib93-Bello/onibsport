import Link from "next/link";
import { CalendarBlank, MapPin, SoccerBall } from "@phosphor-icons/react/dist/ssr";
import type { MatchInfo } from "@/lib/live/footballData";
import type { MatchDetails, MatchEvent, Side } from "@/lib/live/highlightly";
import { getCategory } from "@/lib/data/categories";
import { leagueThemes } from "@/lib/leagues";
import Crest from "@/components/ui/Crest";
import LeagueCrest from "@/components/ui/LeagueCrest";
import LiveDot from "@/components/ui/LiveDot";
import LiveMinute from "@/components/ui/LiveMinute";
import LocalTime, { ZoneLabel } from "@/components/ui/LocalTime";
import { minuteText } from "@/lib/live/minute";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  LEAGUE_STAGE: "League phase",
  PLAYOFFS: "Knockout play-offs",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  FINAL: "Final",
};

/** "Saka 23', 67' (pen)" style lines for one side's goals. */
function scorerLines(events: MatchEvent[], side: Side) {
  const byPlayer = new Map<string, string[]>();
  for (const e of events) {
    if (e.side !== side || !(e.kind === "goal" || e.kind === "penalty" || e.kind === "own-goal")) continue;
    const tag = e.kind === "penalty" ? " pen" : e.kind === "own-goal" ? " OG" : "";
    const list = byPlayer.get(e.player) ?? [];
    list.push(minuteText(e) + tag);
    byPlayer.set(e.player, list);
  }
  return [...byPlayer.entries()].map(([player, minutes]) => `${player} ${minutes.join(", ")}`);
}

function RedCards({ events, side }: { events: MatchEvent[]; side: Side }) {
  const reds = events.filter((e) => e.side === side && (e.kind === "red" || e.kind === "second-yellow"));
  if (!reds.length) return null;
  return (
    <span className="inline-flex gap-1" title={`${reds.length} sent off`}>
      {reds.map((_, i) => (
        <span key={i} aria-hidden="true" className="h-3.5 w-2.5 rounded-[2px] bg-[#e5383b]" />
      ))}
      <span className="sr-only">{reds.length} red card{reds.length > 1 ? "s" : ""}</span>
    </span>
  );
}

function TeamBlock({ name, crest, side, events, align }: { name: string; crest?: string; side: Side; events: MatchEvent[]; align: "left" | "right" }) {
  const scorers = scorerLines(events, side);
  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-3 text-center sm:gap-4", align === "left" ? "sm:items-end sm:text-right" : "sm:items-start sm:text-left")}>
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/95 p-2 shadow-lg sm:h-24 sm:w-24 sm:p-3">
        <Crest name={name} src={crest} size={48} className="sm:hidden" />
        <Crest name={name} src={crest} size={72} className="hidden sm:grid" />
      </div>
      <div className={cn("flex items-center gap-2", align === "left" ? "sm:flex-row-reverse" : "")}>
        <h2 className="font-display text-xl font-black leading-none sm:text-4xl">{name}</h2>
        <RedCards events={events} side={side} />
      </div>
      {scorers.length > 0 && (
        <ul className="space-y-1 text-xs text-white/75 sm:text-sm">
          {scorers.map((line) => (
            <li key={line} className={cn("flex items-center justify-center gap-1.5", align === "left" ? "sm:flex-row-reverse" : "")}>
              <SoccerBall size={13} weight="fill" className="shrink-0 text-white/60" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MatchHero({ info, details }: { info: MatchInfo; details: MatchDetails | null }) {
  const f = info.fixture;
  const league = getCategory(f.league);
  const theme = leagueThemes[f.league];
  const events = details?.events ?? [];
  const live = f.status === "live";
  const halftime = details?.halftime ?? info.halftime;
  const venue = details?.venue ?? info.venue;
  const referee = details?.referee ?? info.referee;
  const round = info.stage && STAGE_LABELS[info.stage] ? STAGE_LABELS[info.stage] : f.matchday ? `Matchday ${f.matchday}` : null;
  // A live clock from the details feed is the real one; otherwise it is worked out from kick-off.
  const realMinute = live && details && details.elapsed != null && details.status !== "HT" ? details.elapsed : null;

  return (
    <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(160deg, ${theme?.deep ?? "#120a33"} 0%, #120a33 70%)` }}>
      <div className="pitch-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-white/60">
          <Link href="/live-scores" className="hover:text-white">
            Scores
          </Link>
          <span aria-hidden="true">/</span>
          {league && (
            <Link href={`/category/${league.slug}`} className="hover:text-white">
              {league.name}
            </Link>
          )}
        </nav>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold text-white/80">
          <LeagueCrest slug={f.league} size={22} />
          <span>{info.competition ?? league?.name}</span>
          {round && <span className="text-white/50">· {round}</span>}
        </div>

        <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-8">
          <TeamBlock name={f.home} crest={f.homeCrest} side="home" events={events} align="left" />

          <div className="flex flex-col items-center pt-3 sm:pt-6">
            {f.status === "upcoming" ? (
              <>
                <LocalTime iso={f.kickoff} className="whitespace-nowrap font-display text-5xl font-black tabular-nums sm:text-7xl" />
                <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/60">
                  <ZoneLabel iso={f.kickoff} /> kick-off
                </span>
              </>
            ) : (
              <>
                <span className={cn("font-display text-6xl font-black leading-none tabular-nums sm:text-8xl", live && "led-glow text-orange")}>
                  {f.homeScore ?? 0}
                  <span className="mx-1 text-white/40 sm:mx-2">–</span>
                  {f.awayScore ?? 0}
                </span>
                <span
                  className={cn(
                    "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold",
                    live ? "bg-orange text-ink" : "bg-white/10 text-white/85"
                  )}
                >
                  {live ? (
                    <>
                      <LiveDot className="[&>span]:bg-ink" />
                      <LiveMinute kickoff={f.kickoff} paused={f.paused || details?.status === "HT"} minute={realMinute} extra={details?.extra} minuteAt={details?.fetchedAt} className="tabular-nums" />
                    </>
                  ) : (
                    "Full time"
                  )}
                </span>
                {halftime && (f.status === "finished" || live) && (
                  <span className="mt-2 text-xs font-semibold text-white/55">
                    Half-time {halftime.home}–{halftime.away}
                  </span>
                )}
              </>
            )}
          </div>

          <TeamBlock name={f.away} crest={f.awayCrest} side="away" events={events} align="right" />
        </div>

        <dl className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/65 sm:text-sm">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Date</dt>
            <CalendarBlank size={16} aria-hidden="true" />
            <dd>
              <LocalTime iso={f.kickoff} day={{ weekday: "long", day: "numeric", month: "long", year: "numeric" }} zone />
            </dd>
          </div>
          {venue && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Venue</dt>
              <MapPin size={16} aria-hidden="true" />
              <dd>{venue}</dd>
            </div>
          )}
          {referee && (
            <div className="flex items-center gap-1.5">
              <dt className="text-white/45">Referee</dt>
              <dd>{referee}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
