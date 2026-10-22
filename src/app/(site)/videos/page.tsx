import type { Metadata } from "next";
import { YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import { getPublishedVideos } from "@/lib/data/db-videos";
import { YOUTUBE_CHANNEL_URL } from "@/lib/config";
import VideoGallery from "@/components/VideoGallery";
import AdSlot from "@/components/AdSlot";

export const revalidate = 300;

const description = "Football highlights, reaction and analysis from the Onibsport team: the Premier League, Europe, the NPFL and the Super Eagles.";

export const metadata: Metadata = {
  title: "Videos",
  description,
  alternates: { canonical: "/videos" },
  openGraph: { title: "Videos | Onibsport", description, type: "website", url: "/videos" },
};

export default async function VideosPage() {
  const videos = await getPublishedVideos();

  return (
    <>
      <section className="relative overflow-hidden bg-night px-4 pb-12 pt-12 text-white sm:px-6">
        <div className="pitch-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-6xl font-black leading-[0.85] sm:text-8xl">Watch</h1>
            <p className="mt-4 max-w-xl text-lg text-white/70">{description}</p>
          </div>
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-orange"
          >
            <YoutubeLogo size={18} weight="fill" className="text-[#ff0033]" aria-hidden="true" />
            Subscribe on YouTube
          </a>
        </div>
      </section>
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
        <VideoGallery videos={videos} />
        <AdSlot variant="leaderboard" className="mt-14" />
      </div>
    </>
  );
}
