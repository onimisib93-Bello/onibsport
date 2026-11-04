import { prisma } from "@/lib/prisma";

/**
 * Google News sitemap: stories published in the last two days (Google News
 * only reads those), with the publication name, language and headline.
 * Listed in robots.txt next to the main sitemap; submit both in Search Console.
 */

export const revalidate = 300;

function siteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

function xml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const now = new Date();
  const rows = await prisma.article
    .findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: now, gte: new Date(now.getTime() - 48 * 3600_000) } },
      select: { slug: true, title: true, publishedAt: true, tags: true },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    })
    .catch(() => []);

  const base = siteUrl();
  const urls = rows
    .map(
      (a) => `  <url>
    <loc>${xml(`${base}/article/${a.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>Onibsport</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${a.publishedAt!.toISOString()}</news:publication_date>
      <news:title>${xml(a.title)}</news:title>${a.tags.trim() ? `\n      <news:keywords>${xml(a.tags)}</news:keywords>` : ""}
    </news:news>
  </url>`
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
