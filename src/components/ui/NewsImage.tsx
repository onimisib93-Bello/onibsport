import Image, { type ImageProps } from "next/image";
import { objectPosition } from "@/lib/focus";

/**
 * next/image for every news photo. Local files and Vercel Blob uploads go
 * through the optimizer; images hot-linked from other hosts (e.g. a source
 * photo picked up by the AI Desk) are served as-is, since next/image refuses
 * hosts that aren't listed in next.config.ts.
 */
function isOptimizable(src: ImageProps["src"]) {
  if (typeof src !== "string") return true;
  if (src.startsWith("/")) return true;
  try {
    return new URL(src).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** focus: the photo's focal point ("x,y" percentages) picked in the editor, kept in view when the photo is cropped. */
export default function NewsImage({ src, alt, unoptimized, focus, style, ...props }: ImageProps & { focus?: string | null }) {
  const position = objectPosition(focus);
  return <Image src={src} alt={alt} unoptimized={unoptimized ?? !isOptimizable(src)} style={position ? { ...style, objectPosition: position } : style} {...props} />;
}
