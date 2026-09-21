import Link from "next/link";
import Image from "next/image";
import { Article } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";
import { accentText } from "@/lib/accent";
import { timeAgo } from "@/lib/time";

export default function ArticleCard({
  article,
  size = "default",
}: {
  article: Article;
  size?: "default" | "compact" | "large";
}) {
  const category = getCategory(article.category);
  const accentCls = category ? accentText[category.accent] : "text-indigo";

  if (size === "compact") {
    return (
      <Link href={`/article/${article.slug}`} className="group flex gap-3">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-line">
          <Image src={article.image} alt={article.imageAlt} fill sizes="96px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
        <div className="min-w-0">
          {category && <p className={`text-xs font-semibold ${accentCls}`}>{category.name}</p>}
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-indigo">
            {article.title}
          </h3>
        </div>
      </Link>
    );
  }

  if (size === "large") {
    return (
      <Link href={`/article/${article.slug}`} className="group block">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-line">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {article.isBreaking && (
            <span className="absolute left-4 top-4 rounded-full bg-orange px-3 py-1 text-xs font-bold text-white">
              Breaking
            </span>
          )}
        </div>
        <div className="mt-4">
          {category && <p className={`text-sm font-semibold ${accentCls}`}>{category.name}</p>}
          <h2 className="mt-1 font-display text-3xl leading-[1.05] tracking-wide text-ink group-hover:text-indigo sm:text-4xl">
            {article.title}
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{article.dek}</p>
          <p className="mt-2 text-xs text-muted">
            {article.author} · {timeAgo(article.publishedAt)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-line">
        <Image
          src={article.image}
          alt={article.imageAlt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-3">
        {category && <p className={`text-xs font-semibold ${accentCls}`}>{category.name}</p>}
        <h3 className="mt-1 line-clamp-2 font-display text-xl leading-tight tracking-wide text-ink group-hover:text-indigo">
          {article.title}
        </h3>
        <p className="mt-1 text-xs text-muted">{timeAgo(article.publishedAt)}</p>
      </div>
    </Link>
  );
}
