"use client";

import { useEffect, useState } from "react";

/**
 * Canvas and SVG-clip effects draw text themselves, so they need the real
 * (hashed) family name next/font gave Big Shoulders, and must wait until the
 * face has loaded or they would measure a fallback font. Returns null until then.
 */
export function useDisplayFont(weight = 900): string | null {
  const [family, setFamily] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const name = getComputedStyle(document.documentElement).getPropertyValue("--font-shoulders").trim();
    const settle = () => alive && setFamily(name || "Arial, sans-serif");
    const timeout = window.setTimeout(settle, 2000);
    document.fonts.load(`${weight} 64px ${name}`).finally(() => {
      window.clearTimeout(timeout);
      settle();
    });
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [weight]);
  return family;
}
