const FETCH_TIMEOUT_MS = 8000;
const MAX_CHARS = 12000;
const MIN_USABLE_CHARS = 200;

function stripTagBlock(html: string, tag: string): string {
  return html.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&quot;/g, '"');
}

function htmlToText(html: string): string {
  let cleaned = html;
  for (const tag of ["script", "style", "nav", "header", "footer", "aside", "form", "noscript", "figure"]) {
    cleaned = stripTagBlock(cleaned, tag);
  }
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, " ");
  cleaned = cleaned.replace(/<\/(p|div|h[1-6]|li|br)>/gi, "\n");
  cleaned = cleaned.replace(/<[^>]+>/g, " ");
  cleaned = decodeEntities(cleaned);
  return cleaned
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** Reads <meta property|name="key" content="..."> in either attribute order. */
function metaContent(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`, "i"));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`, "i"));
  const value = a?.[1] ?? b?.[1];
  return value ? decodeEntities(value).trim() : undefined;
}

function absolute(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined;
  try {
    const resolved = new URL(url, base);
    return resolved.protocol === "https:" || resolved.protocol === "http:" ? resolved.toString() : undefined;
  } catch {
    return undefined;
  }
}

function outletFromHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export interface SourceArticle {
  /** Readable body text, or null when the page was blocked/thin. */
  text: string | null;
  /** The page's own share image (og:image), if it declares one. */
  image?: string;
  imageAlt?: string;
  /** Publisher name (og:site_name), falling back to the hostname. */
  outlet: string;
  /** Canonical URL of the source story. */
  url: string;
}

/**
 * Best-effort read of a news article URL so the AI Desk can rewrite what the
 * source actually says instead of just the one-line alert snippet. Prefers an
 * <article> tag when present, and also picks up the share image and the
 * publisher's name. Never throws — a fetch failure, timeout, or thin/blocked
 * page returns text: null so the caller can fall back to the RSS summary.
 */
export async function fetchSourceArticle(url: string): Promise<SourceArticle> {
  const fallback: SourceArticle = { text: null, outlet: outletFromHost(url), url };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OnibsportBot/1.0; +https://onibsport.com/about)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return fallback;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) return fallback;

    const html = await res.text();
    const finalUrl = res.url || url;
    const canonical = absolute(html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1], finalUrl) ?? finalUrl;
    const articleMatch = html.match(/<article[^>]*>[\s\S]*?<\/article>/i);
    const text = htmlToText(articleMatch ? articleMatch[0] : html);

    return {
      text: text.length < MIN_USABLE_CHARS ? null : text.slice(0, MAX_CHARS),
      image: absolute(metaContent(html, "og:image") ?? metaContent(html, "twitter:image"), finalUrl),
      imageAlt: metaContent(html, "og:image:alt") ?? metaContent(html, "twitter:image:alt"),
      outlet: metaContent(html, "og:site_name") ?? outletFromHost(canonical),
      url: canonical,
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

