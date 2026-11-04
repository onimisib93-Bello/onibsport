import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { afterArticleSaved } from "@/lib/articleSave";

/** One action on several stories at once, from the Articles list. */
const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(["publish", "draft", "feature", "unfeature", "unbreak", "move", "delete"]),
  categoryId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick some stories and an action." }, { status: 400 });
  const { ids, action, categoryId } = parsed.data;
  const where = { id: { in: ids } };

  let count = 0;
  switch (action) {
    case "publish": {
      // Stories that already have a time (live or scheduled) keep it; the rest go live now.
      const [kept, fresh] = await prisma.$transaction([
        prisma.article.updateMany({ where: { ...where, publishedAt: { not: null } }, data: { status: "PUBLISHED" } }),
        prisma.article.updateMany({ where: { ...where, publishedAt: null }, data: { status: "PUBLISHED", publishedAt: new Date() } }),
      ]);
      count = kept.count + fresh.count;
      afterArticleSaved();
      break;
    }
    case "draft":
      count = (await prisma.article.updateMany({ where, data: { status: "DRAFT" } })).count;
      break;
    case "feature":
    case "unfeature":
      count = (await prisma.article.updateMany({ where, data: { featured: action === "feature" } })).count;
      break;
    case "unbreak":
      count = (await prisma.article.updateMany({ where, data: { isBreaking: false } })).count;
      break;
    case "move": {
      const category = categoryId ? await prisma.category.findUnique({ where: { id: categoryId } }) : null;
      if (!category) return NextResponse.json({ error: "Pick a hub to move them to." }, { status: 400 });
      count = (await prisma.article.updateMany({ where, data: { categoryId: category.id } })).count;
      break;
    }
    case "delete":
      count = (await prisma.article.deleteMany({ where })).count;
      break;
  }
  return NextResponse.json({ ok: true, count });
}
