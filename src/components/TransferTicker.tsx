import Link from "next/link";
import { Article } from "@/lib/types";

export default function TransferTicker({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  const items = [...articles, ...articles];

  return (
    <div className="overflow-hidden border-y border-line bg-gradient-to-r from-orange to-gold text-white">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <span className="z-10 flex shrink-0 items-center bg-ink px-3 py-2 text-xs font-bold tracking-wide sm:px-4">
          Transfer Watch
        </span>
        <div className="group relative flex-1 overflow-hidden">
          <div className="flex w-max animate-[ticker_32s_linear_infinite] gap-10 py-2 pl-6 group-hover:[animation-play-state:paused]">
            {items.map((a, i) => (
              <Link key={`${a.slug}-${i}`} href={`/article/${a.slug}`} className="flex shrink-0 items-center gap-2 text-sm font-semibold whitespace-nowrap hover:underline">
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
