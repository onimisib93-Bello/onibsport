import Link from "next/link";
import { Article } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";

/** Numbered story list (the numbers are a ranking, so they stay). */
export default function TrendingSidebar({ articles, title = "Trending now" }: { articles: Article[]; title?: string }) {
  if (articles.length === 0) return null;
  return (
    <aside aria-labelledby="trending-title" className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <h2 id="trending-title" className="font-display text-3xl font-black text-ink">
        {title}
      </h2>
      <ol className="mt-4 divide-y divide-line">
        {articles.map((article, i) => (
          <li key={article.slug}>
            <Link href={`/article/${article.slug}`} className="group flex items-start gap-4 py-3.5">
              <span className="w-8 shrink-0 font-display text-[40px] font-black leading-[0.8] text-indigo/20 transition-colors group-hover:text-orange">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="text-xs font-bold text-muted">{getCategory(article.category)?.name}</span>
                <span className="mt-0.5 line-clamp-3 block text-[15px] font-semibold leading-snug text-ink group-hover:text-indigo">{article.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
