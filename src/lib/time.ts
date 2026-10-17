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
 * Kick-off times and dates are shown in West Africa Time for everyone, so
 * server and browser render the same string (no hydration mismatch) and the
 * home audience reads local times.
 */
export const SITE_TIME_ZONE = "Africa/Lagos";
export const SITE_TIME_LABEL = "WAT";

export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: SITE_TIME_ZONE });
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  return new Date(iso).toLocaleDateString("en-GB", { ...opts, timeZone: SITE_TIME_ZONE });
}
