import Link from "next/link";
import { getLiveFixtures } from "@/lib/data/fixtures";

export default function LiveTicker() {
  const live = getLiveFixtures();
  if (live.length === 0) return null;

  const items = [...live, ...live]; // duplicated for seamless marquee loop

  return (
    <div className="overflow-hidden border-b border-indigo-dark bg-indigo text-white">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <Link
          href="/live-scores"
          className="z-10 flex shrink-0 items-center gap-2 bg-orange px-3 py-2 text-xs font-bold tracking-wide text-white sm:px-4"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          LIVE
        </Link>
        <div className="group relative flex-1 overflow-hidden">
          <div className="flex w-max animate-[ticker_28s_linear_infinite] gap-8 py-2 pl-6 group-hover:[animation-play-state:paused]">
            {items.map((f, i) => (
              <Link
                key={`${f.id}-${i}`}
                href="/live-scores"
                className="tabular-nums flex shrink-0 items-center gap-2 text-sm font-semibold whitespace-nowrap hover:text-orange"
              >
                <span>{f.home}</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5">
                  {f.homeScore} – {f.awayScore}
                </span>
                <span>{f.away}</span>
                <span className="text-xs font-normal text-white/60">{f.minute}&apos;</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
