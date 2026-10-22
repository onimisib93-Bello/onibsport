"use client";

import { useEffect, useState } from "react";
import { liveMinuteLabel } from "@/lib/live/minute";

/**
 * The running clock of a live match ("67'", "HT", "45+'"), ticking in the
 * browser. Shows "Live" until it mounts so server and browser render the same.
 */
export default function LiveMinute({
  kickoff,
  paused,
  minute,
  extra,
  className,
}: {
  kickoff: string;
  paused?: boolean;
  minute?: number | null;
  extra?: number | null;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 20_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  return (
    <span className={className} suppressHydrationWarning>
      {now == null ? "Live" : liveMinuteLabel({ kickoff, paused, minute, extra, now })}
    </span>
  );
}
