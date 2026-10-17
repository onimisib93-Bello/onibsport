"use client";

import type { CSSProperties, ReactNode } from "react";
import GlyphPortal from "@/components/ui/glyph-portal";
import { useDisplayFont } from "@/lib/useDisplayFont";

/**
 * Hub opening for the Nigerian desks: the camera flies through a letter of the
 * word and lands inside the lead photo, where the hub introduction waits.
 */
export default function HubPortal({
  word,
  image,
  deep,
  tint,
  eyebrow,
  children,
}: {
  word: string;
  image?: string;
  deep: string;
  tint: string;
  eyebrow: string;
  children: ReactNode;
}) {
  const family = useDisplayFont();

  if (!family) {
    return <div className="h-[min(720px,100svh)]" style={{ background: deep }} aria-hidden="true" />;
  }

  return (
    <div data-hub-portal style={{ fontFamily: "var(--font-archivo)" }}>
      <style>{`
        [data-hub-portal] [data-gp-caption]{inset:calc(var(--gp-word-bottom,50%) + 40px) 24px auto;justify-content:center;}
        [data-hub-portal] [data-gp-hint]{display:none;}
        [data-hub-portal] [data-gp-enter]{min-height:46px;padding:0 22px;gap:14px;background:${deep};border-radius:999px;color:#fff;font-size:14px;font-weight:700;}
        [data-hub-portal] [data-gp-enter]:hover{filter:brightness(1.2);}
        [data-hub-portal] [data-gp-touch-picker]{top:auto;bottom:18px;left:50%;}
        [data-hub-portal] [data-gp-content]{padding:clamp(5rem,12vh,8rem) clamp(1.25rem,5vw,5rem);}
      `}</style>
      <GlyphPortal
        word={word}
        fontFamily={family}
        fontWeight={900}
        scrollLength={2}
        enterLabel="Enter the hub"
        style={{ "--gp-paper": "#f3f4f8", "--gp-ink": "#15122a", "--gp-field": deep, "--gp-foreground": "#ffffff" } as CSSProperties}
        background={
          <div style={{ position: "absolute", inset: 0, transform: "scale(var(--gp-field-scale,1))", background: deep }}>
            {image && (
              // eslint-disable-next-line @next/next/no-img-element -- painted inside an SVG clip and scaled every frame
              <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 20%, ${deep} 95%)` }} />
          </div>
        }
        front={
          <p
            style={{ position: "absolute", left: 24, right: 24, bottom: "calc(100% - var(--gp-word-top,35%) + 28px)", margin: 0, textAlign: "center", color: "#5e5d74", fontSize: 15, fontWeight: 600 }}
          >
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: tint, marginRight: 8, verticalAlign: "middle" }} />
            {eyebrow}
          </p>
        }
      >
        {children}
      </GlyphPortal>
    </div>
  );
}
