"use client";

import { useEffect, useState } from "react";
import type { Scoreboard } from "@/lib/live/footballData";

const REFRESH_MS = 60_000;

// The ticker and the homepage strip both use this; share one request between them.
let pending: { at: number; promise: Promise<Scoreboard | null> } | null = null;

function loadScoreboard(): Promise<Scoreboard | null> {
  if (pending && Date.now() - pending.at < 5_000) return pending.promise;
  // A 20-second bucket in the URL lets the CDN answer most visitors without a new upstream call.
  const bucket = Math.floor(Date.now() / 20_000);
  const promise = fetch(`/api/scores/live?b=${bucket}`)
    .then((res) => (res.ok ? (res.json() as Promise<Scoreboard>) : null))
    .catch(() => null);
  pending = { at: Date.now(), promise };
  return promise;
}

/**
 * Starts from the scores rendered with the page (which may come from a cache
 * and be a few minutes old), fetches fresh ones straight away, then refreshes
 * every minute while the tab is visible.
 */
export function useLiveScores(initial: Scoreboard): Scoreboard {
  const [board, setBoard] = useState(initial);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      loadScoreboard().then((next) => {
        if (alive && next) setBoard(next);
      });
    };
    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return board;
}
