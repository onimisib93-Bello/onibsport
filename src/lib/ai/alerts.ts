import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";
import { SourceItem, SAMPLE_SOURCE_QUEUE } from "@/lib/ai/queue";

/**
 * Pulls incoming stories from Google Alerts RSS feeds. Google gives each
 * alert its own feed link (there's no single combined feed), so the queue
 * merges every feed it knows about:
 *
 * - feeds added on the AI Desk (the AlertFeed table), and
 * - any listed in NEWS_ALERTS_RSS_URL in Vercel (comma or newline separated).
 *
 * Google Alerts feeds are Atom, but classic RSS 2.0 also works.
 */

/** Google keeps up to 20 recent stories in each alert's feed; show all of them. */
const PER_FEED_LIMIT = 20;
/** Safety cap on the whole queue, well above feeds × 20 so no alert is crowded out. */
const TOTAL_LIMIT = 800;
const MAX_AGE_HOURS = 72;

/**
 * Best-guess hub for an alert keyword; the AI Desk can still override it per
 * story. General keywords ("Football news", players, managers) go to World Football.
 */
const HUB_BY_KEYWORD: [RegExp, string][] = [
  [/champions league|\bucl\b/i, "champions-league"],
  [/premier league|arsenal|chelsea|manchester|man utd|man city|liverpool|tottenham|newcastle|aston villa/i, "premier-league"],
  [/la ?liga|barcelona|real madrid|atletico/i, "la-liga"],
  [/serie a|juventus|inter milan|ac milan|napoli|roma\b/i, "serie-a"],
  [/bundesliga|bayern|dortmund|leverkusen/i, "bundesliga"],
  [/\bnpfl\b|enyimba|rivers united|remo stars|kano pillars/i, "npfl"],
  [/super eagles|super falcons|nigeria|osimhen|lookman/i, "nigeria-football"],
  [/transfer|signing/i, "transfers"],
];

function hubForKeyword(keyword: string): string {
  return HUB_BY_KEYWORD.find(([pattern]) => pattern.test(keyword))?.[1] ?? "world-football";
}

/**
 * Google's <title type="html"> and <content type="html"> elements have an
 * attribute, so the parser returns { "@_type": "html", "#text": "..." }
 * instead of a plain string; this unwraps that shape (and tolerates a
 * plain string too, for feeds that don't use the attribute).
 */
function textValue(field: unknown): string {
  if (typeof field === "string") return field;
  if (typeof field === "number") return String(field);
  if (field && typeof field === "object") {
    const obj = field as Record<string, unknown>;
    return textValue(obj["#text"]);
  }
  return "";
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractRealUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const wrapped = parsed.searchParams.get("url");
    return wrapped ?? rawUrl;
  } catch {
    return rawUrl;
  }
}

function getLinkHref(link: unknown): string {
  if (typeof link === "string") return link;
  if (Array.isArray(link)) return getLinkHref(link[0]);
  if (link && typeof link === "object") {
    const obj = link as Record<string, unknown>;
    return String(obj["@_href"] ?? obj.href ?? "");
  }
  return "";
}

/**
 * Stable, unique id for one alert, derived from the story itself (its link,
 * or feed + title when there is none). It must not depend on the item's
 * position in the feed: the AI Desk looks stories up by this id when an
 * editor clicks a button, after the feeds may have refreshed.
 */
function alertId(key: string): string {
  return `alert-${createHash("sha256").update(key).digest("base64url").slice(0, 16)}`;
}

/* ---------- Feeds ---------- */

export interface AlertFeedSource {
  url: string;
  /** "admin": added on the AI Desk (removable there). "vercel": listed in NEWS_ALERTS_RSS_URL. */
  origin: "admin" | "vercel";
  id?: string;
  keyword?: string;
}

function envFeedUrls(): string[] {
  return (process.env.NEWS_ALERTS_RSS_URL ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Every feed the queue reads: the AI Desk's list first, then the Vercel setting. */
export async function getAlertFeeds(): Promise<AlertFeedSource[]> {
  let admin: AlertFeedSource[] = [];
  try {
    const rows = await prisma.alertFeed.findMany({ orderBy: { createdAt: "asc" } });
    admin = rows.map((r) => ({ url: r.url, origin: "admin" as const, id: r.id, keyword: r.keyword || undefined }));
  } catch {
    // AlertFeed table not created yet: only the Vercel setting applies.
  }
  const known = new Set(admin.map((f) => f.url));
  const vercel = envFeedUrls()
    .filter((url) => !known.has(url))
    .map((url) => ({ url, origin: "vercel" as const }));
  return [...admin, ...vercel];
}

/** Reads one feed's XML: its keyword (from "Google Alert - <keyword>") and its stories. */
export function parseAlertFeed(feedUrl: string, xml: string): { keyword: string; items: SourceItem[] } | null {
  const parser = new XMLParser({ ignoreAttributes: false });
  let data: Record<string, unknown>;
  try {
    data = parser.parse(xml);
  } catch {
    return null;
  }
  const feed = data?.feed as Record<string, unknown> | undefined;
  const channel = (data?.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined;
  if (!feed && !channel) return null;

  const feedTitle = stripHtml(textValue(feed?.title ?? channel?.title));
  const keyword = feedTitle.replace(/^google alerts?\s*[-–:]\s*/i, "").trim() || "Alerts";
  const categorySlug = hubForKeyword(keyword);

  const rawItems = feed?.entry ?? channel?.item ?? [];
  const allItems = (Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []) as Record<string, unknown>[];

  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  const recent = allItems.filter((item) => {
    const time = Date.parse(textValue(item.published ?? item.pubDate ?? item.updated));
    return Number.isNaN(time) ? true : time >= cutoff;
  });
  // If this alert had nothing recent, still surface its latest hits rather than nothing.
  const items = recent.length > 0 ? recent : allItems.slice(0, 3);

  return {
    keyword,
    items: items.slice(0, PER_FEED_LIMIT).map((item): SourceItem => {
      const title = stripHtml(textValue(item.title)) || "Untitled alert";
      const summary = stripHtml(textValue(item.summary ?? item.content ?? item.description ?? "")) || title;
      const link = extractRealUrl(getLinkHref(item.link));
      const published = Date.parse(textValue(item.published ?? item.pubDate ?? item.updated));
      return {
        id: alertId(link || `${feedUrl}\n${title}`),
        headline: title,
        sourceName: `Google Alerts: ${keyword}`,
        sourceUrl: link || undefined,
        rawSummary: summary,
        categorySlug,
        keyword,
        publishedAt: Number.isNaN(published) ? undefined : new Date(published).toISOString(),
      };
    }),
  };
}

export interface FeedResult extends AlertFeedSource {
  ok: boolean;
  keyword: string;
  items: SourceItem[];
}

async function fetchOneFeed(source: AlertFeedSource): Promise<FeedResult> {
  const failed = { ...source, ok: false, keyword: source.keyword ?? "Unknown alert", items: [] };
  try {
    const res = await fetch(source.url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return failed;
    const parsed = parseAlertFeed(source.url, await res.text());
    return parsed ? { ...source, ok: true, keyword: parsed.keyword, items: parsed.items } : failed;
  } catch {
    return failed;
  }
}

/** Every feed with its keyword, whether it could be read, and its stories. */
export async function fetchAlertFeeds(): Promise<FeedResult[]> {
  return Promise.all((await getAlertFeeds()).map(fetchOneFeed));
}

export async function fetchAlertsQueue(results?: FeedResult[]): Promise<SourceItem[]> {
  const feeds = results ?? (await fetchAlertFeeds());
  const seen = new Set<string>();
  const deduped = feeds
    .flatMap((f) => f.items)
    .filter((item) => {
      // Same story in two alerts (same headline or same link): keep the first.
      const key = item.headline.toLowerCase();
      if (seen.has(key) || seen.has(item.id)) return false;
      seen.add(key);
      seen.add(item.id);
      return true;
    });
  return deduped.slice(0, TOTAL_LIMIT);
}

export interface SourceQueueResult {
  items: SourceItem[];
  isLive: boolean;
  feeds: FeedResult[];
}

/** The AI Desk's queue: live alerts when any feed has stories, otherwise the sample queue. */
export async function getSourceQueue(): Promise<SourceQueueResult> {
  const feeds = await fetchAlertFeeds();
  const alerts = await fetchAlertsQueue(feeds);
  if (alerts.length > 0) return { items: alerts, isLive: true, feeds };
  return { items: SAMPLE_SOURCE_QUEUE, isLive: false, feeds };
}
