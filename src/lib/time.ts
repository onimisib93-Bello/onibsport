export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Whose clock a time is shown on. The server (and cached pages) always render
 * UTC, so server and browser produce the same text during hydration; once the
 * page is live, useViewer swaps in the visitor's own time zone and locale.
 * `today` is the visitor's local date (YYYY-MM-DD), null on the server.
 */
export interface Viewer {
  timeZone: string;
  locale: string;
  today: string | null;
}

export const SERVER_VIEWER: Viewer = { timeZone: "UTC", locale: "en-GB", today: null };

// Zones Intl only names as "GMT+1" and the like.
const ZONE_NAMES: Record<string, string> = {
  "Africa/Lagos": "WAT",
  "Africa/Nairobi": "EAT",
  "Africa/Johannesburg": "SAST",
};

/** Kick-off time on the viewer's clock: "20:00", "3:00 PM". */
export function formatKickoff(iso: string, viewer: Viewer = SERVER_VIEWER): string {
  const twelveHour = new Intl.DateTimeFormat(viewer.locale, { hour: "numeric" }).resolvedOptions().hour12;
  return new Date(iso).toLocaleTimeString(viewer.locale, {
    hour: twelveHour ? "numeric" : "2-digit",
    minute: "2-digit",
    timeZone: viewer.timeZone,
  });
}

/** The day an instant falls on for the viewer: "Sat 25 Oct". */
export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }, viewer: Viewer = SERVER_VIEWER): string {
  return new Date(iso).toLocaleDateString(viewer.locale, { ...opts, timeZone: viewer.timeZone });
}

/** A calendar date (YYYY-MM-DD) in the viewer's words. It names a day, not an instant, so no time zone moves it. */
export function formatDate(date: string, opts: Intl.DateTimeFormatOptions, viewer: Viewer = SERVER_VIEWER): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(viewer.locale, { ...opts, timeZone: "UTC" });
}

/** Short name of the viewer's time zone at that instant: "BST", "EDT", "AEDT". */
export function zoneLabel(iso: string, viewer: Viewer = SERVER_VIEWER): string {
  if (ZONE_NAMES[viewer.timeZone]) return ZONE_NAMES[viewer.timeZone];
  const name = (locale: string) =>
    new Intl.DateTimeFormat(locale, { timeZone: viewer.timeZone, timeZoneName: "short" }).formatToParts(new Date(iso)).find((p) => p.type === "timeZoneName")?.value ?? "";
  // Each English locale only knows its own region's abbreviations ("EDT" in en-US, "BST" in en-GB).
  const names = [viewer.locale, "en-US", "en-GB"].map(name);
  return names.find((n) => n && !/^(GMT|UTC)[+\-−]/.test(n)) ?? names[0];
}

/** The calendar date (YYYY-MM-DD) an instant falls on in a time zone. */
export function dateKey(at: string | number, timeZone = "UTC"): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(at));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** The YYYY-MM-DD date `days` after (or before) another. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** An IANA time zone name the runtime knows ("Europe/London"), or null. */
export function parseTimeZone(value: string | null | undefined): string | null {
  if (!value || value.length > 64) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}
