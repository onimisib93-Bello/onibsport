import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorInputSchema, authorSlug } from "@/lib/authors";

const TABLE_MISSING = "The Author table hasn't been created in the database yet. Run `npm run db:push` once, then try again.";

export async function GET() {
  try {
    return NextResponse.json({ authors: await prisma.author.findMany({ orderBy: { name: "asc" } }) });
  } catch {
    return NextResponse.json({ error: TABLE_MISSING }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const parsed = authorInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  const data = parsed.data;
  try {
    const slug = authorSlug(data.name);
    const taken = await prisma.author.findFirst({ where: { OR: [{ slug }, { name: { equals: data.name, mode: "insensitive" } }] } });
    if (taken) return NextResponse.json({ error: "There's already a profile for this writer." }, { status: 409 });
    const author = await prisma.author.create({
      data: { slug, name: data.name, role: data.role, bio: data.bio, photo: data.photo || null, xHandle: data.xHandle || null },
    });
    revalidatePath(`/author/${slug}`);
    return NextResponse.json({ author }, { status: 201 });
  } catch {
    return NextResponse.json({ error: TABLE_MISSING }, { status: 503 });
  }
}
