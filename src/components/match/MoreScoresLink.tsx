"use client";

import Link from "next/link";
import { dateKey } from "@/lib/time";
import { useViewer } from "@/lib/useViewer";

/** Link to /live-scores on the day this match falls on for the visitor. */
export default function MoreScoresLink({ league, kickoff }: { league: string; kickoff: string }) {
  const viewer = useViewer();
  return (
    <Link
      href={`/live-scores?league=${league}&date=${dateKey(kickoff, viewer.timeZone)}`}
      className="rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo"
    >
      More scores from this day
    </Link>
  );
}
