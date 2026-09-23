import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, getCategory } from "@/lib/data/categories";
import { getArticlesByCategory } from "@/lib/data/db-articles";
import { getFixturesForLeague, getStandingsForLeague } from "@/lib/live/footballData";
import ArticleCard from "@/components/ArticleCard";
import LeagueDataTabs from "@/components/LeagueDataTabs";
import AdSlot from "@/components/AdSlot";
import { accentBg } from "@/lib/accent";
import { breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 60;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const description = `The latest ${category.name} news, match reports, transfer talk and results on Onibsport.`;
  return {
    title: category.name,
    description,
    keywords: [category.name, `${category.name} news`, `${category.name} results`, "Onibsport"],
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${category.name} — Onibsport`,
      description,
      type: "website",
      url: `/category/${category.slug}`,
      images: [{ url: "/covers/default-cover.jpg", width: 1200, height: 630, alt: `Onibsport — ${category.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} — Onibsport`,
      description,
      images: ["/covers/default-cover.jpg"],
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const [articles, fixtures, standings] = await Promise.all([
    getArticlesByCategory(slug),
    getFixturesForLeague(category.slug),
    getStandingsForLeague(category.slug),
  ]);
  const [featured, ...rest] = articles;
  const hasLeagueData = fixtures.length > 0 || !!standings;

  const jsonLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: category.name, path: `/category/${category.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={`${accentBg[category.accent]} py-8 text-white`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-white/70">Onibsport</p>
          <h1 className="mt-1 font-display text-4xl tracking-wide sm:text-5xl">{category.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            {articles.length === 0 ? (
              <p className="text-muted">No stories in {category.name} yet — check back soon.</p>
            ) : (
              <>
                {featured && (
                  <div className="mb-10">
                    <ArticleCard article={featured} size="large" />
                  </div>
                )}
                <div className="grid gap-8 sm:grid-cols-2">
                  {rest.map((article) => (
                    <ArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              </>
            )}
          </div>

          {hasLeagueData && (
            <aside className="space-y-6">
              <div>
                <h2 className="font-display text-2xl tracking-wide text-ink">{category.name}</h2>
                <div className="mt-4">
                  <LeagueDataTabs fixtures={fixtures} standings={standings} />
                </div>
              </div>
              <AdSlot variant="sidebar" />
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
