"use client";

import { useEffect, useRef } from "react";

/**
 * The site's pointer effects, driven by one listener for the whole page.
 * Elements opt in with data attributes (styles live in globals.css):
 *
 * - data-spot / data-glow   a floodlight glow / lit border that follows the pointer
 * - data-tilt="6"           tilts in 3D towards the pointer, by up to that many degrees
 * - data-parallax           gets --px / --py (-0.5 to 0.5) for children to drift against
 * - data-magnetic="10"      leans towards the pointer by up to that many pixels
 * - data-cursor="Read story" swaps in the round cursor badge with that label
 *
 * Only on devices with a mouse, and never when the reader asked for reduced
 * motion. It also flags <html data-scrolled> once the page has moved.
 */
export default function PointerFx() {
  const badge = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => root.toggleAttribute("data-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return () => window.removeEventListener("scroll", onScroll);

    let x = 0;
    let y = 0;
    let target: Element | null = null;
    let frame = 0;
    let tilted: HTMLElement | null = null;
    let pulled: HTMLElement | null = null;

    const release = (el: HTMLElement, props: string[]) => props.forEach((p) => el.style.removeProperty(p));

    const update = () => {
      frame = 0;
      const el = target;

      const lit = el?.closest<HTMLElement>("[data-spot],[data-glow]");
      if (lit) {
        const r = lit.getBoundingClientRect();
        lit.style.setProperty("--mx", `${x - r.left}px`);
        lit.style.setProperty("--my", `${y - r.top}px`);
      }

      const tilt = el?.closest<HTMLElement>("[data-tilt],[data-parallax]") ?? null;
      if (tilted && tilted !== tilt) release(tilted, ["--rx", "--ry", "--px", "--py"]);
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = (x - r.left) / r.width - 0.5;
        const py = (y - r.top) / r.height - 0.5;
        const max = Number(tilt.dataset.tilt) || 0;
        tilt.style.setProperty("--px", px.toFixed(3));
        tilt.style.setProperty("--py", py.toFixed(3));
        if (max) {
          tilt.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
          tilt.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
        }
      }
      tilted = tilt;

      const magnet = el?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (pulled && pulled !== magnet) release(pulled, ["--tx", "--ty"]);
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const pull = Number(magnet.dataset.magnetic) || 8;
        magnet.style.setProperty("--tx", `${(((x - r.left) / r.width - 0.5) * pull * 2).toFixed(1)}px`);
        magnet.style.setProperty("--ty", `${(((y - r.top) / r.height - 0.5) * pull * 2).toFixed(1)}px`);
      }
      pulled = magnet;

      const b = badge.current;
      if (b) {
        // Buttons and links inside a "Read story" area keep the normal cursor.
        const zone = el?.closest<HTMLElement>("[data-cursor]");
        const blocked = el?.closest("button, input, [data-no-cursor]");
        const show = !!zone && !blocked;
        if (show && label.current) label.current.textContent = zone!.dataset.cursor || "";
        b.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        b.toggleAttribute("data-on", show);
      }
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      target = e.target instanceof Element ? e.target : null;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onLeave = () => {
      target = null;
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    // A page change can leave the badge showing over nothing.
    window.addEventListener("pointerdown", onLeave, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={badge} aria-hidden="true" className="cursor-badge">
      <span className="cursor-badge-disc">
        <span ref={label} />
      </span>
    </div>
  );
}
