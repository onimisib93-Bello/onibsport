/**
 * Which image a story shows when its link is shared (Facebook, X, WhatsApp,
 * LinkedIn): a share image the editor uploaded for it, or else the branded
 * Onibsport card drawn from the lead photo and headline (/og/[slug]).
 */

interface ShareableStory {
  slug: string;
  title: string;
  image: string;
  coverImage?: string | null;
  category?: string;
}

/** True when the editor uploaded their own share image (not the lead photo or a built-in placeholder). */
export function hasCustomShareImage(story: Pick<ShareableStory, "image" | "coverImage">): boolean {
  const cover = story.coverImage?.trim();
  return !!cover && cover !== story.image && !cover.startsWith("/covers/") && !cover.startsWith("/placeholders/");
}

/** A short fingerprint of what the card shows, so networks fetch a fresh card after an edit. */
function version(story: ShareableStory): string {
  let h = 5381;
  for (const ch of `${story.title}|${story.image}|${story.category ?? ""}`) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

/** The share image path for a story (relative; metadataBase makes it absolute). */
export function shareImageFor(story: ShareableStory): string {
  return hasCustomShareImage(story) ? story.coverImage!.trim() : `/og/${story.slug}?v=${version(story)}`;
}
