import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADS_TAG } from "@/lib/data/db-ads";
import { adDates, adInputSchema, adToggleSchema } from "@/lib/validation/ad";

type Params = { params: Promise<{ id: string }> };

/** Full edit from the form. */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const parsed = adInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  if (!(await prisma.ad.findUnique({ where: { id } }))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { startsAt, endsAt, mobileImageUrl, ...data } = parsed.data;
  const ad = await prisma.ad.update({ where: { id }, data: { ...data, mobileImageUrl: mobileImageUrl || null, ...adDates({ startsAt, endsAt }) } });
  revalidateTag(ADS_TAG, { expire: 0 });
  return NextResponse.json({ ad });
}

/** Pause or resume. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const parsed = adToggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  if (!(await prisma.ad.findUnique({ where: { id } }))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ad = await prisma.ad.update({ where: { id }, data: { active: parsed.data.active } });
  revalidateTag(ADS_TAG, { expire: 0 });
  return NextResponse.json({ ad });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!(await prisma.ad.findUnique({ where: { id } }))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.ad.delete({ where: { id } });
  revalidateTag(ADS_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
