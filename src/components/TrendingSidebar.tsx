import Link from "next/link";
import { Article } from "@/lib/types";

export default function TrendingSidebar({ articles }: { articles: Article[] }) {
  return (
    <aside className="rounded-xl border border-line bg-white p-5">
      <h2 className="font-display text-2xl tracking-wide text-ink">Trending Now</h2>
      <ol className="mt-4 space-y-4">
        {articles.map((article, i) => (
          <li key={article.slug}>
            <Link href={`/article/${article.slug}`} className="group flex items-baseline gap-3">
              <span className="font-display text-2xl leading-none text-line group-hover:text-orange">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-indigo">
                {article.title}
              </h3>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
