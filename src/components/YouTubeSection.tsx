import Image from "next/image";
import { PlayCircle, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import { VideoItem } from "@/lib/data/videos";
import { YOUTUBE_CHANNEL_URL } from "@/lib/config";
import Reveal from "@/components/motion/Reveal";

function videoHref(video: VideoItem) {
  return video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : YOUTUBE_CHANNEL_URL;
}

export default function YouTubeSection({ videos }: { videos: VideoItem[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between border-b-2 border-orange pb-3">
        <h2 className="font-display text-3xl tracking-wide text-ink">Watch on YouTube</h2>
        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold text-indigo hover:text-orange"
        >
          <YoutubeLogo size={18} weight="fill" />
          Visit our channel
        </a>
      </div>

      <Reveal stagger className="mt-6 grid gap-6 sm:grid-cols-3">
        {videos.map((video) => (
          <a
            key={video.slug}
            href={videoHref(video)}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle size={56} weight="fill" className="text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
            <h3 className="mt-3 line-clamp-2 font-semibold text-ink group-hover:text-indigo">{video.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{video.description}</p>
          </a>
        ))}
      </Reveal>
    </section>
  );
}
