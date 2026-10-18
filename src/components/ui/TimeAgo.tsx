"use client";

import { useSyncExternalStore } from "react";
import { formatDay, timeAgo } from "@/lib/time";

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
}

// The current minute: stable between calls, so React can compare snapshots.
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

/**
 * "3h ago" that can't cause a hydration mismatch. The server (and cached
 * pages) render a fixed date; once the page is live in the browser it
 * switches to relative time and keeps it current.
 */
export default function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const minute = useSyncExternalStore(subscribe, currentMinute, serverMinute);
  return (
    <time dateTime={iso} className={className}>
      {minute === null ? formatDay(iso, { day: "numeric", month: "short", year: "numeric" }) : timeAgo(iso)}
    </time>
  );
}
