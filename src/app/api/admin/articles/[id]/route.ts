import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { articleInputSchema } from "@/lib/validation/article";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id }, include: { category: true } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = articleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slugTaken = await prisma.article.findFirst({ where: { slug: data.slug, NOT: { id } } });
  if (slugTaken) {
    return NextResponse.json({ error: "An article with this slug already exists." }, { status: 409 });
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      dek: data.dek,
      body: data.body,
      image: data.image,
      imageAlt: data.imageAlt,
      coverImage: data.coverImage || data.image,
      author: data.author,
      source: data.source || null,
      tags: data.tags || "",
      isBreaking: !!data.isBreaking,
      featuredVideoUrl: data.featuredVideoUrl || null,
      status: data.status,
      categoryId: data.categoryId,
      publishedAt: data.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
    },
  });

  return NextResponse.json({ article });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.article.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
