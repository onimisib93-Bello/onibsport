"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";
import { objectPosition } from "@/lib/focus";
import { FALLBACK_PHOTO, isOptimizable } from "@/lib/imageUrl";

/**
 * next/image for every news photo. Local files and Vercel Blob uploads go
 * through the optimizer; images hot-linked from other hosts (e.g. a source
 * photo picked up by the AI Desk) are served as-is, since next/image refuses
 * hosts that aren't listed in next.config.ts.
 *
 * If a photo fails to load (the source site blocks hot-linking, or the photo
 * store is unavailable) the Onibsport placeholder takes its place, so a card
 * never shows an empty box.
 *
 * focus: the photo's focal point ("x,y" percentages) picked in the editor,
 * kept in view when the photo is cropped.
 */
export default function NewsImage({ src, alt, unoptimized, focus, style, onError, ...props }: ImageProps & { focus?: string | null }) {
  // Remember which src failed, so a new src gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const failed = failedSrc === src;
  const position = objectPosition(focus);

  // A photo can fail before React has attached onError (it is in the server-rendered page); catch that on mount.
  const check = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && img.complete && img.naturalWidth === 0 && img.currentSrc) setFailedSrc(src);
    },
    [src]
  );

  return (
    <Image
      ref={check}
      src={failed ? FALLBACK_PHOTO : src}
      alt={alt}
      unoptimized={failed ? false : (unoptimized ?? !isOptimizable(src))}
      style={position && !failed ? { ...style, objectPosition: position } : style}
      onError={(event) => {
        if (!failed) setFailedSrc(src);
        onError?.(event);
      }}
      {...props}
    />
  );
}
