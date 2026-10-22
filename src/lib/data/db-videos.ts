import { prisma } from "@/lib/prisma";
import { videos as sampleVideos } from "@/lib/data/videos";
import { youTubeThumbnail, type SiteVideo } from "@/lib/videos";

type VideoRow = Awaited<ReturnType<typeof prisma.video.findMany>>[number];

export function toSiteVideo(row: VideoRow): SiteVideo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail || (row.youtubeId ? youTubeThumbnail(row.youtubeId) : "/covers/video-highlights-cover.jpg"),
    youtubeId: row.kind === "youtube" ? row.youtubeId : null,
    videoUrl: row.kind === "upload" ? row.videoUrl : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** The placeholder cards shown until the first video is added in the admin. */
function samples(): SiteVideo[] {
  return sampleVideos.map((v) => ({ id: v.slug, title: v.title, description: v.description, thumbnail: v.thumbnail, youtubeId: v.videoId ?? null }));
}

/**
 * Published videos, newest first. Falls back to the sample cards when none
 * have been added yet (or the Video table doesn't exist yet), so the Watch
 * section is never empty.
 */
export async function getPublishedVideos(limit?: number): Promise<SiteVideo[]> {
  try {
    const rows = await prisma.video.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: limit });
    if (rows.length) return rows.map(toSiteVideo);
  } catch {
    // Table not created yet, or the database is busy: show the placeholders.
  }
  const list = samples();
  return limit ? list.slice(0, limit) : list;
}

/** Every video for the admin, newest first. Null when the Video table doesn't exist yet. */
export async function getAllVideosForAdmin() {
  try {
    return await prisma.video.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return null;
  }
}
