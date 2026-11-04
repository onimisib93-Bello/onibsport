import type { Article } from "@prisma/client";
import { after } from "next/server";
import type { ArticleInput } from "@/lib/validation/article";
import { sendDuePushes } from "@/lib/push";

/**
 * When a story goes live. A chosen date wins (a future one schedules it);
 * otherwise a story that is already live keeps its time and a new one goes
 * live now.
 */
function publishedAt(data: ArticleInput, existing?: Pick<Article, "publishedAt"> | null): Date | null {
  if (data.status !== "PUBLISHED") return existing?.publishedAt ?? null;
  if (data.publishAt) return new Date(data.publishAt);
  const now = new Date();
  if (existing?.publishedAt && existing.publishedAt <= now) return existing.publishedAt;
  return now;
}

/** The database fields for a saved story, from the editor's form. */
export function articleData(data: ArticleInput, existing?: Pick<Article, "publishedAt"> | null) {
  return {
    title: data.title,
    slug: data.slug,
    dek: data.dek,
    body: data.body,
    image: data.image,
    imageAlt: data.imageAlt,
    imageFocus: data.imageFocus || null,
    coverImage: data.coverImage || null,
    shareText: data.shareText?.trim() || null,
    keyPoints: (data.keyPoints ?? "")
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .join("\n"),
    author: data.author.trim(),
    source: data.source || null,
    tags: data.tags || "",
    isBreaking: !!data.isBreaking,
    featured: !!data.featured,
    featuredVideoUrl: data.featuredVideoUrl || null,
    status: data.status,
    categoryId: data.categoryId,
    publishedAt: publishedAt(data, existing),
  };
}

/** After a story is saved or published: send the breaking-news alert if one is due (after the response, so saving stays fast). */
export function afterArticleSaved() {
  after(() => sendDuePushes().catch(() => undefined));
}
