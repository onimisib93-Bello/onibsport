"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Horizontal row that swipes on touch and scroll-snaps, with arrow buttons
 * for mouse and keyboard users. Arrows hide at either end.
 */
export default function SwipeRow({ children, label, className, tone = "light" }: { children: ReactNode; label: string; className?: string; tone?: "light" | "dark" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    read();
    el.addEventListener("scroll", read, { passive: true });
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", read);
      ro.disconnect();
    };
  }, []);

  function nudge(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const btn = cn(
    "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full shadow-lg transition-opacity sm:grid",
    tone === "dark" ? "bg-white text-ink" : "bg-night text-white"
  );

  return (
    <div className={cn("relative", className)}>
      <div ref={ref} role="region" aria-label={label} tabIndex={0} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 focus-visible:outline-offset-4">
        {children}
      </div>
      <button type="button" aria-label="Scroll left" onClick={() => nudge(-1)} className={cn(btn, "-left-4", edges.start && "pointer-events-none opacity-0")}>
        <CaretLeft size={18} weight="bold" />
      </button>
      <button type="button" aria-label="Scroll right" onClick={() => nudge(1)} className={cn(btn, "-right-4", edges.end && "pointer-events-none opacity-0")}>
        <CaretRight size={18} weight="bold" />
      </button>
    </div>
  );
}
