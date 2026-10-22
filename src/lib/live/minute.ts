/**
 * The match clock for a live game. The free scores feed gives the status and
 * kick-off time but not the minute, so it is worked out from the kick-off:
 * a 15-minute half-time break and a couple of minutes of first-half stoppage
 * time are assumed, which keeps it within a minute or two of the real clock.
 * A real minute from the match-details feed always wins when there is one.
 */
export function liveMinuteLabel({
  kickoff,
  paused,
  minute,
  extra,
  now,
}: {
  kickoff: string;
  /** Half-time (the feed's PAUSED status). */
  paused?: boolean;
  /** Real elapsed minute, when known. */
  minute?: number | null;
  /** Real stoppage-time minute, when known. */
  extra?: number | null;
  now: number;
}): string {
  if (paused) return "HT";
  if (minute != null) return extra ? `${minute}+${extra}'` : `${minute}'`;

  const elapsed = Math.floor((now - new Date(kickoff).getTime()) / 60_000) + 1;
  if (elapsed <= 1) return "1'";
  if (elapsed <= 45) return `${elapsed}'`;
  // Still in play but not yet at half-time: first-half stoppage time.
  if (elapsed <= 60) return "45+'";
  const secondHalf = Math.max(46, elapsed - 17);
  return secondHalf <= 90 ? `${secondHalf}'` : "90+'";
}

/** An event's minute as "67'" or "90+3'". */
export function minuteText(e: { minute: number; extra: number | null }): string {
  return e.extra ? `${e.minute}+${e.extra}'` : `${e.minute}'`;
}
