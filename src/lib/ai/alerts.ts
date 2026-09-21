import { XMLParser } from "fast-xml-parser";
import { SourceItem, SAMPLE_SOURCE_QUEUE } from "@/lib/ai/queue";

/**
 * Pulls incoming stories from a Google Alerts RSS feed instead of the sample
 * queue. This session has no Gmail/email access, so RSS is the practical
 * substitute for "check my alert emails": create the alert at
 * google.com/alerts, set delivery to "RSS feed" instead of email, and paste
 * that feed's URL into NEWS_ALERTS_RSS_URL.
 *
 * Google Alerts feeds are Atom, but this also tolerates classic RSS 2.0 in
 * case the URL is swapped for a different feed later.
 */

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

export async function fetchAlertsQueue(): Promise<SourceItem[]> {
  const feedUrl = process.env.NEWS_ALERTS_RSS_URL;
  if (!feedUrl) return [];

  try {
    const res = await fetch(feedUrl, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const data = parser.parse(xml);

    const rawItems = data?.feed?.entry ?? data?.rss?.channel?.item ?? [];
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    return items.slice(0, 10).map((item: Record<string, unknown>, i: number): SourceItem => {
      const title = stripHtml(String(item.title ?? "Untitled alert"));
      const summarySource = item.summary ?? item.content ?? item.description ?? "";
      const summary = stripHtml(String(summarySource)) || title;
      const link = extractRealUrl(getLinkHref(item.link));

      return {
        id: `alert-${i}-${Buffer.from(title).toString("base64url").slice(0, 10)}`,
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
