import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SOURCE_QUEUE } from "@/lib/ai/queue";
import { generateDraft } from "@/lib/ai/draft";
import { slugify } from "@/lib/slugify";

const CATEGORY_IMAGE_SEED: Record<string, string> = {
  "premier-league": "pl-title-race",
  "la-liga": "laliga-derby",
  "serie-a": "seriea-keeper",
  bundesliga: "bundesliga-wonderkid",
  "champions-league": "ucl-comeback",
  "nigeria-football": "super-eagles-squad",
  npfl: "npfl-matchday",
  transfers: "transfer-domino",
};

export async function POST(request: NextRequest) {
  const { itemId } = await request.json().catch(() => ({}));
  const source = SOURCE_QUEUE.find((s) => s.id === itemId);
  if (!source) {
    return NextResponse.json({ error: "Unknown source item." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { slug: source.categorySlug } });
  if (!category) {
    return NextResponse.json({ error: "Source category not found." }, { status: 400 });
  }

  let draft;
  try {
    draft = await generateDraft(source);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI Desk failed to generate a draft.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let slug = slugify(draft.title);
  let suffix = 1;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${slugify(draft.title)}-${++suffix}`;
  }

  const imageSeed = CATEGORY_IMAGE_SEED[source.categorySlug] ?? "pl-title-race";

  const article = await prisma.article.create({
    data: {
      title: draft.title,
      slug,
      dek: draft.dek,
      body: draft.body,
      image: `/placeholders/${imageSeed}.jpg`,
      imageAlt: draft.title,
      coverImage: `/covers/${imageSeed}-cover.jpg`,
      author: "Onibsport AI Desk",
      source: source.sourceName,
      tags: draft.tags,
      status: "PENDING_REVIEW",
      categoryId: category.id,
    },
  });

  return NextResponse.json({ article, isStub: draft.isStub });
}
