import Image from "next/image";
import { Megaphone } from "@phosphor-icons/react/dist/ssr";

export type AdVariant = "leaderboard" | "rectangle" | "sidebar";

const sizes: Record<AdVariant, { aspect: string; label: string }> = {
  leaderboard: { aspect: "aspect-[8/1] sm:aspect-[728/90]", label: "728×90" },
  rectangle: { aspect: "aspect-[300/250]", label: "300×250" },
  sidebar: { aspect: "aspect-[300/600]", label: "300×600" },
};

interface AdSlotProps {
  variant?: AdVariant;
  /** Once you have a real banner (your own brand promo, or a paid/affiliate creative), pass its image + destination here. */
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
  className?: string;
}

/**
 * Placeholder ad unit. Swap the empty-state branch for a real ad network
 * snippet (e.g. Google AdSense's <ins> tag) or pass imageSrc/href for a
 * direct-sold or affiliate banner.
 */
export default function AdSlot({ variant = "rectangle", imageSrc, imageAlt, href, className = "" }: AdSlotProps) {
  const { aspect, label } = sizes[variant];

  if (imageSrc && href) {
    return (
      <div className={className}>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Advertisement</p>
        <a href={href} target="_blank" rel="noopener noreferrer sponsored" className={`relative block w-full overflow-hidden rounded-lg ${aspect}`}>
          <Image src={imageSrc} alt={imageAlt ?? "Advertisement"} fill sizes="100vw" className="object-cover" />
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Advertisement</p>
      <a
        href="mailto:onibsport@gmail.com?subject=Advertise%20on%20Onibsport"
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-paper text-center transition-colors hover:border-indigo hover:bg-indigo/5 ${aspect}`}
      >
        <Megaphone size={24} weight="light" className="text-muted" />
        <span className="px-4 text-xs font-semibold text-muted">Advertise your brand here</span>
        <span className="text-[11px] text-muted/70">{label}</span>
      </a>
    </div>
  );
}
