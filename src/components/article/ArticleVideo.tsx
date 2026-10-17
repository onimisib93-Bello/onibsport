"use client";

import { useState } from "react";
import { Play } from "@phosphor-icons/react/dist/ssr";
import NewsImage from "@/components/ui/NewsImage";

/** Poster first; the embed only loads (and plays) when the reader asks for it. */
export default function ArticleVideo({ src, title, poster }: { src: string; title: string; poster: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl bg-night">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src + (src.includes("?") ? "&" : "?") + "autoplay=1"}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 cursor-pointer" aria-label={`Play video: ${title}`}>
          <NewsImage src={poster} alt="" fill priority sizes="(min-width: 1100px) 1100px, 100vw" className="object-cover opacity-75 transition-transform duration-700 group-hover:scale-[1.03]" />
          <span className="absolute inset-0 bg-gradient-to-t from-night/80 to-transparent" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-24 w-24 place-items-center rounded-full bg-orange text-ink shadow-[0_0_0_14px_rgb(247_148_29/0.25)] transition-transform duration-300 group-hover:scale-110">
              <Play size={36} weight="fill" />
            </span>
          </span>
          <span className="absolute bottom-5 left-6 text-sm font-bold text-white">Watch the video</span>
        </button>
      )}
    </div>
  );
}
