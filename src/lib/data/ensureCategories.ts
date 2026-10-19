import { prisma } from "@/lib/prisma";
import { categories } from "@/lib/data/categories";

let ensured: Promise<void> | null = null;

/**
 * Adds any hub listed in categories.ts that the database doesn't have yet
 * (e.g. a newly added hub), so the editor and the AI Desk can file stories
 * under it without running the seed script. Existing rows are left alone.
 * Runs once per server instance.
 */
export function ensureCategories(): Promise<void> {
  ensured ??= (async () => {
    const existing = await prisma.category.findMany({ select: { slug: true } });
    const have = new Set(existing.map((c) => c.slug));
    for (const c of categories.filter((c) => !have.has(c.slug))) {
      await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    }
  })().catch((err) => {
    ensured = null; // try again on the next request
    throw err;
  });
  return ensured;
}
