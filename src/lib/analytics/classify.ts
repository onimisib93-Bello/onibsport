import { createHash } from "node:crypto";

/** Crawlers, link-preview fetchers and monitoring tools that shouldn't count as readers. */
const BOT_RE =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|meta-externalagent|whatsapp|telegrambot|discord|embedly|vercel|lighthouse|headless|phantom|python|curl|wget|axios|node-fetch|go-http/i;

export function isBot(userAgent: string): boolean {
  return !userAgent || BOT_RE.test(userAgent);
}

export const SOCIAL_SOURCES = ["facebook", "x", "instagram", "tiktok", "whatsapp", "threads", "youtube", "telegram", "linkedin", "snapchat", "reddit"] as const;

/** Referrer host (or utm_source) to a source name. Order matters: first match wins. */
const SOURCE_RULES: [RegExp, string][] = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.(com|me)$|^fb$/, "facebook"],
  [/(^|\.)instagram\.com$|^ig$/, "instagram"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
  [/^t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$|^twitter$/, "x"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)whatsapp\.(com|net)$|^wa\.me$/, "whatsapp"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
  [/(^|\.)t\.me$|(^|\.)telegram\.(org|me)$/, "telegram"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
  [/(^|\.)snapchat\.com$/, "snapchat"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)(duckduckgo\.com|search\.yahoo\.com|yandex\.[a-z.]+|baidu\.com|ecosia\.org|search\.brave\.com)$/, "other-search"],
];

const UTM_ALIASES: Record<string, string> = { twitter: "x", fb: "facebook", ig: "instagram", wa: "whatsapp" };

/**
 * Where a view came from. A utm_source (the links in Onibsport's own social
 * posts carry one) wins over the referrer, since apps like WhatsApp and
 * Instagram often send no referrer at all.
 */
export function classifySource(referrerHost: string | null, utmSource: string | null, siteHost: string): string {
  if (utmSource) {
    const key = utmSource.toLowerCase().trim();
    const alias = UTM_ALIASES[key] ?? key;
    const match = SOURCE_RULES.find(([re]) => re.test(alias));
    return match ? match[1] : alias.replace(/[^a-z0-9-]/g, "").slice(0, 30) || "other";
  }
  if (!referrerHost) return "direct";
  const host = referrerHost.toLowerCase().replace(/^www\.|^m\.|^l\.|^lm\.|^mobile\./, "");
  if (host === siteHost.toLowerCase().replace(/^www\./, "")) return "internal";
  return SOURCE_RULES.find(([re]) => re.test(host))?.[1] ?? "other";
}

/** Rough device, browser and OS from the user-agent; enough for a breakdown, not fingerprinting. */
export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? "tablet" : /mobi|iphone|android/i.test(ua) ? "mobile" : "desktop";
  const browser =
    /FBAN|FBAV/.test(ua) ? "Facebook app"
    : /Instagram/.test(ua) ? "Instagram app"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /Edg\//.test(ua) ? "Edge"
    : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari"
    : "Other";
  const os =
    /Windows/.test(ua) ? "Windows"
    : /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Android/.test(ua) ? "Android"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : "Other";
  return { device, browser, os };
}

/**
 * One-way, daily-rotating visitor id: the same reader gets the same hash for
 * one day (Lagos time) only, and the IP itself is never stored.
 */
export function visitorHash(ip: string, userAgent: string, now = new Date()): string {
  const day = now.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  const salt = process.env.AUTH_SECRET ?? "onibsport";
  return createHash("sha256").update(`${salt}|${day}|${ip}|${userAgent}`).digest("base64url").slice(0, 22);
}

/** Pulls the article slug or hub slug out of a site path. */
export function pathInfo(path: string): { articleSlug: string | null; hub: string | null } {
  const article = path.match(/^\/article\/([^/?#]+)/);
  const hub = path.match(/^\/category\/([^/?#]+)/);
  return { articleSlug: article ? decodeURIComponent(article[1]) : null, hub: hub ? decodeURIComponent(hub[1]) : null };
}
