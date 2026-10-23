import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAlertFeeds, parseAlertFeed } from "@/lib/ai/alerts";

const TABLE_MISSING = "The AlertFeed table hasn't been created in the database yet. Run `npm run db:push` once, then try again.";

/** Only Google Alerts feed links, e.g. https://www.google.com/alerts/feeds/0123/4567. */
function isGoogleAlertsFeed(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /^(www\.)?google\.[a-z.]+$/.test(url.hostname) && url.pathname.startsWith("/alerts/feeds/");
  } catch {
    return false;
  }
}

const bodySchema = z.object({ url: z.string().trim().max(500) });

export async function GET() {
  return NextResponse.json({ feeds: await getAlertFeeds() });
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  const url = parsed.success ? parsed.data.url : "";
  if (!isGoogleAlertsFeed(url)) {
    return NextResponse.json(
      { error: "Paste the alert's RSS feed link. It starts with https://www.google.com/alerts/feeds/ (right-click the orange RSS icon next to the alert and copy the link)." },
      { status: 400 }
    );
  }

  const existing = await getAlertFeeds();
  if (existing.some((f) => f.url === url)) return NextResponse.json({ error: "That alert is already on the list." }, { status: 409 });

  // Read the feed now, so a wrong or broken link is caught here rather than silently showing nothing.
  let keyword: string;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Google answered ${res.status}`);
    const feed = parseAlertFeed(url, await res.text());
    if (!feed) throw new Error("that link isn't an RSS feed");
    keyword = feed.keyword;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "it couldn't be read";
    return NextResponse.json({ error: `Couldn't read that feed (${detail}). Check the link and that the alert is set to deliver to RSS feed.` }, { status: 400 });
  }

  try {
    const feed = await prisma.alertFeed.create({ data: { url, keyword } });
    return NextResponse.json({ feed }, { status: 201 });
  } catch {
    return NextResponse.json({ error: TABLE_MISSING }, { status: 503 });
  }
}
