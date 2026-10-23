"use client";

import { useSyncExternalStore } from "react";
import { dateKey, SERVER_VIEWER, type Viewer } from "@/lib/time";

// Check once a minute so "today" moves on at the visitor's midnight.
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
}

let cached: Viewer | null = null;

function browserLocale(): string {
  try {
    // The site is in English: follow the visitor's English (12-hour clock in the US), else British English.
    const lang = navigator.language;
    return /^en(-|$)/i.test(lang) ? Intl.DateTimeFormat.supportedLocalesOf(lang)[0] ?? "en-GB" : "en-GB";
  } catch {
    return "en-GB";
  }
}

// Stable between calls until the date changes, so React can compare snapshots.
function getViewer(): Viewer {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const viewer = cached ?? { timeZone, locale: browserLocale(), today: null };
  const today = dateKey(Date.now(), viewer.timeZone);
  if (cached?.today !== today) cached = { ...viewer, today };
  return cached;
}

const serverViewer = () => SERVER_VIEWER;

/**
 * The visitor's time zone, locale and local date. Server render and hydration
 * get SERVER_VIEWER (UTC) so the HTML matches; the browser then re-renders
 * with local times. Soft navigations render local times straight away.
 */
export function useViewer(): Viewer {
  return useSyncExternalStore(subscribe, getViewer, serverViewer);
}
