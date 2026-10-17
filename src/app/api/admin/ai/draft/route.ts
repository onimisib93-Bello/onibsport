import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSourceQueue } from "@/lib/ai/alerts";
import { generateDraft, type InternalLink } from "@/lib/ai/draft";
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

function siteUrl() {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Hubs plus the latest published stories: the only pages the AI Desk may link to. */
async function internalLinkCandidates(): Promise<InternalLink[]> {
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
    ...categories.map((c) => ({ title: `${c.name} hub (news, results, fixtures, table)`, url: `${siteUrl()}/category/${c.slug}` })),
    { title: "Live scores, results and fixtures", url: `${siteUrl()}/live-scores` },
    ...recent.map((a) => ({ title: a.title, url: `${siteUrl()}/article/${a.slug}` })),
  ];
}

/** Turns absolute links to this site into relative ones so they survive a domain change. */
function relativiseInternalLinks(body: string) {
  return body.split(`](${siteUrl()}/`).join("](/");
}

export async function POST(request: NextRequest) {
  const { itemId } = await request.json().catch(() => ({}));
  const { items } = await getSourceQueue();
  const source = items.find((s) => s.id === itemId);
  if (!source) {
    return NextResponse.json({ error: "Unknown source item." }, { status: 400 });
  }

  let draft;
  try {
    draft = await generateDraft(source, await internalLinkCandidates());
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI Desk failed to generate a draft.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // The model picks the hub; fall back to the feed's suggestion if that row is missing.
  const category =
    (await prisma.category.findUnique({ where: { slug: draft.category } })) ??
    (await prisma.category.findUnique({ where: { slug: source.categorySlug } }));
  if (!category) {
    return NextResponse.json({ error: "Source category not found." }, { status: 400 });
  }

  let slug = slugify(draft.title);
  let suffix = 1;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${slugify(draft.title)}-${++suffix}`;
  }

  const imageSeed = CATEGORY_IMAGE_SEED[category.slug] ?? "pl-title-race";

  const article = await prisma.article.create({
    data: {
      title: draft.title,
      slug,
      dek: draft.dek,
      body: relativiseInternalLinks(draft.body),
      // A photo picked up from the source page is a suggestion for the editor to
      // clear or replace; the review screen flags it before publishing.
      image: draft.sourceImage ?? `/placeholders/${imageSeed}.jpg`,
      imageAlt: draft.imageAlt || draft.title,
      coverImage: draft.sourceImage ?? `/covers/${imageSeed}-cover.jpg`,
      author: "Onibsport AI Desk",
      source: draft.sourceOutlet,
      tags: draft.tags,
      status: "PENDING_REVIEW",
      categoryId: category.id,
    },
  });

  return NextResponse.json({ article, isStub: draft.isStub });
}
