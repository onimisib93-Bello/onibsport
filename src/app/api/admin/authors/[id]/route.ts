import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorInputSchema, authorSlug } from "@/lib/authors";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = authorInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  const data = parsed.data;
  const existing = await prisma.author.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slug = authorSlug(data.name);
  const taken = await prisma.author.findFirst({ where: { NOT: { id }, OR: [{ slug }, { name: { equals: data.name, mode: "insensitive" } }] } });
  if (taken) return NextResponse.json({ error: "There's already a profile for this writer." }, { status: 409 });

  // Renaming a writer moves their existing bylines to the new name.
  const author = await prisma.$transaction(async (tx) => {
    if (existing.name !== data.name) await tx.article.updateMany({ where: { author: existing.name }, data: { author: data.name } });
    return tx.author.update({
      where: { id },
      data: { slug, name: data.name, role: data.role, bio: data.bio, photo: data.photo || null, xHandle: data.xHandle || null },
    });
  });
  revalidatePath(`/author/${existing.slug}`);
  revalidatePath(`/author/${slug}`);
  return NextResponse.json({ author });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.author.delete({ where: { id } }).catch(() => null);
  if (row) revalidatePath(`/author/${row.slug}`);
  return NextResponse.json({ ok: true });
}
