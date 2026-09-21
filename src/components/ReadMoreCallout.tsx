import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";

export default function ReadMoreCallout({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group not-prose my-8 flex items-center gap-4 rounded-xl border border-line bg-paper p-4 transition-colors hover:border-indigo"
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-line sm:h-20 sm:w-28">
        <Image src={article.image} alt={article.imageAlt} fill sizes="112px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-xs font-semibold text-indigo">
          Read more about
          <ArrowUpRight size={13} weight="bold" />
        </p>
        <h4 className="mt-0.5 line-clamp-2 font-semibold text-ink group-hover:text-indigo">{article.title}</h4>
      </div>
    </Link>
  );
}
