import { NextRequest } from "next/server";
import { getArticleBySlug } from "@/lib/data/db-articles";
import { getCategory } from "@/lib/data/categories";
import { renderShareCard } from "@/lib/shareCard";

/**
 * A story's branded link-preview image (1200 × 630): the lead photo, headline,
 * league and Onibsport brand. Story pages point their og:image here unless the
 * editor uploaded their own share image (see lib/shareImage.ts). Cached at the
 * edge; the ?v= fingerprint changes when the headline or photo does.
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
    text: article.title,
    tag: getCategory(article.category)?.name,
    shape: "landscape",
    headers: cache,
  });
}
