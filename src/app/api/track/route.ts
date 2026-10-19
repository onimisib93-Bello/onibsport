import { NextRequest } from "next/server";
import { geolocation, ipAddress } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";
import { classifySource, isBot, parseUserAgent, pathInfo, visitorHash } from "@/lib/analytics/classify";

const MAX_DURATION_SEC = 30 * 60;
const ok = () => new Response(null, { status: 204 });

function text(value: unknown, max = 200): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Page-view beacon from the public site (see components/Analytics.tsx).
 * "view" records a view; "end" adds read time and scroll depth when the reader
 * leaves. Always answers 204 so tracking can never break a page; signed-in
 * editors, bots and link-preview fetchers are not counted.
 */
export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua) || request.cookies.has(SESSION_COOKIE)) return ok();
  // Local development shares the production database; never count those visits.
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(request.nextUrl.hostname)) return ok();

  const body = await request.json().catch(() => null);
  const id = text(body?.id, 64);
  if (!id) return ok();

  try {
    if (body.t === "end") {
      const duration = Number(body.duration);
      const scroll = Number(body.scroll);
      await prisma.pageView.updateMany({
        where: { id, createdAt: { gte: new Date(Date.now() - 2 * 3600_000) } },
        data: {
          durationSec: Number.isFinite(duration) ? Math.max(0, Math.min(MAX_DURATION_SEC, Math.round(duration))) : undefined,
          scrollPct: Number.isFinite(scroll) ? Math.max(0, Math.min(100, Math.round(scroll))) : undefined,
        },
      });
      return ok();
    }

    const path = text(body.path, 300);
    if (!path || !path.startsWith("/") || path.startsWith("/admin")) return ok();

    const referrer = text(body.referrer, 500);
    const utmSource = text(body.utm?.source, 60);
    const geo = geolocation(request);
    const { device, browser, os } = parseUserAgent(ua);
    const referrerHost = hostOf(referrer);

    await prisma.pageView.create({
      data: {
        id,
        path,
        ...pathInfo(path),
        visitorHash: visitorHash(ipAddress(request) ?? "unknown", ua),
        source: classifySource(referrerHost, utmSource, request.nextUrl.hostname),
        referrerHost,
        utmSource,
        utmMedium: text(body.utm?.medium, 60),
        utmCampaign: text(body.utm?.campaign, 100),
        country: geo.country ?? null,
        region: geo.countryRegion ?? null,
        city: geo.city ?? null,
        device,
        browser,
        os,
      },
    });
  } catch {
    // Duplicate id, analytics table not created yet, or the database is busy: drop the event.
  }
  return ok();
}
