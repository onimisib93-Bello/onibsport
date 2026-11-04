"use client";

import NewsImage from "@/components/ui/NewsImage";
import { formatFocus, objectPosition, parseFocus } from "@/lib/focus";

/**
 * Click the part of the lead photo that must always stay in view (usually a
 * face). Cards, the homepage slideshow and the share images crop around it.
 * Arrow keys move the point for keyboard users.
 */
export default function FocalPointPicker({ src, value, onChange }: { src: string; value: string; onChange: (value: string) => void }) {
  const point = parseFocus(value) ?? { x: 50, y: 30 };

  function pick(e: React.MouseEvent<HTMLButtonElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    onChange(formatFocus({ x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 }));
  }

  function nudge(e: React.KeyboardEvent<HTMLButtonElement>) {
    const step = e.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    onChange(formatFocus({ x: Math.min(100, Math.max(0, point.x + move[0])), y: Math.min(100, Math.max(0, point.y + move[1])) }));
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Focal point</p>
        {value && (
          <button type="button" onClick={() => onChange("")} className="cursor-pointer text-xs font-semibold text-muted hover:text-ink">
            Reset
          </button>
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted">Click the part of the photo that must always stay in view, like a player&apos;s face.</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
        <button
          type="button"
          onClick={pick}
          onKeyDown={nudge}
          aria-label={`Focal point: ${point.x}% across, ${point.y}% down. Click the photo or use the arrow keys to move it.`}
          className="relative block aspect-[4/3] w-full cursor-crosshair overflow-hidden rounded-xl bg-night focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo/30"
        >
          <NewsImage src={src} alt="" fill sizes="400px" className="object-contain" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(18,10,51,0.6)]"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange" />
          </span>
        </button>
        {/* How the crop lands on a wide card and a tall one. */}
        <div className="flex gap-2 sm:flex-col">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-line">
            <NewsImage src={src} alt="" fill sizes="120px" className="object-cover" style={{ objectPosition: objectPosition(formatFocus(point)) }} />
          </div>
          <div className="relative aspect-[4/5] w-2/3 overflow-hidden rounded-lg bg-line sm:w-full">
            <NewsImage src={src} alt="" fill sizes="120px" className="object-cover" style={{ objectPosition: objectPosition(formatFocus(point)) }} />
          </div>
        </div>
      </div>
    </div>
  );
}
