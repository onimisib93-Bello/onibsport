import type { MatchStat } from "@/lib/live/highlightly";
import { cn } from "@/lib/utils";

/** Team colours for the comparison bars (checked for colour-blind separation; every bar also shows its number). */
export const HOME_COLOUR = "#5b43c4";
export const AWAY_COLOUR = "#e07b00";

function format(value: number, stat: MatchStat) {
  if (stat.percent) return `${Math.round(value)}%`;
  if (stat.decimal) return value.toFixed(2);
  return String(value);
}

function Possession({ stat }: { stat: MatchStat }) {
  const total = stat.home + stat.away || 1;
  const home = (stat.home / total) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-3xl font-black tabular-nums text-ink">{format(stat.home, stat)}</span>
        <span className="text-sm font-semibold text-muted">{stat.label}</span>
        <span className="font-display text-3xl font-black tabular-nums text-ink">{format(stat.away, stat)}</span>
      </div>
      <div className="mt-2 flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        <span className="rounded-l-full" style={{ width: `${home}%`, background: HOME_COLOUR }} />
        <span className="flex-1 rounded-r-full" style={{ background: AWAY_COLOUR }} />
      </div>
    </div>
  );
}

function Row({ stat }: { stat: MatchStat }) {
  const max = Math.max(stat.home, stat.away, stat.percent ? 100 : 0) || 1;
  const homeLeads = stat.home > stat.away;
  const awayLeads = stat.away > stat.home;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className={cn("tabular-nums", homeLeads ? "font-bold text-ink" : "text-ink/75")}>{format(stat.home, stat)}</span>
        <span className="text-[13px] font-medium text-muted">{stat.label}</span>
        <span className={cn("tabular-nums", awayLeads ? "font-bold text-ink" : "text-ink/75")}>{format(stat.away, stat)}</span>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1" aria-hidden="true">
        <div className="flex h-2 justify-end rounded-l-full bg-line/70">
          <span className="rounded-l-full" style={{ width: `${(stat.home / max) * 100}%`, background: HOME_COLOUR, opacity: homeLeads || stat.home === stat.away ? 1 : 0.55 }} />
        </div>
        <div className="flex h-2 rounded-r-full bg-line/70">
          <span className="rounded-r-full" style={{ width: `${(stat.away / max) * 100}%`, background: AWAY_COLOUR, opacity: awayLeads || stat.home === stat.away ? 1 : 0.55 }} />
        </div>
      </div>
    </div>
  );
}

/** Head-to-head team stats: possession first, then one mirrored bar per stat. */
export default function MatchStats({ stats, home, away }: { stats: MatchStat[]; home: string; away: string }) {
  const possession = stats.find((s) => s.label === "Possession");
  const rest = stats.filter((s) => s !== possession);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between text-sm font-bold text-ink">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: HOME_COLOUR }} aria-hidden="true" />
          {home}
        </span>
        <span className="flex items-center gap-2">
          {away}
          <span className="h-3 w-3 rounded-sm" style={{ background: AWAY_COLOUR }} aria-hidden="true" />
        </span>
      </div>
      {possession && <Possession stat={possession} />}
      <div className={cn("space-y-5", possession && "mt-8")}>
        {rest.map((s) => (
          <Row key={s.label} stat={s} />
        ))}
      </div>
      <table className="sr-only">
        <caption>Match statistics</caption>
        <thead>
          <tr>
            <th scope="col">Stat</th>
            <th scope="col">{home}</th>
            <th scope="col">{away}</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.label}>
              <th scope="row">{s.label}</th>
              <td>{format(s.home, s)}</td>
              <td>{format(s.away, s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
