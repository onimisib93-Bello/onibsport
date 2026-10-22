import type { Metadata } from "next";
import { getAllVideosForAdmin } from "@/lib/data/db-videos";
import VideoManager, { type AdminVideo } from "@/components/admin/VideoManager";

export const metadata: Metadata = { title: "Videos" };
export const dynamic = "force-dynamic";

export default async function VideosAdminPage() {
  const rows = await getAllVideosForAdmin();
  const videos: AdminVideo[] = (rows ?? []).map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    kind: v.kind,
    youtubeId: v.youtubeId,
    videoUrl: v.videoUrl,
    thumbnail: v.thumbnail,
    published: v.published,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="font-display text-4xl font-black text-ink">Videos</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Videos added here appear in the Watch section on the homepage and on the Videos page. Paste a YouTube link, or upload a short clip from your computer.
      </p>
      <div className="mt-8">
        <VideoManager videos={videos} tableReady={rows !== null} />
      </div>
    </div>
  );
}
