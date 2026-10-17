import Link from "next/link";
import { PlayCircle } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";
import { leagueTheme } from "@/lib/leagues";
import { timeAgo } from "@/lib/time";
import NewsImage from "@/components/ui/NewsImage";
import { cn } from "@/lib/utils";

type Size = "default" | "compact" | "large" | "row" | "overlay";

function Kicker({ article, onDark = false }: { article: Article; onDark?: boolean }) {
  const category = getCategory(article.category);
  if (article.isBreaking) {
    return <span className="inline-flex rounded-md bg-orange px-2 py-0.5 text-xs font-bold text-ink">Breaking</span>;
  }
  if (!category) return null;
  const theme = leagueTheme(category.slug);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold", onDark ? "text-white/85" : "text-ink/70")}>
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: onDark ? theme.tint : theme.deep }} />
      {category.name}
    </span>
  );
}

function Meta({ article, onDark = false }: { article: Article; onDark?: boolean }) {
  return (
    <p className={cn("text-xs", onDark ? "text-white/60" : "text-muted")}>
      <time dateTime={article.publishedAt}>{timeAgo(article.publishedAt)}</time>
    </p>
  );
}

function VideoBadge({ article }: { article: Article }) {
  if (!article.featuredVideoUrl) return null;
  return (
    <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-night/80 px-2 py-1 text-[11px] font-bold text-white backdrop-blur">
      <PlayCircle size={14} weight="fill" className="text-orange" aria-hidden="true" />
      Video
    </span>
  );
}

export default function ArticleCard({
  article,
  size = "default",
  priority = false,
  className,
}: {
  article: Article;
  size?: Size;
  priority?: boolean;
  className?: string;
}) {
  const href = `/article/${article.slug}`;

  if (size === "compact") {
    return (
      <Link href={href} className={cn("group flex gap-3", className)}>
        <div className="relative h-[68px] w-[96px] shrink-0 overflow-hidden rounded-lg bg-line">
          <NewsImage src={article.image} alt={article.imageAlt} fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="min-w-0">
          <Kicker article={article} />
          <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-indigo">{article.title}</h3>
        </div>
      </Link>
    );
  }

  if (size === "row") {
    return (
      <Link href={href} className={cn("group grid grid-cols-[minmax(0,1fr)_120px] gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:gap-6", className)}>
        <div className="min-w-0">
          <Kicker article={article} />
          <h3 className="mt-1.5 font-display text-[22px] font-extrabold leading-[1.05] text-ink transition-colors group-hover:text-indigo sm:text-[28px]">
            {article.title}
          </h3>
          <div className="hidden sm:block">
            <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{article.dek}</p>
          </div>
          <div className="mt-2">
            <Meta article={article} />
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line">
          <NewsImage src={article.image} alt={article.imageAlt} fill sizes="(min-width: 640px) 220px, 120px" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
          <VideoBadge article={article} />
        </div>
      </Link>
    );
  }

  if (size === "overlay") {
    return (
      <Link href={href} className={cn("group relative block overflow-hidden rounded-2xl bg-night", className)}>
        <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
          <NewsImage
            src={article.image}
            alt={article.imageAlt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />
          <VideoBadge article={article} />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <Kicker article={article} onDark />
            <h3 className="mt-2 font-display text-[26px] font-extrabold leading-[1.02] text-white">{article.title}</h3>
            <div className="mt-2">
              <Meta article={article} onDark />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (size === "large") {
    return (
      <Link href={href} className={cn("group block", className)}>
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-line">
          <NewsImage
            src={article.image}
            alt={article.imageAlt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
          />
          <VideoBadge article={article} />
        </div>
        <div className="mt-4">
          <Kicker article={article} />
          <h2 className="mt-2 font-display text-[34px] font-black leading-[0.98] text-ink transition-colors group-hover:text-indigo sm:text-[44px]">
            {article.title}
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">{article.dek}</p>
          <p className="mt-3 text-xs text-muted">
            <span className="font-semibold text-ink/80">{article.author}</span>
            <span className="mx-1.5" aria-hidden="true">
              /
            </span>
            <time dateTime={article.publishedAt}>{timeAgo(article.publishedAt)}</time>
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-line">
        <NewsImage
          src={article.image}
          alt={article.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <VideoBadge article={article} />
      </div>
      <div className="mt-3">
        <Kicker article={article} />
        <h3 className="mt-1.5 line-clamp-3 font-display text-[23px] font-extrabold leading-[1.04] text-ink transition-colors group-hover:text-indigo">
          {article.title}
        </h3>
        <div className="mt-1.5">
          <Meta article={article} />
        </div>
      </div>
    </Link>
  );
}
