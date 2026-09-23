const FETCH_TIMEOUT_MS = 8000;
const MAX_CHARS = 6000;
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
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
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

/**
 * Best-effort extraction of the readable body text from a news article URL,
 * so the AI Desk can rewrite what the source actually says instead of just
 * the one-line alert snippet. Prefers an <article> tag when present. Never
 * throws — a fetch failure, timeout, or thin/blocked page just falls back to
 * null so the caller can use the RSS summary instead.
 */
export async function fetchSourceArticleText(url: string): Promise<string | null> {
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
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) return null;

    const html = await res.text();
    const articleMatch = html.match(/<article[^>]*>[\s\S]*?<\/article>/i);
    const text = htmlToText(articleMatch ? articleMatch[0] : html);

    if (text.length < MIN_USABLE_CHARS) return null;
    return text.slice(0, MAX_CHARS);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
