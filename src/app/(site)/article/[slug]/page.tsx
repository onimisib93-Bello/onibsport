import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getArticleBySlug, getRelatedArticles, getAllPublishedForSitemap, getLatestArticles } from "@/lib/data/db-articles";
import { getCategory } from "@/lib/data/categories";
import { leagueTheme } from "@/lib/leagues";
import { formatDay, formatKickoff } from "@/lib/time";
import TimeAgo from "@/components/ui/TimeAgo";
import { parseBlocks, plainText, readingMinutes, RenderBlock } from "@/lib/richText";
import ArticleCard from "@/components/ArticleCard";
import ShareBar from "@/components/ShareBar";
import ReadMoreCallout from "@/components/ReadMoreCallout";
import AdSlot from "@/components/AdSlot";
import NewsImage from "@/components/ui/NewsImage";
import FullImage from "@/components/ui/FullImage";
import ReadingProgress from "@/components/article/ReadingProgress";
import ArticleVideo from "@/components/article/ArticleVideo";
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
  const theme = leagueTheme(article.category);
  const [related, latest] = await Promise.all([getRelatedArticles(article, 4), getLatestArticles(8)]);
  const blocks = parseBlocks(article.body);
  const headings = blocks.flatMap((b) => (b.type === "h2" ? [b] : []));
  const minutes = readingMinutes(article.body);

  // A "read more" link roughly halfway down, placed after a paragraph rather than mid-section.
  let midpoint = Math.ceil(blocks.length / 2);
  while (midpoint < blocks.length && blocks[midpoint - 1]?.type !== "p") midpoint++;
  const callout = related[0];
  const moreLatest = latest.filter((a) => a.slug !== article.slug && !related.some((r) => r.slug === a.slug)).slice(0, 4);
  const nextStory = moreLatest[0];

  const jsonLd = [
    newsArticleJsonLd(article, category),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
      { name: article.title, path: `/article/${article.slug}` },
    ]),
  ];

  return (
    <>
      <ReadingProgress color={theme.tint} />
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}

      <article>
        <header className="mx-auto max-w-[1100px] px-4 pt-8 sm:px-6 sm:pt-12">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-ink">
                  Home
                </Link>
              </li>
              {category && (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link href={`/category/${category.slug}`} className="font-semibold hover:text-ink" style={{ color: theme.deep }}>
                      {category.name}
                    </Link>
                  </li>
                </>
              )}
            </ol>
          </nav>

          {article.isBreaking && <p className="mt-5 inline-flex rounded-md bg-orange px-2.5 py-1 text-xs font-bold text-ink">Breaking</p>}
          <h1 className="mt-4 max-w-[22ch] font-display text-[44px] font-black leading-[0.92] text-ink sm:text-7xl">{article.title}</h1>
          <p className="mt-5 max-w-3xl text-xl leading-relaxed text-ink/70">{article.dek}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full font-display text-lg font-black text-white" style={{ background: theme.deep }}>
                {article.author
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="text-sm leading-tight">
                <p className="font-bold text-ink">{article.author}</p>
                <p className="text-muted">
                  <time dateTime={article.publishedAt}>
                    {formatDay(article.publishedAt, { day: "numeric", month: "long", year: "numeric" })}, {formatKickoff(article.publishedAt)} WAT
                  </time>
                </p>
              </div>
            </div>
            <p className="text-sm text-muted">
              {minutes} min read
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              Updated <TimeAgo iso={article.publishedAt} />
            </p>
            <div className="ml-auto">
              <ShareBar title={article.title} path={`/article/${article.slug}`} />
            </div>
          </div>
        </header>

        <div className="mx-auto mt-8 max-w-[1100px] px-4 sm:px-6">
          {article.featuredVideoUrl ? (
            <ArticleVideo src={article.featuredVideoUrl} title={article.title} poster={article.coverImage || article.image} />
          ) : (
            <figure>
              <FullImage
                src={article.coverImage || article.image}
                alt={article.imageAlt}
                priority
                sizes="(min-width: 1100px) 1100px, 100vw"
                className="rounded-3xl"
              />
              <figcaption className="mt-2 text-sm text-muted">{article.imageAlt}</figcaption>
            </figure>
          )}
        </div>

        <div className="mx-auto grid max-w-[1100px] gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="story mx-auto max-w-[680px]">
              {blocks.slice(0, midpoint).map((block, i) => (
                <RenderBlock key={i} block={block} />
              ))}
              {callout && <ReadMoreCallout article={callout} />}
              {blocks.slice(midpoint).map((block, i) => (
                <RenderBlock key={midpoint + i} block={block} />
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-[680px] space-y-6">
              {article.source && (
                <p className="rounded-2xl bg-white p-4 text-sm text-muted ring-1 ring-line">
                  Reporting based on information from <span className="font-semibold text-ink">{article.source}</span>.
                </p>
              )}
              {article.tags.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted">Topics</h2>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          href={`/search?q=${encodeURIComponent(tag)}`}
                          className="inline-flex rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-ink/80 ring-1 ring-line transition-colors hover:bg-night hover:text-white hover:ring-night"
                        >
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="border-t border-line pt-6">
                <ShareBar title={article.title} path={`/article/${article.slug}`} />
              </div>
              <AdSlot variant="leaderboard" />
            </div>
          </div>

          <aside className="hidden space-y-6 lg:block">
            <div className="sticky top-32 space-y-6">
              {headings.length > 1 && (
                <nav aria-labelledby="toc-title" className="rounded-2xl bg-white p-5 ring-1 ring-line">
                  <h2 id="toc-title" className="font-display text-2xl font-black text-ink">
                    In this story
                  </h2>
                  <ol className="mt-3 space-y-2 text-sm">
                    {headings.map((h) => (
                      <li key={h.id}>
                        <a href={`#${h.id}`} className="block font-semibold leading-snug text-ink/75 hover:text-indigo">
                          {plainText(h.text)}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              {moreLatest.length > 0 && (
                <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
                  <h2 className="font-display text-2xl font-black text-ink">Latest</h2>
                  <ul className="mt-4 space-y-4">
                    {moreLatest.map((a) => (
                      <li key={a.slug}>
                        <ArticleCard article={a} size="compact" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <AdSlot variant="rectangle" />
            </div>
          </aside>
        </div>
      </article>

      {nextStory && (
        <section aria-label="Next story" className="mx-auto mt-16 max-w-[1100px] px-4 sm:px-6">
          <Link href={`/article/${nextStory.slug}`} className="group relative block overflow-hidden rounded-3xl bg-night text-white">
            <NewsImage
              src={nextStory.coverImage || nextStory.image}
              alt=""
              fill
              sizes="1100px"
              className="object-cover opacity-40 transition-transform duration-[1200ms] group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-r from-night via-night/70 to-transparent" />
            <span className="relative block p-8 sm:p-12">
              <span className="text-sm font-bold text-orange">Next story</span>
              <span className="mt-2 block max-w-2xl font-display text-4xl font-black leading-[0.95] sm:text-5xl">{nextStory.title}</span>
            </span>
          </Link>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
          <h2 id="related-title" className="font-display text-4xl font-black text-ink sm:text-5xl">
            More {category?.name}
          </h2>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
