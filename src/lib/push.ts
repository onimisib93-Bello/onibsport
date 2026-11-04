import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Breaking-news alerts by Web Push. Readers opt in from the site (see
 * components/BreakingAlerts.tsx); when a story marked Breaking news goes live,
 * every subscribed browser gets one notification. Needs the VAPID key pair in
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY; without them alerts are off.
 */

/** Only stories that went live in the last few hours are sent, so ticking Breaking on an old story never alerts anyone. */
const FRESH_MS = 6 * 3600_000;

export function pushEnabled() {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function subject() {
  if (process.env.VAPID_SUBJECT) return process.env.VAPID_SUBJECT;
  const site = process.env.SITE_URL ?? "";
  return site.startsWith("https://") ? site : "https://onibsport-pq46.vercel.app";
}

function siteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
  image?: string;
  tag?: string;
}

async function broadcast(payload: PushPayload) {
  webpush.setVapidDetails(subject(), process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  const json = JSON.stringify(payload);
  let cursor: string | undefined;
  let sent = 0;
  for (;;) {
    const batch = await prisma.pushSubscription.findMany({
      take: 100,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });
    if (batch.length === 0) break;
    const gone: string[] = [];
    await Promise.allSettled(
      batch.map((s) =>
        webpush
          .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, json, { TTL: 6 * 3600, urgency: "high" })
          .then(() => sent++)
          .catch((err: { statusCode?: number }) => {
            // The browser unsubscribed or the subscription expired.
            if (err?.statusCode === 404 || err?.statusCode === 410) gone.push(s.id);
          })
      )
    );
    if (gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
    cursor = batch[batch.length - 1].id;
  }
  return sent;
}

/**
 * Sends the alert for any breaking story that has gone live but not been
 * alerted yet. Called after a story is saved, and from the page-view beacon so
 * scheduled breaking stories go out soon after their time.
 */
export async function sendDuePushes() {
  if (!pushEnabled()) return;
  const now = new Date();
  const due = await prisma.article.findMany({
    where: { status: "PUBLISHED", isBreaking: true, pushedAt: null, publishedAt: { lte: now, gte: new Date(now.getTime() - FRESH_MS) } },
    select: { id: true, slug: true, title: true, dek: true, image: true },
    orderBy: { publishedAt: "asc" },
    take: 3,
  });
  for (const story of due) {
    // Claim it first so two servers never send the same alert.
    const claimed = await prisma.article.updateMany({ where: { id: story.id, pushedAt: null }, data: { pushedAt: now } });
    if (claimed.count === 0) continue;
    const url = new URL(`/article/${story.slug}`, siteUrl());
    url.searchParams.set("utm_source", "push");
    url.searchParams.set("utm_medium", "notification");
    await broadcast({
      title: `Breaking: ${story.title}`,
      body: story.dek,
      url: url.toString(),
      image: new URL(story.image, siteUrl()).toString(),
      tag: story.slug,
    });
  }
}

/** The page-view beacon's check: at most once a minute per server. */
let lastCheck = 0;
export async function sendDuePushesThrottled() {
  if (!pushEnabled() || Date.now() - lastCheck < 60_000) return;
  lastCheck = Date.now();
  await sendDuePushes();
}
