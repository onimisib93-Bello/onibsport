"use client";

import { useEffect, useState } from "react";
import NewsImage from "@/components/ui/NewsImage";
import { cn } from "@/lib/utils";

type Shape = "link" | "square" | "portrait" | "story";
type Fit = "whole" | "fill";

const SHAPES: { id: Shape; label: string; aspect: string; frame: string; note: string }[] = [
  {
    id: "portrait",
    label: "Portrait 4:5",
    aspect: "aspect-[4/5]",
    frame: "max-w-[320px]",
    note: "Instagram, Facebook and Threads photo posts. 1080×1350 works best.",
  },
  {
    id: "story",
    label: "Story 9:16",
    aspect: "aspect-[9/16]",
    frame: "max-w-[240px]",
    note: "Stories, Reels, TikTok and WhatsApp Status. 1080×1920 works best.",
  },
  {
    id: "square",
    label: "Square",
    aspect: "aspect-square",
    frame: "max-w-[340px]",
    note: "Square feed posts on Instagram and Facebook. 1080×1080 works best.",
  },
  {
    id: "link",
    label: "Link preview",
    aspect: "aspect-[1200/630]",
    frame: "max-w-full",
    note: "How Facebook, X, WhatsApp and LinkedIn show a shared link. They crop the share image to this wide shape, so keep the important part in the middle.",
  },
];

const STORAGE_KEY = "onibsport-social-card-view";

/**
 * Preview of the story's share image in the shapes the networks use. "Whole
 * photo" shows the entire image on a blurred backdrop so nothing is hidden;
 * "Fill" shows how a network would crop it to fill the frame.
 */
export default function SocialCardPreview({ image, title, dek }: { image: string; title: string; dek: string }) {
  const [view, setView] = useState<{ shape: Shape; fit: Fit }>({ shape: "portrait", fit: "whole" });
  const { shape, fit } = view;

  // Remember the last view in this browser.
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as { shape?: Shape; fit?: Fit } | null;
        setView((v) => ({
          shape: saved?.shape && SHAPES.some((s) => s.id === saved.shape) ? saved.shape : v.shape,
          fit: saved?.fit === "whole" || saved?.fit === "fill" ? saved.fit : v.fit,
        }));
      } catch {
        // Ignore unreadable storage.
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  function choose(next: { shape?: Shape; fit?: Fit }) {
    setView((v) => {
      const value = { ...v, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // Best-effort only.
      }
      return value;
    });
  }

  const current = SHAPES.find((s) => s.id === shape)!;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Image shape" className="flex flex-wrap gap-1">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={shape === s.id}
              onClick={() => choose({ shape: s.id })}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                shape === s.id ? "bg-night text-white" : "bg-paper text-ink/70 hover:text-ink"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Photo fit" className="ml-auto flex rounded-full bg-paper p-0.5">
          {(
            [
              ["whole", "Whole photo"],
              ["fill", "Fill"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={fit === id}
              onClick={() => choose({ fit: id })}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                fit === id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("mx-auto mt-3 overflow-hidden rounded-xl ring-1 ring-line", current.frame)}>
        <div className={cn("relative bg-line", current.aspect)}>
          {image ? (
            fit === "whole" ? (
              <>
                {/* Blurred copy fills the frame so the whole photo can sit on top uncropped. */}
                <NewsImage src={image} alt="" fill sizes="340px" className="scale-110 object-cover opacity-70 blur-xl" aria-hidden="true" />
                <NewsImage src={image} alt="" fill sizes="340px" className="object-contain" />
              </>
            ) : (
              <NewsImage src={image} alt="" fill sizes="440px" className="object-cover" />
            )
          ) : (
            <p className="absolute inset-0 grid place-items-center text-sm text-muted">Add a photo to preview it</p>
          )}
        </div>
        {shape === "link" && (
          <div className="bg-paper p-3">
            <p className="text-xs uppercase text-muted">onibsport.com</p>
            <p className="mt-0.5 line-clamp-2 font-semibold text-ink">{title || "Your headline"}</p>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted">{dek}</p>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">{current.note}</p>
    </div>
  );
}
