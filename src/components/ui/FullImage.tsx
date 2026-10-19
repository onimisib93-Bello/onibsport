import NewsImage from "@/components/ui/NewsImage";
import { cn } from "@/lib/utils";

/**
 * A story photo shown whole, at its own proportions. Wide photos fill the
 * column; tall ones are capped at most of the screen height and centred on a
 * blurred copy of themselves, so nothing is ever cropped.
 */
export default function FullImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  /** Rendered width hint for next/image, e.g. "(min-width: 1100px) 1100px, 100vw". */
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-night", className)}>
      {/* A tiny, blurred copy fills any space beside a tall photo. */}
      <NewsImage src={src} alt="" aria-hidden="true" fill sizes="64px" className="scale-110 object-cover opacity-60 blur-2xl" />
      <NewsImage
        src={src}
        alt={alt}
        // Placeholder ratio before the photo loads; the real proportions take over once it has.
        width={1600}
        height={900}
        priority={priority}
        sizes={sizes}
        className="relative mx-auto block h-auto max-h-[80vh] w-auto max-w-full"
      />
    </div>
  );
}
