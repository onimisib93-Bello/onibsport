import Link from "next/link";
import { Article } from "@/lib/types";
import Marquee from "@/components/ui/Marquee";

export default function TransferTicker({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="border-y border-gold/40 bg-gold text-ink">
      <div className="mx-auto flex h-12 max-w-[1400px] items-stretch">
        <Link href="/category/transfers" className="flex shrink-0 items-center bg-ink px-4 font-display text-lg font-extrabold text-gold hover:text-white">
          Transfer watch
        </Link>
        <Marquee label="Transfer headlines" seconds={Math.max(36, articles.length * 9)} controlClassName="border-l border-ink/15 text-ink/70 hover:text-ink">
          {articles.map((a) => (
            <Link key={a.slug} href={`/article/${a.slug}`} className="flex shrink-0 items-center gap-3 px-6 text-sm font-bold whitespace-nowrap hover:underline">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ink/50" />
              {a.title}
            </Link>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
