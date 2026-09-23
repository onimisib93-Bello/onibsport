import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArticleBySlug, getRelatedArticles, getAllPublishedForSitemap } from "@/lib/data/db-articles";
import { getCategory } from "@/lib/data/categories";
import { accentText } from "@/lib/accent";
import { timeAgo } from "@/lib/time";
import ArticleCard from "@/components/ArticleCard";
import ShareBar from "@/components/ShareBar";
import ReadMoreCallout from "@/components/ReadMoreCallout";
import AdSlot from "@/components/AdSlot";
import { breadcrumbJsonLd, newsArticleJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const rows = await getAllPublishedForSitemap();
  return rows.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const category = getCategory(article.category);

  return {
    title: article.title,
    description: article.dek,
    keywords: article.tags,
    alternates: { canonical: `/article/${article.slug}` },
    authors: [{ name: article.author }],
    openGraph: {
      title: article.title,
      description: article.dek,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.publishedAt,
      authors: [article.author],
      section: category?.name,
      tags: article.tags,
      url: `/article/${article.slug}`,
      images: [{ url: article.coverImage, width: 1200, height: 630, alt: article.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.dek,
      images: [article.coverImage],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const category = getCategory(article.category);
  const related = await getRelatedArticles(article);
  const midpoint = Math.ceil(article.body.length / 2);
  const bodyFirstHalf = article.body.slice(0, midpoint);
  const bodySecondHalf = article.body.slice(midpoint);

  const jsonLd = [
    newsArticleJsonLd(article, category),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
      { name: article.title, path: `/article/${article.slug}` },
    ]),
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}

      <div className="flex items-center gap-3">
        {category && (
          <Link href={`/category/${category.slug}`} className={`text-sm font-semibold ${accentText[category.accent]}`}>
            {category.name}
          </Link>
        )}
        {article.isBreaking && (
          <span className="rounded-full bg-orange px-2.5 py-0.5 text-xs font-bold text-white">Breaking</span>
        )}
      </div>

      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-wide text-ink sm:text-5xl">{article.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{article.dek}</p>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted">
        <span className="font-semibold text-ink">{article.author}</span>
        <span>·</span>
        <time dateTime={article.publishedAt}>{timeAgo(article.publishedAt)}</time>
      </div>

      {article.source && (
        <p className="mt-2 text-xs text-muted">
          Reporting based on information from <span className="font-semibold">{article.source}</span>.
        </p>
      )}

      <div className="mt-6">
        {article.featuredVideoUrl ? (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-ink">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={article.featuredVideoUrl}
              title={article.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-line">
            <Image src={article.image} alt={article.imageAlt} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
          </div>
        )}
      </div>

      <ShareBar title={article.title} path={`/article/${article.slug}`} />

      <div className="prose-onib mt-8 space-y-5">
        {bodyFirstHalf.map((paragraph, i) => (
          <p key={i} className="text-[17px] leading-[1.75] text-ink/90">
            {paragraph}
          </p>
        ))}

        {related[0] && <ReadMoreCallout article={related[0]} />}

        {bodySecondHalf.map((paragraph, i) => (
          <p key={midpoint + i} className="text-[17px] leading-[1.75] text-ink/90">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-8">
        <AdSlot variant="leaderboard" />
      </div>

      {article.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/70 hover:bg-line hover:text-indigo"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-14 border-t border-line pt-8">
          <h2 className="font-display text-2xl tracking-wide text-ink">More {category?.name}</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
