import { Article, Category } from "@/lib/types";

const SITE_NAME = "Onibsport";

function siteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl()).toString();
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    logo: absoluteUrl("/logo.png"),
    sameAs: ["https://twitter.com/onibsport", "https://facebook.com/onibsport", "https://instagram.com/onibsport"],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl()}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function newsArticleJsonLd(article: Article, category?: Category) {
  const url = absoluteUrl(`/article/${article.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.dek,
    image: [absoluteUrl(article.coverImage)],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: category?.name,
    keywords: article.tags.join(", "),
    url,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
