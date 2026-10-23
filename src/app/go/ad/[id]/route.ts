import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBot } from "@/lib/analytics/classify";
import { SESSION_COOKIE } from "@/lib/auth";

/**
 * Every ad links here first: count the click, then send the reader on to the
 * advertiser. Bots, link previews, signed-in editors and local development
 * aren't counted.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = await prisma.ad.findUnique({ where: { id }, select: { linkUrl: true } }).catch(() => null);
  if (!ad) return NextResponse.redirect(new URL("/", request.url));

  const ua = request.headers.get("user-agent") ?? "";
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(request.nextUrl.hostname);
  if (!isBot(ua) && !request.cookies.has(SESSION_COOKIE) && !local) {
    await prisma.ad.update({ where: { id }, data: { clicks: { increment: 1 } } }).catch(() => undefined);
  }
  return NextResponse.redirect(ad.linkUrl, 302);
}
