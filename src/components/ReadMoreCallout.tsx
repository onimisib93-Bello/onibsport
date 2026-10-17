import Link from "next/link";
import { Article } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";
import NewsImage from "@/components/ui/NewsImage";

export default function ReadMoreCallout({ article }: { article: Article }) {
  return (
    <aside className="not-prose my-10">
      <Link href={`/article/${article.slug}`} className="group flex items-center gap-4 rounded-2xl bg-night p-3 pr-5 text-white no-underline transition-transform hover:-translate-y-0.5">
        <span className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-night-2">
          <NewsImage src={article.image} alt="" fill sizes="112px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-bold text-orange">Also on {getCategory(article.category)?.name ?? "Onibsport"}</span>
          <span className="mt-1 line-clamp-2 block font-display text-xl font-extrabold leading-[1.05]">{article.title}</span>
        </span>
      </Link>
    </aside>
  );
}
