import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { videoUpdateSchema } from "@/lib/validation/video";

function refreshSite() {
  revalidatePath("/");
  revalidatePath("/videos");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = videoUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update." }, { status: 400 });

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { thumbnail, ...rest } = parsed.data;
  const video = await prisma.video.update({
    where: { id },
    data: { ...rest, ...(thumbnail !== undefined ? { thumbnail: thumbnail || null } : {}) },
  });
  refreshSite();
  return NextResponse.json({ video });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.video.delete({ where: { id } });
  // Free the storage an uploaded file used. Best-effort: the video is already off the site.
  for (const url of [existing.kind === "upload" ? existing.videoUrl : null, existing.thumbnail]) {
    if (url && new URL(url, "https://x").hostname.endsWith(".public.blob.vercel-storage.com")) {
      await del(url).catch(() => undefined);
    }
  }
  refreshSite();
  return NextResponse.json({ ok: true });
}
