import { Fixture } from "@/lib/types";

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function MatchCard({ fixture }: { fixture: Fixture }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
      <div className="w-14 shrink-0">
        {fixture.status === "live" && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-orange">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange" />
            </span>
            {fixture.minute}&apos;
          </span>
        )}
        {fixture.status === "finished" && <span className="text-xs font-semibold text-muted">FT</span>}
        {fixture.status === "upcoming" && (
          <span className="text-xs font-semibold text-muted">{formatKickoff(fixture.kickoff)}</span>
        )}
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-semibold text-ink">{fixture.home}</span>
          <span className="tabular-nums text-sm font-bold text-ink">{fixture.homeScore ?? "–"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-semibold text-ink">{fixture.away}</span>
          <span className="tabular-nums text-sm font-bold text-ink">{fixture.awayScore ?? "–"}</span>
        </div>
      </div>
    </div>
  );
}
