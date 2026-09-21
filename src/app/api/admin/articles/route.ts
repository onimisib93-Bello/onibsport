import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { articleInputSchema } from "@/lib/validation/article";

export async function GET() {
  const articles = await prisma.article.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ articles });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = articleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const existing = await prisma.article.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ error: "An article with this slug already exists." }, { status: 409 });
  }

  const article = await prisma.article.create({
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
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });

  return NextResponse.json({ article }, { status: 201 });
}
