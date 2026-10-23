/**
 * The site's ad spaces. Each <AdSlot placement="…"> on a page names one of
 * these; the admin's Ads page lets an ad be switched on in any space of its
 * size.
 */

export type AdSize = "leaderboard" | "rectangle" | "sidebar";

export const AD_SIZES: Record<AdSize, { label: string; dims: string; upload: string; aspect: string }> = {
  leaderboard: { label: "Wide banner", dims: "728 × 90", upload: "1456 × 180 pixels (or 728 × 90)", aspect: "aspect-[8/1] sm:aspect-[728/90]" },
  rectangle: { label: "Box", dims: "300 × 250", upload: "600 × 500 pixels (or 300 × 250)", aspect: "aspect-[300/250]" },
  sidebar: { label: "Tall", dims: "300 × 600", upload: "600 × 1200 pixels (or 300 × 600)", aspect: "aspect-[300/600]" },
};

export const AD_PLACEMENTS = [
  { id: "home-top", size: "leaderboard", label: "Homepage, under the match centre" },
  { id: "home-sidebar", size: "sidebar", label: "Homepage, beside the latest stories" },
  { id: "home-bottom", size: "leaderboard", label: "Homepage, near the bottom" },
  { id: "article-end", size: "leaderboard", label: "Every story, after the article" },
  { id: "article-sidebar", size: "rectangle", label: "Every story, in the sidebar" },
  { id: "hub-sidebar", size: "sidebar", label: "League hubs, in the sidebar" },
  { id: "scores", size: "leaderboard", label: "Scores & fixtures page" },
  { id: "match", size: "leaderboard", label: "Match pages" },
  { id: "videos", size: "leaderboard", label: "Videos page" },
] as const satisfies readonly { id: string; size: AdSize; label: string }[];

export type AdPlacement = (typeof AD_PLACEMENTS)[number]["id"];

export function placementSize(id: AdPlacement): AdSize {
  return AD_PLACEMENTS.find((p) => p.id === id)!.size;
}

/** An ad ready to show: what the slot needs to render it. */
export interface ServedAd {
  id: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  altText: string;
}

export type AdStatus = "running" | "scheduled" | "ended" | "paused";

export function adStatus(ad: { active: boolean; startsAt: Date | string | null; endsAt: Date | string | null }, now = Date.now()): AdStatus {
  if (!ad.active) return "paused";
  if (ad.startsAt && new Date(ad.startsAt).getTime() > now) return "scheduled";
  if (ad.endsAt && new Date(ad.endsAt).getTime() < now) return "ended";
  return "running";
}
