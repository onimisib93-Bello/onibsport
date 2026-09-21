import { StandingRow } from "@/lib/types";

function withPoints(rows: StandingRow[]) {
  return rows
    .map((r) => ({ ...r, points: r.won * 3 + r.drawn, goalDiff: r.goalsFor - r.goalsAgainst }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
}

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
  const sorted = withPoints(rows);

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-3 py-2.5">#</th>
            <th className="px-3 py-2.5">Team</th>
            <th className="px-2 py-2.5 text-center tabular-nums">P</th>
            <th className="px-2 py-2.5 text-center tabular-nums">W</th>
            <th className="px-2 py-2.5 text-center tabular-nums">D</th>
            <th className="px-2 py-2.5 text-center tabular-nums">L</th>
            <th className="px-2 py-2.5 text-center tabular-nums">GD</th>
            <th className="px-3 py-2.5 text-center tabular-nums">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={r.team} className={`border-b border-line last:border-0 ${i < 4 ? "bg-sky/[0.04]" : ""}`}>
              <td className="px-3 py-2.5 tabular-nums text-muted">{i + 1}</td>
              <td className="px-3 py-2.5 font-semibold text-ink">{r.team}</td>
              <td className="px-2 py-2.5 text-center tabular-nums text-ink/80">{r.played}</td>
              <td className="px-2 py-2.5 text-center tabular-nums text-ink/80">{r.won}</td>
              <td className="px-2 py-2.5 text-center tabular-nums text-ink/80">{r.drawn}</td>
              <td className="px-2 py-2.5 text-center tabular-nums text-ink/80">{r.lost}</td>
              <td className="px-2 py-2.5 text-center tabular-nums text-ink/80">{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
              <td className="px-3 py-2.5 text-center tabular-nums font-bold text-ink">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-3 py-2 text-[11px] text-muted">Highlighted rows indicate the top four positions.</p>
    </div>
  );
}
