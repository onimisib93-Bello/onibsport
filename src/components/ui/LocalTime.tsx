"use client";

import { formatDay, formatKickoff, zoneLabel } from "@/lib/time";
import { useViewer } from "@/lib/useViewer";

/**
 * A kick-off (or any instant) on the visitor's clock: "Sat 25 Oct, 20:00 BST".
 * `day` adds the date in that format, `time` the hour, `zone` the zone name.
 * Renders UTC on the server and switches to local time once the page is live.
 */
export default function LocalTime({
  iso,
  day,
  time = true,
  zone = false,
  className,
}: {
  iso: string;
  day?: Intl.DateTimeFormatOptions;
  time?: boolean;
  zone?: boolean;
  className?: string;
}) {
  const viewer = useViewer();
  const text = [day && formatDay(iso, day, viewer), time && [formatKickoff(iso, viewer), zone && zoneLabel(iso, viewer)].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  );
}

/** Just the visitor's time-zone name for that instant: "BST". */
export function ZoneLabel({ iso, className }: { iso: string; className?: string }) {
  const viewer = useViewer();
  return <span className={className}>{zoneLabel(iso, viewer)}</span>;
}
