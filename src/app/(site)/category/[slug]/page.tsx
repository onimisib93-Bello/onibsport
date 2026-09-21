import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, getCategory } from "@/lib/data/categories";
import { getArticlesByCategory } from "@/lib/data/articles";
import { getFixturesByLeague } from "@/lib/data/fixtures";
import ArticleCard from "@/components/ArticleCard";
import MatchCard from "@/components/MatchCard";
import { accentBg } from "@/lib/accent";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: `The latest ${category.name} news, match reports and transfer talk on Onibsport.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(slug);
  const fixtures = getFixturesByLeague(slug);
  const [featured, ...rest] = articles;

  return (
    <>
      <div className={`${accentBg[category.accent]} py-8 text-white`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-white/70">Onibsport</p>
          <h1 className="mt-1 font-display text-4xl tracking-wide sm:text-5xl">{category.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {articles.length === 0 ? (
          <p className="text-muted">No stories in {category.name} yet — check back soon.</p>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div>
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
            </div>

            {fixtures.length > 0 && (
              <aside>
                <h2 className="font-display text-2xl tracking-wide text-ink">Fixtures & Results</h2>
                <div className="mt-4 space-y-3">
                  {fixtures.map((f) => (
                    <MatchCard key={f.id} fixture={f} />
                  ))}
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </>
  );
}
