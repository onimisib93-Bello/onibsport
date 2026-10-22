import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseYouTubeId } from "@/lib/videos";
import { videoInputSchema } from "@/lib/validation/video";

const TABLE_MISSING =
  "The Video table hasn't been created in the database yet. Run `npm run db:push` once, then try again.";

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export async function GET() {
  try {
    const videos = await prisma.video.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ error: TABLE_MISSING }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const parsed = videoInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const data = parsed.data;
  try {
    const video = await prisma.video.create({
      data: {
        title: data.title,
        description: data.description,
        kind: data.kind,
        youtubeId: data.kind === "youtube" ? parseYouTubeId(data.youtubeUrl ?? "") : null,
        videoUrl: data.kind === "upload" ? data.videoUrl : null,
        thumbnail: data.thumbnail || null,
        published: data.published,
      },
    });
    revalidatePath("/");
    revalidatePath("/videos");
    return NextResponse.json({ video }, { status: 201 });
  } catch {
    return NextResponse.json({ error: TABLE_MISSING }, { status: 503 });
  }
}
