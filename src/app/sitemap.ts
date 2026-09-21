import type { MetadataRoute } from "next";
import { articles } from "@/lib/data/articles";
import { categories } from "@/lib/data/categories";

function siteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/live-scores`, changeFrequency: "always", priority: 0.8 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles
    .filter((a) => a.status === "published")
    .map((a) => ({
      url: `${base}/article/${a.slug}`,
      lastModified: a.publishedAt,
      changeFrequency: "daily",
      priority: 0.9,
    }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
