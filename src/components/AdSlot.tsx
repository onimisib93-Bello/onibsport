import { Megaphone } from "@phosphor-icons/react/dist/ssr";
import { AD_SIZES, placementSize, type AdPlacement, type AdSize, type ServedAd } from "@/lib/ads";
import { getAdFor } from "@/lib/data/db-ads";
import NewsImage from "@/components/ui/NewsImage";

/** A banner that links through the click counter. Shown whole on a white card, never cropped. */
export function AdBanner({ ad, size, className = "" }: { ad: ServedAd; size: AdSize; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-1 text-[11px] font-semibold text-muted">Advertisement</p>
      <a href={`/go/ad/${ad.id}`} target="_blank" rel="noopener sponsored" className="block overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        {ad.mobileImageUrl && (
          <NewsImage src={ad.mobileImageUrl} alt={ad.altText || "Advertisement"} width={640} height={200} sizes="100vw" className="block h-auto w-full sm:hidden" />
        )}
        <span className={`relative w-full ${AD_SIZES[size].aspect} ${ad.mobileImageUrl ? "hidden sm:block" : "block"}`}>
          <NewsImage
            src={ad.imageUrl}
            alt={ad.altText || "Advertisement"}
            fill
            sizes={size === "leaderboard" ? "(min-width: 1400px) 1400px, 100vw" : "300px"}
            className="object-contain"
          />
        </span>
      </a>
    </div>
  );
}

/**
 * One ad space. Shows the ad switched on for this placement in the admin
 * (Admin → Ads); when there isn't one, an "Advertise here" box that emails the
 * team. Clicks go through /go/ad/[id], which counts them before redirecting.
 */
export default async function AdSlot({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  const size = placementSize(placement);
  const { aspect, dims } = AD_SIZES[size];
  const ad = await getAdFor(placement);

  if (ad) return <AdBanner ad={ad} size={size} className={className} />;

  return (
    <div className={className}>
      <p className="mb-1 text-[11px] font-semibold text-muted">Advertisement</p>
      <a
        href="mailto:onibsport@gmail.com?subject=Advertise%20on%20Onibsport"
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/15 bg-white/60 text-center transition-colors hover:border-indigo hover:bg-indigo/5 ${aspect}`}
      >
        <Megaphone size={24} weight="light" className="text-muted" />
        <span className="px-4 text-xs font-semibold text-muted">Advertise your brand here</span>
        <span className="text-[11px] text-muted/70">{dims}</span>
      </a>
    </div>
  );
}
