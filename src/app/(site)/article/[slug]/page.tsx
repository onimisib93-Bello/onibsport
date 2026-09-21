import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { articles, getArticle, getRelatedArticles } from "@/lib/data/articles";
import { getCategory } from "@/lib/data/categories";
import { accentText } from "@/lib/accent";
import { timeAgo } from "@/lib/time";
import ArticleCard from "@/components/ArticleCard";
import ShareBar from "@/components/ShareBar";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.dek,
    openGraph: {
      title: article.title,
      description: article.dek,
      type: "article",
      images: [{ url: article.image }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.dek,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const category = getCategory(article.category);
  const related = getRelatedArticles(article);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
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
        {article.body.map((paragraph, i) => (
          <p key={i} className="text-[17px] leading-[1.75] text-ink/90">
            {paragraph}
          </p>
        ))}
      </div>

      {article.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/70">
              {tag}
            </span>
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
