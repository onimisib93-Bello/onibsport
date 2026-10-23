import { StandingRow } from "@/lib/types";
import Crest from "@/components/ui/Crest";
import { cn } from "@/lib/utils";
import { resolveZones, zonesFor, type TableZone } from "@/lib/tableZones";

type Ranked = StandingRow & { points: number; goalDiff: number; position: number };

function rank(rows: StandingRow[]): Ranked[] {
  return rows
    .map((r) => ({ ...r, points: r.won * 3 + r.drawn, goalDiff: r.goalsFor - r.goalsAgainst }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor)
    .map((r, i) => ({ ...r, position: i + 1 }));
}

const gd = (n: number) => (n > 0 ? `+${n}` : String(n));

const FORM_STYLE: Record<string, string> = {
  W: "bg-[#1f9d5c] text-white",
  D: "bg-line text-ink",
  L: "bg-[#d23b3b] text-white",
};

function Form({ form }: { form?: string }) {
  if (!form) return null;
  const results = form.split(",").filter(Boolean).slice(-5);
  return (
    <span className="flex gap-1" aria-label={`Last ${results.length}: ${results.join(" ")}`}>
      {results.map((r, i) => (
        <span key={i} aria-hidden="true" className={cn("grid h-5 w-5 place-items-center rounded text-[10px] font-bold", FORM_STYLE[r] ?? "bg-line")}>
          {r}
        </span>
      ))}
    </span>
  );
}

/**
 * Full league table with that league's qualification and relegation bands
 * (`league` picks them; see tableZones.ts). `highlight` marks teams, e.g.
 * the two in a match.
 */
export default function StandingsTable({
  rows,
  accent = "#2d1b69",
  highlight = [],
  league,
  zones,
}: {
  rows: StandingRow[];
  accent?: string;
  highlight?: string[];
  league?: string;
  zones?: TableZone[];
}) {
  const sorted = rank(rows);
  const showForm = sorted.some((r) => r.form);
  const bands = resolveZones(zones ?? zonesFor(league), sorted.length, accent);
  const bandFor = (position: number) => bands.find((z) => position >= z.from && position <= z.to);

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="sr-only">League table, ranked by points then goal difference</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold text-muted">
              <th scope="col" className="sticky left-0 z-10 bg-white py-3 pl-4 pr-2">
                <abbr title="Position" className="no-underline">
                  Pos
                </abbr>
              </th>
              <th scope="col" className="sticky left-12 z-10 bg-white px-2 py-3">
                Club
              </th>
              {[
                ["P", "Played"],
                ["W", "Won"],
                ["D", "Drawn"],
                ["L", "Lost"],
                ["GF", "Goals for"],
                ["GA", "Goals against"],
                ["GD", "Goal difference"],
              ].map(([abbr, title]) => (
                <th key={abbr} scope="col" className="px-2 py-3 text-center tabular-nums">
                  <abbr title={title} className="no-underline">
                    {abbr}
                  </abbr>
                </th>
              ))}
              <th scope="col" className="px-3 py-3 text-center">
                <abbr title="Points" className="no-underline">
                  Pts
                </abbr>
              </th>
              {showForm && (
                <th scope="col" className="hidden px-3 py-3 sm:table-cell">
                  Form
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const z = bandFor(r.position);
              const hl = highlight.includes(r.team);
              const cellBg = hl ? "bg-[#efecfb]" : "bg-white";
              return (
                <tr key={r.team} className={cn("group border-b border-line transition-colors last:border-0 hover:bg-paper", hl && "bg-[#efecfb]")}>
                  <td className={cn("sticky left-0 z-10 py-2.5 pl-4 pr-2 group-hover:bg-paper", cellBg)}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-6 w-1 rounded-full"
                        style={{ background: z?.color ?? "transparent" }}
                        title={z?.label}
                      />
                      <span className="w-5 font-display text-lg font-bold tabular-nums text-ink">{r.position}</span>
                    </span>
                  </td>
                  <th scope="row" className={cn("sticky left-12 z-10 px-2 py-2.5 text-left text-ink group-hover:bg-paper", cellBg, hl ? "font-black" : "font-semibold")}>
                    <span className="flex items-center gap-2.5">
                      <Crest name={r.team} src={r.crest} size={22} />
                      <span className="max-w-[150px] truncate">{r.team}</span>
                    </span>
                  </th>
                  {[r.played, r.won, r.drawn, r.lost, r.goalsFor, r.goalsAgainst].map((v, i) => (
                    <td key={i} className="px-2 py-2.5 text-center tabular-nums text-ink/75">
                      {v}
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-center tabular-nums text-ink/75">{gd(r.goalDiff)}</td>
                  <td className="px-3 py-2.5 text-center font-display text-lg font-black tabular-nums text-ink">{r.points}</td>
                  {showForm && (
                    <td className="hidden px-3 py-2.5 sm:table-cell">
                      <Form form={r.form} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line px-4 py-2.5 text-xs text-muted">
        {bands.map((z) => (
          <span key={z.label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-1 rounded-full" style={{ background: z.color }} />
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Compact top-of-the-table view for sidebars and the league desk. */
export function MiniTable({ rows, limit = 6, accent = "#2d1b69" }: { rows: StandingRow[]; limit?: number; accent?: string }) {
  const sorted = rank(rows).slice(0, limit);
  return (
    <table className="mt-3 w-full text-sm">
      <caption className="sr-only">Top {limit} of the league table</caption>
      <thead>
        <tr className="text-left text-xs text-muted">
          <th scope="col" className="w-7 pb-2 font-semibold">
            #
          </th>
          <th scope="col" className="pb-2 font-semibold">
            Club
          </th>
          <th scope="col" className="w-8 pb-2 text-center font-semibold">
            P
          </th>
          <th scope="col" className="w-10 pb-2 text-center font-semibold">
            GD
          </th>
          <th scope="col" className="w-9 pb-2 text-right font-semibold">
            Pts
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => (
          <tr key={r.team} className="border-t border-line">
            <td className="py-2 font-display text-base font-bold tabular-nums" style={{ color: r.position <= 4 ? accent : undefined }}>
              {r.position}
            </td>
            <th scope="row" className="py-2 text-left font-semibold text-ink">
              <span className="flex min-w-0 items-center gap-2">
                <Crest name={r.team} src={r.crest} size={18} />
                <span className="truncate">{r.team}</span>
              </span>
            </th>
            <td className="py-2 text-center tabular-nums text-ink/70">{r.played}</td>
            <td className="py-2 text-center tabular-nums text-ink/70">{gd(r.goalDiff)}</td>
            <td className="py-2 text-right font-display text-base font-black tabular-nums text-ink">{r.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
