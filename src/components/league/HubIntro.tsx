import { Category, Fixture, StandingRow } from "@/lib/types";
import { LeagueTheme } from "@/lib/leagues";
import { formatDay, formatKickoff } from "@/lib/time";
import LeagueCrest from "@/components/ui/LeagueCrest";

function leader(rows?: StandingRow[]) {
  if (!rows?.length) return null;
  return [...rows].sort(
    (a, b) => b.won * 3 + b.drawn - (a.won * 3 + a.drawn) || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst)
  )[0];
}

/** Hub title block: crest, name, brief and the three facts a fan wants first. */
export default function HubIntro({
  category,
  theme,
  storyCount,
  standings,
  next,
}: {
  category: Category;
  theme: LeagueTheme;
  storyCount: number;
  standings?: StandingRow[];
  next?: Fixture;
}) {
  const top = leader(standings);
  const facts = [
    { label: "Stories", value: String(storyCount) },
    top ? { label: "Top of the table", value: `${top.team}, ${top.won * 3 + top.drawn} pts` } : null,
    next ? { label: "Next up", value: `${next.home} v ${next.away}`, sub: `${formatDay(next.kickoff)}, ${formatKickoff(next.kickoff)} WAT` } : null,
  ].filter(Boolean) as { label: string; value: string; sub?: string }[];

  return (
    <div className="mx-auto w-full max-w-[1400px] text-white">
      <div className="flex flex-wrap items-center gap-5">
        <LeagueCrest slug={category.slug} size={88} className="shadow-[0_20px_40px_-15px_rgb(0_0_0/0.6)]" />
        <div>
          <p className="text-sm font-semibold" style={{ color: theme.tint }}>
            {theme.region}
          </p>
          <h1 className="font-display text-6xl font-black leading-[0.85] sm:text-8xl">{category.name}</h1>
        </div>
      </div>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{theme.blurb}</p>
      {facts.length > 0 && (
        <dl className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/12">
              <dt className="text-xs font-semibold text-white/55">{f.label}</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold leading-tight">{f.value}</dd>
              {f.sub && <dd className="text-xs text-white/60">{f.sub}</dd>}
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
