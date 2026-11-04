import type { MetadataRoute } from "next";
import { getAllPublishedForSitemap } from "@/lib/data/db-articles";
import { categories } from "@/lib/data/categories";
import { authorSlug } from "@/lib/authors";

function siteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/live-scores`, changeFrequency: "always", priority: 0.8 },
    { url: `${base}/videos`, changeFrequency: "daily", priority: 0.6 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  const published = await getAllPublishedForSitemap();
  const articleRoutes: MetadataRoute.Sitemap = published.map((a) => ({
    url: `${base}/article/${a.slug}`,
    lastModified: a.updatedAt > (a.publishedAt ?? a.updatedAt) ? a.updatedAt : (a.publishedAt ?? undefined),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const authorRoutes: MetadataRoute.Sitemap = [...new Set(published.map((a) => authorSlug(a.author)))].map((slug) => ({
    url: `${base}/author/${slug}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes, ...authorRoutes];
}
