"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}

/** Time left until kick-off, ticking every second. Renders nothing until it mounts. */
export default function KickoffCountdown({ kickoff }: { kickoff: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  if (now == null) return <div className="h-[88px]" aria-hidden="true" />;
  const left = new Date(kickoff).getTime() - now;
  if (left <= 0) return <p className="text-center font-display text-2xl font-black text-ink">Kick-off! Refreshing for the live score…</p>;

  const p = parts(left);
  const units: [number, string][] = [
    [p.days, p.days === 1 ? "day" : "days"],
    [p.hours, "hrs"],
    [p.minutes, "min"],
    [p.seconds, "sec"],
  ];
  return (
    <div className="flex justify-center gap-3 sm:gap-5" role="timer" aria-label="Time to kick-off">
      {units
        .filter(([v, label], i) => i > 0 || v > 0 || label !== "days")
        .map(([value, label]) => (
          <div key={label} className="flex w-16 flex-col items-center rounded-2xl bg-paper py-3 sm:w-20">
            <span className="font-display text-3xl font-black tabular-nums text-ink sm:text-4xl">{String(value).padStart(2, "0")}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
          </div>
        ))}
    </div>
  );
}
