import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const RANGES = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;
export type RangeDays = (typeof RANGES)[number]["days"];

export interface Count {
  key: string;
  views: number;
}

export interface StoryStats {
  slug: string;
  title: string | null;
  id: string | null;
  views: number;
  visitors: number;
  avgSec: number | null;
  readThrough: number | null;
}

export interface AnalyticsData {
  /** False until the PageView table exists in the database. */
  ready: boolean;
  views: number;
  visitors: number;
  prevViews: number;
  prevVisitors: number;
  live: number;
  avgReadSec: number | null;
  readThroughPct: number | null;
  /** Views per day (or per hour for "Today"), oldest first. */
  series: { label: string; views: number; visitors: number }[];
  seriesUnit: "day" | "hour";
  /** Views by hour of day (WAT), 0-23. */
  hours: number[];
  sources: Count[];
  countries: Count[];
  cities: { city: string; country: string | null; views: number }[];
  devices: Count[];
  browsers: Count[];
  os: Count[];
  hubs: Count[];
  campaigns: Count[];
  referrers: Count[];
  topStories: StoryStats[];
  topPages: Count[];
}

// Timestamps are stored in UTC; reports are in Lagos time.
const LOCAL = Prisma.sql`(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos')`;

const n = (v: unknown) => Number(v ?? 0);

/** Columns a breakdown may group by (identifiers can't be query parameters). */
const COLUMNS = {
  source: Prisma.raw(`"source"`),
  country: Prisma.raw(`"country"`),
  device: Prisma.raw(`"device"`),
  browser: Prisma.raw(`"browser"`),
  os: Prisma.raw(`"os"`),
  hub: Prisma.raw(`"hub"`),
  utmCampaign: Prisma.raw(`"utmCampaign"`),
  referrerHost: Prisma.raw(`"referrerHost"`),
  path: Prisma.raw(`"path"`),
};

async function breakdown(column: keyof typeof COLUMNS, since: Date, limit: number, extra = Prisma.empty): Promise<Count[]> {
  const col = COLUMNS[column];
  const rows = await prisma.$queryRaw<{ key: string; views: bigint }[]>`
    SELECT ${col} AS key, COUNT(*) AS views FROM "PageView"
    WHERE "createdAt" >= ${since} AND ${col} IS NOT NULL ${extra}
    GROUP BY ${col} ORDER BY views DESC LIMIT ${limit}`;
  return rows.map((r) => ({ key: r.key, views: n(r.views) }));
}

function isMissingTable(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2021" || err.code === "P2010");
}

export function emptyAnalytics(ready: boolean): AnalyticsData {
  return {
    ready,
    views: 0,
    visitors: 0,
    prevViews: 0,
    prevVisitors: 0,
    live: 0,
    avgReadSec: null,
    readThroughPct: null,
    series: [],
    seriesUnit: "day",
    hours: Array(24).fill(0),
    sources: [],
    countries: [],
    cities: [],
    devices: [],
    browsers: [],
    os: [],
    hubs: [],
    campaigns: [],
    referrers: [],
    topStories: [],
    topPages: [],
  };
}

/** Everything the analytics page shows for the last `days` days. */
export async function getAnalytics(days: RangeDays): Promise<AnalyticsData> {
  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000);
  const prevSince = new Date(since.getTime() - days * 86_400_000);
  const liveSince = new Date(now.getTime() - 5 * 60_000);
  const unit = days === 1 ? "hour" : "day";

  try {
    const [totals, prev, live, reading, series, hours, sources, countries, cities, devices, browsers, os, hubs, campaigns, referrers, stories, pages] =
      await Promise.all([
        prisma.$queryRaw<{ views: bigint; visitors: bigint }[]>`
          SELECT COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors FROM "PageView" WHERE "createdAt" >= ${since}`,
        prisma.$queryRaw<{ views: bigint; visitors: bigint }[]>`
          SELECT COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors FROM "PageView"
          WHERE "createdAt" >= ${prevSince} AND "createdAt" < ${since}`,
        prisma.$queryRaw<{ live: bigint }[]>`
          SELECT COUNT(DISTINCT "visitorHash") AS live FROM "PageView" WHERE "createdAt" >= ${liveSince}`,
        prisma.$queryRaw<{ avg_sec: number | null; read_through: number | null }[]>`
          SELECT AVG("durationSec") FILTER (WHERE "durationSec" > 0)::float AS avg_sec,
                 AVG(CASE WHEN "scrollPct" >= 75 THEN 1.0 WHEN "scrollPct" IS NOT NULL THEN 0.0 END)::float AS read_through
          FROM "PageView" WHERE "createdAt" >= ${since} AND "articleSlug" IS NOT NULL`,
        prisma.$queryRaw<{ bucket: string; views: bigint; visitors: bigint }[]>`
          SELECT to_char(date_trunc(${unit}, ${LOCAL}), ${unit === "hour" ? "HH24" : "YYYY-MM-DD"}) AS bucket,
                 COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors
          FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`,
        prisma.$queryRaw<{ hour: number; views: bigint }[]>`
          SELECT EXTRACT(HOUR FROM ${LOCAL})::int AS hour, COUNT(*) AS views
          FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY 1`,
        // Where readers arrived from: moving between pages on the site isn't a source.
        breakdown("source", since, 15, Prisma.sql`AND "source" <> 'internal'`),
        breakdown("country", since, 12),
        prisma.$queryRaw<{ city: string; country: string | null; views: bigint }[]>`
          SELECT "city", "country", COUNT(*) AS views FROM "PageView"
          WHERE "createdAt" >= ${since} AND "city" IS NOT NULL GROUP BY "city", "country" ORDER BY views DESC LIMIT 10`,
        breakdown("device", since, 3),
        breakdown("browser", since, 8),
        breakdown("os", since, 6),
        breakdown("hub", since, 10),
        breakdown("utmCampaign", since, 8),
        breakdown("referrerHost", since, 10, Prisma.sql`AND "source" <> 'internal'`),
        prisma.$queryRaw<{ slug: string; views: bigint; visitors: bigint; avg_sec: number | null; read_through: number | null }[]>`
          SELECT "articleSlug" AS slug, COUNT(*) AS views, COUNT(DISTINCT "visitorHash") AS visitors,
                 AVG("durationSec") FILTER (WHERE "durationSec" > 0)::float AS avg_sec,
                 AVG(CASE WHEN "scrollPct" >= 75 THEN 1.0 WHEN "scrollPct" IS NOT NULL THEN 0.0 END)::float AS read_through
          FROM "PageView" WHERE "createdAt" >= ${since} AND "articleSlug" IS NOT NULL
          GROUP BY "articleSlug" ORDER BY views DESC LIMIT 15`,
        breakdown("path", since, 10, Prisma.sql`AND "articleSlug" IS NULL`),
      ]);

    const articles = await prisma.article.findMany({
      where: { slug: { in: stories.map((s) => s.slug) } },
      select: { slug: true, title: true, id: true },
    });
    const bySlug = new Map(articles.map((a) => [a.slug, a]));

    // Fill empty days/hours so the chart has a continuous axis.
    const counted = new Map(series.map((r) => [r.bucket, r]));
    const filled =
      unit === "hour"
        ? Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"))
        : Array.from({ length: days }, (_, i) =>
            new Date(now.getTime() - (days - 1 - i) * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" })
          );

    const hourly = Array(24).fill(0) as number[];
    for (const h of hours) hourly[h.hour] = n(h.views);

    return {
      ready: true,
      views: n(totals[0]?.views),
      visitors: n(totals[0]?.visitors),
      prevViews: n(prev[0]?.views),
      prevVisitors: n(prev[0]?.visitors),
      live: n(live[0]?.live),
      avgReadSec: reading[0]?.avg_sec ?? null,
      readThroughPct: reading[0]?.read_through != null ? reading[0].read_through * 100 : null,
      series: filled.map((label) => ({ label, views: n(counted.get(label)?.views), visitors: n(counted.get(label)?.visitors) })),
      seriesUnit: unit,
      hours: hourly,
      sources,
      countries,
      cities: cities.map((c) => ({ city: c.city, country: c.country, views: n(c.views) })),
      devices,
      browsers,
      os,
      hubs,
      campaigns,
      referrers,
      topStories: stories.map((s) => ({
        slug: s.slug,
        title: bySlug.get(s.slug)?.title ?? null,
        id: bySlug.get(s.slug)?.id ?? null,
        views: n(s.views),
        visitors: n(s.visitors),
        avgSec: s.avg_sec,
        readThrough: s.read_through != null ? s.read_through * 100 : null,
      })),
      topPages: pages,
    };
  } catch (err) {
    if (isMissingTable(err) || (err instanceof Error && /relation "PageView" does not exist/i.test(err.message))) {
      return emptyAnalytics(false);
    }
    throw err;
  }
}
