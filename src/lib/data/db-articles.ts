import type { Article as PrismaArticle, Category as PrismaCategory, Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { Article, CategorySlug } from "@/lib/types";

/**
 * The public site reads articles from here (the real Postgres DB the admin
 * CMS writes to) — never from src/lib/data/articles.ts, which is sample/seed
 * data only. Every query below is wrapped so a DB hiccup at build/request
 * time degrades to an empty result instead of crashing the page.
 */

type ArticleWithCategory = PrismaArticle & { category: PrismaCategory };

/**
 * Stories readers can see: published, and not scheduled for later. Built per
 * call so "now" is current; pages revalidate every minute, so a scheduled
 * story appears within about a minute of its time.
 */
function live(): Prisma.ArticleWhereInput {
  return { status: "PUBLISHED", OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] };
}

function toArticle(row: ArticleWithCategory): Article {
  return {
    slug: row.slug,
    title: row.title,
    dek: row.dek,
    category: row.category.slug as CategorySlug,
    author: row.author,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    image: row.image,
    imageAlt: row.imageAlt,
    imageFocus: row.imageFocus ?? undefined,
    coverImage: row.coverImage || row.image,
    shareText: row.shareText ?? undefined,
    keyPoints: row.keyPoints
      .split("\n")
      .map((p) => p.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean),
    body: row.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    tags: row.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    isBreaking: row.isBreaking,
    featured: row.featured,
    featuredVideoUrl: row.featuredVideoUrl ?? undefined,
    source: row.source ?? undefined,
    status: "published",
  };
}

export async function getLatestArticles(limit = 12): Promise<Article[]> {
  try {
    const rows = await prisma.article.findMany({
      where: live(),
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map(toArticle);
  } catch {
    return [];
  }
}

export async function getFeaturedArticles(limit = 6): Promise<Article[]> {
  try {
    const rows = await prisma.article.findMany({
      where: { ...live(), featured: true },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map(toArticle);
  } catch {
    return [];
  }
}

export async function getArticlesByCategory(slug: string, limit = 40): Promise<Article[]> {
  try {
    const rows = await prisma.article.findMany({
      where: { ...live(), category: { slug } },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map(toArticle);
  } catch {
    return [];
  }
}

// Wrapped in cache() so generateMetadata and the page share one query per request.
export const getArticleBySlug = cache(async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  try {
    const row = await prisma.article.findFirst({
      where: { ...live(), slug },
      include: { category: true },
    });
    return row ? toArticle(row) : undefined;
  } catch {
    return undefined;
  }
});

export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  try {
    const rows = await prisma.article.findMany({
      where: {
        ...live(),
        slug: { not: article.slug },
        category: { slug: article.category },
      },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map(toArticle);
  } catch {
    return [];
  }
}

// Shared between the layout and pages within one request.
export const getFirstBreakingArticle = cache(async function getFirstBreakingArticle(): Promise<Article | undefined> {
  try {
    const row = await prisma.article.findFirst({
      where: { ...live(), isBreaking: true },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
    });
    return row ? toArticle(row) : undefined;
  } catch {
    return undefined;
  }
});

export async function getFeaturedVideoArticle(): Promise<Article | undefined> {
  try {
    const row = await prisma.article.findFirst({
      where: { ...live(), featuredVideoUrl: { not: null } },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
    });
    return row ? toArticle(row) : undefined;
  } catch {
    return undefined;
  }
}

export async function searchArticles(query: string, limit = 30): Promise<Article[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const rows = await prisma.article.findMany({
      where: {
        AND: [
          live(),
          {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { dek: { contains: q, mode: "insensitive" } },
              { tags: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map(toArticle);
  } catch {
    return [];
  }
}

export async function getArticlesByAuthor(name: string, limit = 40): Promise<Article[]> {
  try {
    const rows = await prisma.article.findMany({
      where: { ...live(), author: { equals: name, mode: "insensitive" } },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map(toArticle);
  } catch {
    return [];
  }
}

export async function getAllPublishedForSitemap(): Promise<{ slug: string; publishedAt: Date | null; updatedAt: Date; author: string }[]> {
  try {
    return await prisma.article.findMany({
      where: live(),
      select: { slug: true, publishedAt: true, updatedAt: true, author: true },
    });
  } catch {
    return [];
  }
}
