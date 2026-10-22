"use client";

import { useCallback, useState } from "react";
import { Play } from "@phosphor-icons/react/dist/ssr";
import { YOUTUBE_CHANNEL_URL } from "@/lib/config";
import { playSource, type SiteVideo } from "@/lib/videos";
import NewsImage from "@/components/ui/NewsImage";
import VideoModal from "@/components/ui/VideoModal";

/** Every video as a grid of cards; each opens in the popup player. */
export default function VideoGallery({ videos }: { videos: SiteVideo[] }) {
  const [playing, setPlaying] = useState<{ src: string; title: string; file: boolean } | null>(null);
  const close = useCallback(() => setPlaying(null), []);

  return (
    <>
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, i) => {
          const source = playSource(video);
          const card = (
            <>
              <span className="relative block aspect-video overflow-hidden rounded-2xl bg-night-2">
                <NewsImage
                  src={video.thumbnail}
                  alt=""
                  fill
                  priority={i < 3}
                  sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-night/60 to-transparent" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-orange text-ink shadow-[0_0_0_10px_rgb(247_148_29/0.25)] transition-transform duration-300 group-hover:scale-110">
                    <Play size={22} weight="fill" />
                  </span>
                </span>
              </span>
              <span className="mt-3 block font-display text-2xl font-black leading-[1.05] text-ink">{video.title}</span>
              {video.description && <span className="mt-1.5 line-clamp-2 block text-sm text-muted">{video.description}</span>}
              {!source && <span className="mt-1 block text-xs font-semibold text-muted">Opens YouTube</span>}
            </>
          );
          return (
            <li key={video.id}>
              {source ? (
                <button type="button" onClick={() => setPlaying({ ...source, title: video.title })} className="group block w-full cursor-pointer text-left" aria-label={`Play video: ${video.title}`}>
                  {card}
                </button>
              ) : (
                <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="group block">
                  {card}
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <VideoModal src={playing?.src ?? null} title={playing?.title ?? ""} file={playing?.file} onClose={close} />
    </>
  );
}
