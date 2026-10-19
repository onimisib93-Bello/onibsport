"use client";

import { useState, type ReactNode } from "react";
import { Pause, Play } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Seamless horizontal marquee. Content is rendered twice and shifted by half
 * its width. It pauses on hover and focus, has an explicit pause control,
 * and turns into a plain scrollable row when reduced motion is requested.
 */
export default function Marquee({
  children,
  seconds = 40,
  className,
  controlClassName,
  label,
}: {
  children: ReactNode;
  seconds?: number;
  className?: string;
  controlClassName?: string;
  label: string;
}) {
  const [paused, setPaused] = useState(false);

  return (
    <div className={cn("group/marquee relative flex min-w-0 flex-1 items-stretch", className)}>
      <div className="no-scrollbar relative min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto" role="region" aria-label={label}>
        <div
          className="flex h-full w-max group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused] motion-reduce:!animate-none"
          style={{ animation: `ticker ${seconds}s linear infinite`, animationPlayState: paused ? "paused" : undefined }}
        >
          <div className="flex shrink-0 items-stretch">{children}</div>
          <div className="flex shrink-0 items-stretch motion-reduce:hidden" aria-hidden="true" inert>
            {children}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? `Play ${label}` : `Pause ${label}`}
        aria-pressed={paused}
        className={cn("grid w-10 shrink-0 cursor-pointer place-items-center motion-reduce:hidden", controlClassName)}
      >
        {paused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
      </button>
    </div>
  );
}
