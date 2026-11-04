import { NextRequest } from "next/server";
import { getArticleBySlug } from "@/lib/data/db-articles";
import { renderShareCard } from "@/lib/shareCard";
import { shareTextFor } from "@/lib/shareImage";
import { parseFocus } from "@/lib/focus";

/**
 * A story's branded link-preview image (1200 × 630): the lead photo with the
 * social headline (not the article title) in the Onibsport template. Story
 * pages point their og:image here unless the editor uploaded their own share
 * image (see lib/shareImage.ts). Cached at the edge; the ?v= fingerprint
 * changes when the headline, photo or focal point does.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const cache = { "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400" };

  if (!article) {
    return renderShareCard({ origin: request.nextUrl.origin, text: "Football news with an African lens", shape: "landscape", headers: cache });
  }
  return renderShareCard({
    origin: request.nextUrl.origin,
    image: article.image,
    text: shareTextFor(article),
    focus: parseFocus(article.imageFocus),
    shape: "landscape",
    headers: cache,
  });
}
