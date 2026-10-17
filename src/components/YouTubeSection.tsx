"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Play, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";
import { VideoItem } from "@/lib/data/videos";
import { YOUTUBE_CHANNEL_URL } from "@/lib/config";
import NewsImage from "@/components/ui/NewsImage";
import VideoModal from "@/components/ui/VideoModal";

function withAutoplay(url: string) {
  return url + (url.includes("?") ? "&" : "?") + "autoplay=1";
}

function PlayBadge({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`grid ${large ? "h-20 w-20" : "h-12 w-12"} place-items-center rounded-full bg-orange text-ink shadow-[0_0_0_10px_rgb(247_148_29/0.25)] transition-transform duration-300 group-hover:scale-110`}
    >
      <Play size={large ? 30 : 20} weight="fill" />
    </span>
  );
}

/**
 * Videos: the featured video story large, channel uploads beside it. Both
 * open in a popup player; uploads without a video ID link out to the channel.
 */
export default function YouTubeSection({ videos, featured }: { videos: VideoItem[]; featured?: Article }) {
  const [playing, setPlaying] = useState<{ src: string; title: string } | null>(null);
  const close = useCallback(() => setPlaying(null), []);
  const hasFeature = !!featured?.featuredVideoUrl;

  return (
    <section id="videos" aria-labelledby="videos-title" className="relative overflow-hidden bg-night py-16 text-white">
      <div className="pitch-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="videos-title" className="font-display text-4xl font-black leading-none sm:text-5xl">
            Watch
          </h2>
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-orange"
          >
            <YoutubeLogo size={18} weight="fill" className="text-[#ff0033]" aria-hidden="true" />
            Our YouTube channel
          </a>
        </div>

        <div className={`mt-8 grid gap-6 ${hasFeature ? "lg:grid-cols-[1.6fr_1fr]" : ""}`}>
          {hasFeature && featured && (
            <div>
              <button
                type="button"
                onClick={() => setPlaying({ src: withAutoplay(featured.featuredVideoUrl!), title: featured.title })}
                className="group relative block aspect-video w-full cursor-pointer overflow-hidden rounded-3xl bg-night-2"
                aria-label={`Play video: ${featured.title}`}
              >
                <NewsImage
                  src={featured.coverImage || featured.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
                <span className="absolute inset-0 grid place-items-center">
                  <PlayBadge large />
                </span>
              </button>
              <p className="mt-4 text-sm font-bold text-orange">Featured video</p>
              <h3 className="mt-1 font-display text-3xl font-black leading-[1] sm:text-4xl">{featured.title}</h3>
              <p className="mt-2 max-w-2xl text-white/70">{featured.dek}</p>
              <Link
                href={`/article/${featured.slug}`}
                className="mt-4 inline-flex rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold ring-1 ring-white/20 hover:bg-white hover:text-ink"
              >
                Read the full story
              </Link>
            </div>
          )}

          <ul className={`grid content-start gap-3 ${hasFeature ? "" : "sm:grid-cols-3"}`}>
            {videos.map((video) => {
              const inner = (
                <>
                  <span className={`relative block aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-night-2 ${hasFeature ? "sm:w-44" : ""}`}>
                    <NewsImage
                      src={video.thumbnail}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 360px, 50vw"
                      className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 grid place-items-center">
                      <PlayBadge />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 block font-display text-xl font-extrabold leading-[1.05]">{video.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-white/60">{video.description}</span>
                    {!video.videoId && <span className="mt-1 block text-xs font-semibold text-white/45">Opens YouTube</span>}
                  </span>
                </>
              );
              const cls = `group flex w-full cursor-pointer flex-col gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-white/5 ${hasFeature ? "sm:flex-row sm:items-center" : ""}`;
              return (
                <li key={video.slug}>
                  {video.videoId ? (
                    <button
                      type="button"
                      className={cls}
                      onClick={() => setPlaying({ src: `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1`, title: video.title })}
                    >
                      {inner}
                    </button>
                  ) : (
                    <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className={cls}>
                      {inner}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <VideoModal src={playing?.src ?? null} title={playing?.title ?? ""} onClose={close} />
    </section>
  );
}
