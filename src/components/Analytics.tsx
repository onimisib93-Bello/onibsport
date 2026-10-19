"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type ViewState = { id: string; start: number; hiddenAt: number | null; hiddenMs: number; maxScroll: number; ended: boolean };

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.(`/api/track`, new Blob([body], { type: "application/json" }))) return;
  } catch {
    // fall through to fetch
  }
  fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
}

function scrollPercent() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  return max <= 0 ? 100 : Math.min(100, ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100);
}

/**
 * Counts page views for the admin analytics page: one "view" beacon per page
 * and one "end" beacon with read time and scroll depth when the reader moves
 * on or leaves. No cookies; see app/api/track/route.ts for what is stored.
 */
export default function Analytics() {
  const pathname = usePathname();
  const view = useRef<ViewState | null>(null);
  const firstView = useRef(true);

  useEffect(() => {
    const end = () => {
      const v = view.current;
      if (!v || v.ended) return;
      v.ended = true;
      const hiddenNow = v.hiddenAt ? Date.now() - v.hiddenAt : 0;
      const duration = (Date.now() - v.start - v.hiddenMs - hiddenNow) / 1000;
      send({ t: "end", id: v.id, duration, scroll: Math.max(v.maxScroll, scrollPercent()) });
    };

    // A new page: close out the previous one, then record this one.
    end();
    const params = new URLSearchParams(window.location.search);
    view.current = { id: crypto.randomUUID(), start: Date.now(), hiddenAt: null, hiddenMs: 0, maxScroll: scrollPercent(), ended: false };
    send({
      t: "view",
      id: view.current.id,
      path: pathname,
      // The real referrer only means something on the page the reader landed on.
      referrer: firstView.current ? document.referrer : window.location.origin + "/",
      utm: firstView.current
        ? { source: params.get("utm_source"), medium: params.get("utm_medium"), campaign: params.get("utm_campaign") }
        : {},
    });
    firstView.current = false;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (view.current) view.current.maxScroll = Math.max(view.current.maxScroll, scrollPercent());
      });
    };
    const onVisibility = () => {
      const v = view.current;
      if (!v) return;
      if (document.visibilityState === "hidden") {
        v.hiddenAt = Date.now();
        // The tab may never come back (mobile browsers kill it), so report now.
        end();
      } else if (v.hiddenAt) {
        v.hiddenMs += Date.now() - v.hiddenAt;
        v.hiddenAt = null;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", end);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", end);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
