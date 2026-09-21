import { Article } from "@/lib/types";
import { PlayCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function FeaturedVideo({ article }: { article: Article }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 rounded-xl bg-ink p-5 text-white sm:grid-cols-2 sm:p-8">
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={article.featuredVideoUrl}
            title={article.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="flex flex-col justify-center">
          <span className="flex items-center gap-2 text-sm font-semibold text-gold">
            <PlayCircle size={20} weight="fill" />
            Featured Video
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[1.05] tracking-wide sm:text-4xl">{article.title}</h2>
          <p className="mt-2 text-white/70">{article.dek}</p>
          <Link
            href={`/article/${article.slug}`}
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold hover:bg-gold"
          >
            Read the full round-up
          </Link>
        </div>
      </div>
    </section>
  );
}
