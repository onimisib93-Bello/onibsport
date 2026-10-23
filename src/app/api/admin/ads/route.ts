import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADS_TAG } from "@/lib/data/db-ads";
import { adDates, adInputSchema } from "@/lib/validation/ad";

const TABLE_MISSING = "The Ad table hasn't been created in the database yet. Run `npm run db:push` once, then try again.";

export async function GET() {
  try {
    return NextResponse.json({ ads: await prisma.ad.findMany({ orderBy: { createdAt: "desc" } }) });
  } catch {
    return NextResponse.json({ error: TABLE_MISSING }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const parsed = adInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });

  const { startsAt, endsAt, mobileImageUrl, ...data } = parsed.data;
  try {
    const ad = await prisma.ad.create({ data: { ...data, mobileImageUrl: mobileImageUrl || null, ...adDates({ startsAt, endsAt }) } });
    revalidateTag(ADS_TAG, { expire: 0 });
    return NextResponse.json({ ad }, { status: 201 });
  } catch {
    return NextResponse.json({ error: TABLE_MISSING }, { status: 503 });
  }
}
