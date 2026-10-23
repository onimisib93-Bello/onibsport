import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Removes an alert feed that was added on the AI Desk. Feeds in the Vercel setting are changed there. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feed = await prisma.alertFeed.findUnique({ where: { id } }).catch(() => null);
  if (!feed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.alertFeed.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
