import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { SourceItem, SAMPLE_SOURCE_QUEUE } from "@/lib/ai/queue";

/**
 * Pulls incoming stories from Google Alerts RSS feeds instead of the sample
 * queue. This session has no Gmail/email access, so RSS is the practical
 * substitute for "check my alert emails": for each alert at google.com/alerts,
 * set delivery to "RSS feed" instead of email, and paste that feed's URL into
 * NEWS_ALERTS_RSS_URL. Google gives each alert its own separate feed link —
 * there's no single combined feed — so this accepts a comma-separated list of
 * URLs, one per alert, and merges them into one queue.
 *
 * Google Alerts feeds are Atom, but this also tolerates classic RSS 2.0 in
 * case a URL is swapped for a different feed later.
 */

const PER_FEED_LIMIT = 5;
/**
 * Safety cap on the whole queue. Feeds are read in order and each gives up
 * to PER_FEED_LIMIT stories, so this must stay well above feeds × 5 or the
 * later alerts never appear (it used to be 20, which hid all but 4 alerts).
 */
const TOTAL_LIMIT = 150;
const MAX_AGE_HOURS = 48;

/** Best-guess league hub for an alert keyword; the AI Desk can still override it. */
const HUB_BY_KEYWORD: [RegExp, string][] = [
  [/champions league|\bucl\b/i, "champions-league"],
  [/premier league|arsenal|chelsea|manchester|man utd|man city|liverpool|tottenham|newcastle|aston villa/i, "premier-league"],
  [/la ?liga|barcelona|real madrid|atletico/i, "la-liga"],
  [/serie a|juventus|inter milan|ac milan|napoli|roma\b/i, "serie-a"],
  [/bundesliga|bayern|dortmund|leverkusen/i, "bundesliga"],
  [/\bnpfl\b|enyimba|rivers united|remo stars|kano pillars/i, "npfl"],
  [/super eagles|super falcons|nigeria|osimhen|lookman/i, "nigeria-football"],
];

function hubForKeyword(keyword: string): string {
  return HUB_BY_KEYWORD.find(([pattern]) => pattern.test(keyword))?.[1] ?? "transfers";
}

/**
 * Google's <title type="html"> and <content type="html"> elements have an
 * attribute, so the parser returns { "@_type": "html", "#text": "..." }
 * instead of a plain string — this unwraps that shape (and tolerates a
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

function getFeedUrls(): string[] {
  const raw = process.env.NEWS_ALERTS_RSS_URL;
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fetchOneFeed(feedUrl: string): Promise<SourceItem[]> {
  try {
    const res = await fetch(feedUrl, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const data = parser.parse(xml);

    // Google names each feed "Google Alert - <keyword>".
    const feedTitle = stripHtml(textValue(data?.feed?.title ?? data?.rss?.channel?.title));
    const keyword = feedTitle.replace(/^google alerts?\s*[-–:]\s*/i, "").trim() || "Alerts";
    const categorySlug = hubForKeyword(keyword);

    const rawItems = data?.feed?.entry ?? data?.rss?.channel?.item ?? [];
    const allItems = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
    const recent = allItems.filter((item: Record<string, unknown>) => {
      const published = textValue(item.published ?? item.pubDate ?? item.updated);
      const time = Date.parse(published);
      return Number.isNaN(time) ? true : time >= cutoff;
    });
    // If this alert had nothing in the last 48h, still surface its most recent hit rather than nothing.
    const items = recent.length > 0 ? recent : allItems.slice(0, 1);

    return items.slice(0, PER_FEED_LIMIT).map((item: Record<string, unknown>): SourceItem => {
      const title = stripHtml(textValue(item.title)) || "Untitled alert";
      const summarySource = item.summary ?? item.content ?? item.description ?? "";
      const summary = stripHtml(textValue(summarySource)) || title;
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
    });
  } catch {
    return [];
  }
}

export async function fetchAlertsQueue(): Promise<SourceItem[]> {
  const feedUrls = getFeedUrls();
  if (feedUrls.length === 0) return [];

  const results = await Promise.all(feedUrls.map(fetchOneFeed));
  const combined = results.flat();

  const seen = new Set<string>();
  const deduped = combined.filter((item) => {
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
}

/** Combines the two possible sources into one queue for the AI Desk. */
export async function getSourceQueue(): Promise<SourceQueueResult> {
  const alerts = await fetchAlertsQueue();
  if (alerts.length > 0) return { items: alerts, isLive: true };
  return { items: SAMPLE_SOURCE_QUEUE, isLive: false };
}
