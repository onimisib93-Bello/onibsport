import type { Metadata } from "next";
import { getAllAdsForAdmin } from "@/lib/data/db-ads";
import AdManager, { type AdminAd } from "@/components/admin/AdManager";
import { AD_PLACEMENTS } from "@/lib/ads";

export const metadata: Metadata = { title: "Ads" };
export const dynamic = "force-dynamic";

export default async function AdsAdminPage() {
  const rows = await getAllAdsForAdmin();
  const ads: AdminAd[] = (rows ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    size: a.size,
    imageUrl: a.imageUrl,
    mobileImageUrl: a.mobileImageUrl,
    linkUrl: a.linkUrl,
    altText: a.altText,
    placements: a.placements,
    startsAt: a.startsAt?.toISOString() ?? null,
    endsAt: a.endsAt?.toISOString() ?? null,
    active: a.active,
    clicks: a.clicks,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="font-display text-4xl font-black text-ink">Ads</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Put a banner in any of the site&apos;s {AD_PLACEMENTS.length} ad spaces: upload the image, paste the link it should open, and tick where it shows. Clicks are counted so you can report them to advertisers.
      </p>
      <div className="mt-8">
        <AdManager ads={ads} tableReady={rows !== null} />
      </div>
    </div>
  );
}
