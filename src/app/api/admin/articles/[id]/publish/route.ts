import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const article = await prisma.article.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date() },
  });

  return NextResponse.json({ article });
}
