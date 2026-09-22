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
const TOTAL_LIMIT = 20;
const MAX_AGE_HOURS = 48;

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

    return items.slice(0, PER_FEED_LIMIT).map((item: Record<string, unknown>, i: number): SourceItem => {
      const title = stripHtml(textValue(item.title)) || "Untitled alert";
      const summarySource = item.summary ?? item.content ?? item.description ?? "";
      const summary = stripHtml(textValue(summarySource)) || title;
      const link = extractRealUrl(getLinkHref(item.link));

      return {
        id: `alert-${i}-${Buffer.from(feedUrl + title).toString("base64url").slice(0, 12)}`,
        headline: title,
        sourceName: "Google Alerts",
        sourceUrl: link || undefined,
        rawSummary: summary,
        categorySlug: "transfers",
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
    const key = item.headline.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
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
