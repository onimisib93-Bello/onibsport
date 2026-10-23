import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { adStatus, type AdPlacement, type ServedAd } from "@/lib/ads";

export const ADS_TAG = "ads";

interface CachedAd extends ServedAd {
  placements: string[];
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

/**
 * Every switched-on ad, cached for a few minutes and shared by all pages so
 * the ad spaces don't each hit the database. The admin clears this cache
 * whenever an ad changes. Empty when the Ad table doesn't exist yet.
 */
const getLiveAds = unstable_cache(
  async (): Promise<CachedAd[]> => {
    try {
      const rows = await prisma.ad.findMany({
        where: { active: true },
        select: { id: true, imageUrl: true, mobileImageUrl: true, altText: true, placements: true, active: true, startsAt: true, endsAt: true },
      });
      return rows.map((r) => ({ ...r, startsAt: r.startsAt?.toISOString() ?? null, endsAt: r.endsAt?.toISOString() ?? null }));
    } catch {
      return [];
    }
  },
  ["live-ads"],
  { revalidate: 300, tags: [ADS_TAG] }
);

/** An ad for this space, or null to show the "Advertise here" placeholder. Several ads in one space take turns. */
export async function getAdFor(placement: AdPlacement): Promise<ServedAd | null> {
  const now = Date.now();
  const candidates = (await getLiveAds()).filter((ad) => ad.placements.includes(placement) && adStatus(ad, now) === "running");
  if (!candidates.length) return null;
  const ad = candidates[Math.floor(Math.random() * candidates.length)];
  return { id: ad.id, imageUrl: ad.imageUrl, mobileImageUrl: ad.mobileImageUrl, altText: ad.altText };
}

/** Every ad for the admin, newest first. Null when the Ad table doesn't exist yet. */
export async function getAllAdsForAdmin() {
  try {
    return await prisma.ad.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return null;
  }
}
