import { ArrowDown, ArrowUp, SoccerBall } from "@phosphor-icons/react/dist/ssr";
import type { Lineup, LineupPlayer, MatchEvent, Side } from "@/lib/live/highlightly";
import { HOME_COLOUR, AWAY_COLOUR } from "@/components/match/MatchStats";
import { cn } from "@/lib/utils";

type Marks = Map<string, { goals: number; yellow: boolean; red: boolean; off?: number; on?: number }>;

/** A player's key: their feed id when there is one (names differ between events and line-ups), else the name. */
const keyOf = (name: string, id?: number | null) => (id != null ? `#${id}` : name);
const playerKey = (p: LineupPlayer) => keyOf(p.name, p.id);

/** Goals, cards and substitution minutes per player, for one side. */
function marksFor(events: MatchEvent[], side: Side): Marks {
  const marks: Marks = new Map();
  const get = (key: string) => {
    const m = marks.get(key) ?? { goals: 0, yellow: false, red: false };
    marks.set(key, m);
    return m;
  };
  for (const e of events) {
    if (e.side !== side) continue;
    const who = keyOf(e.player, e.playerId);
    if (e.kind === "goal" || e.kind === "penalty") get(who).goals++;
    if (e.kind === "yellow") get(who).yellow = true;
    if (e.kind === "red" || e.kind === "second-yellow") get(who).red = true;
    if (e.kind === "sub" && e.subKnown) {
      get(who).on = e.minute;
      if (e.secondary) get(keyOf(e.secondary, e.secondaryId)).off = e.minute;
    }
  }
  return marks;
}

function lastName(name: string) {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
}

function hasGrid(lineup: Lineup) {
  return lineup.startXI.every((p) => p.grid && /^\d+:\d+$/.test(p.grid));
}

/** Both XIs on one pitch in their formations: home attacking right, away attacking left. */
function Pitch({ home, away, homeMarks, awayMarks }: { home: Lineup; away: Lineup; homeMarks: Marks; awayMarks: Marks }) {
  const place = (lineup: Lineup, side: Side) => {
    const rows = new Map<number, number>();
    for (const p of lineup.startXI) {
      const [r, c] = p.grid!.split(":").map(Number);
      rows.set(r, Math.max(rows.get(r) ?? 0, c));
    }
    const maxRow = Math.max(...rows.keys());
    return lineup.startXI.map((p) => {
      const [r, c] = p.grid!.split(":").map(Number);
      const depth = (r - 0.5) / maxRow; // 0 = own goal, 1 = halfway line
      const x = side === "home" ? 4 + depth * 44 : 96 - depth * 44;
      const y = (c - 0.5) / (rows.get(r) ?? 1);
      // Column 1 is the team's left flank: top of the pitch for home (attacking right), bottom for away.
      return { p, x, y: side === "home" ? y * 100 : 100 - y * 100 };
    });
  };

  const dot = ({ p, x, y }: { p: LineupPlayer; x: number; y: number }, side: Side, marks: Marks) => {
    const m = marks.get(playerKey(p));
    return (
      <div key={`${side}-${p.name}`} className="absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${x}%`, top: `${y}%` }}>
        <span
          className="relative grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white shadow-md ring-2 ring-white/80"
          style={{ background: side === "home" ? HOME_COLOUR : AWAY_COLOUR }}
        >
          {p.number ?? ""}
          {m?.goals ? <SoccerBall size={13} weight="fill" className="absolute -right-1.5 -top-1.5 rounded-full bg-white text-ink" aria-hidden="true" /> : null}
          {m?.red ? <span className="absolute -left-1 -top-1 h-3 w-2 rounded-[1px] bg-[#e5383b]" aria-hidden="true" /> : m?.yellow ? <span className="absolute -left-1 -top-1 h-3 w-2 rounded-[1px] bg-[#f5c518]" aria-hidden="true" /> : null}
        </span>
        <span className="mt-1 max-w-full truncate rounded bg-black/35 px-1 text-[11px] font-semibold leading-4 text-white">{lastName(p.name)}</span>
      </div>
    );
  };

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#1d6b3a]" aria-hidden="true">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_6.25%,rgb(255_255_255/0.05)_6.25%,rgb(255_255_255/0.05)_12.5%)]" />
      <svg viewBox="0 0 160 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none" stroke="rgb(255 255 255 / 0.45)" strokeWidth="0.5">
        <rect x="2" y="2" width="156" height="96" />
        <line x1="80" y1="2" x2="80" y2="98" />
        <circle cx="80" cy="50" r="12" />
        <rect x="2" y="25" width="22" height="50" />
        <rect x="136" y="25" width="22" height="50" />
        <rect x="2" y="38" width="8" height="24" />
        <rect x="150" y="38" width="8" height="24" />
      </svg>
      {place(home, "home").map((d) => dot(d, "home", homeMarks))}
      {place(away, "away").map((d) => dot(d, "away", awayMarks))}
    </div>
  );
}

function PlayerRow({ p, marks }: { p: LineupPlayer; marks: Marks }) {
  const m = marks.get(playerKey(p));
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-6 text-right text-sm font-bold tabular-nums text-muted">{p.number ?? ""}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.name}</span>
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
        {m?.goals ? (
          <span className="flex items-center gap-0.5" title={`${m.goals} goal${m.goals > 1 ? "s" : ""}`}>
            <SoccerBall size={14} weight="fill" className="text-ink" aria-hidden="true" />
            {m.goals > 1 && <span className="font-bold text-ink">×{m.goals}</span>}
            <span className="sr-only">{m.goals} goal{m.goals > 1 ? "s" : ""}</span>
          </span>
        ) : null}
        {m?.yellow && !m.red && (
          <span className="h-3.5 w-2.5 rounded-[2px] bg-[#f5c518]" title="Booked">
            <span className="sr-only">Booked</span>
          </span>
        )}
        {m?.red && (
          <span className="h-3.5 w-2.5 rounded-[2px] bg-[#e5383b]" title="Sent off">
            <span className="sr-only">Sent off</span>
          </span>
        )}
        {m?.off != null && (
          <span className="flex items-center gap-0.5 tabular-nums">
            <ArrowDown size={12} weight="bold" className="text-[#c42b2e]" aria-hidden="true" />
            <span className="sr-only">Off at</span>
            {m.off}&apos;
          </span>
        )}
        {m?.on != null && (
          <span className="flex items-center gap-0.5 tabular-nums">
            <ArrowUp size={12} weight="bold" className="text-[#1a8f4c]" aria-hidden="true" />
            <span className="sr-only">On at</span>
            {m.on}&apos;
          </span>
        )}
        {p.pos && <span className="w-5 text-right font-semibold uppercase">{p.pos}</span>}
      </span>
    </li>
  );
}

function TeamList({ name, lineup, marks, colour }: { name: string; lineup: Lineup; marks: Marks; colour: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <h3 className="flex items-center gap-2 font-display text-xl font-black text-ink">
          <span className="h-3 w-3 rounded-sm" style={{ background: colour }} aria-hidden="true" />
          {name}
        </h3>
        {lineup.formation && <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-bold tabular-nums text-ink">{lineup.formation}</span>}
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">Starting XI</p>
      <ul className="divide-y divide-line">
        {lineup.startXI.map((p) => (
          <PlayerRow key={p.name} p={p} marks={marks} />
        ))}
      </ul>
      {lineup.subs.length > 0 && (
        <>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-muted">Substitutes</p>
          <ul className="divide-y divide-line">
            {lineup.subs.map((p) => (
              <PlayerRow key={p.name} p={p} marks={marks} />
            ))}
          </ul>
        </>
      )}
      {lineup.coach && (
        <p className="mt-5 text-sm text-muted">
          Manager: <span className="font-semibold text-ink">{lineup.coach}</span>
        </p>
      )}
    </div>
  );
}

export default function MatchLineups({
  home,
  away,
  homeName,
  awayName,
  events,
}: {
  home: Lineup | null;
  away: Lineup | null;
  homeName: string;
  awayName: string;
  events: MatchEvent[];
}) {
  const homeMarks = marksFor(events, "home");
  const awayMarks = marksFor(events, "away");
  return (
    <div className="space-y-8">
      {home && away && hasGrid(home) && hasGrid(away) && (
        <div className="hidden md:block">
          <Pitch home={home} away={away} homeMarks={homeMarks} awayMarks={awayMarks} />
        </div>
      )}
      <div className={cn("grid gap-8", home && away && "md:grid-cols-2")}>
        {home && <TeamList name={homeName} lineup={home} marks={homeMarks} colour={HOME_COLOUR} />}
        {away && <TeamList name={awayName} lineup={away} marks={awayMarks} colour={AWAY_COLOUR} />}
      </div>
    </div>
  );
}
