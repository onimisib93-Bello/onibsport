import { prisma } from "@/lib/prisma";
import type { InternalLink } from "@/lib/ai/draft";

/**
 * The only Onibsport pages a rewrite may link to: every hub, the scores page
 * and the latest published stories. Paths are site-relative so links keep
 * working if the domain changes.
 */
export async function internalLinkCandidates(): Promise<InternalLink[]> {
  const [categories, recent] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, name: true } }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, title: true },
      orderBy: { publishedAt: "desc" },
      take: 15,
    }),
  ]);
  return [
    ...categories.map((c) => ({ title: `${c.name} hub (news, results, fixtures, table)`, url: `/category/${c.slug}` })),
    { title: "Live scores, results and fixtures", url: "/live-scores" },
    ...recent.map((a) => ({ title: a.title, url: `/article/${a.slug}` })),
  ];
}
