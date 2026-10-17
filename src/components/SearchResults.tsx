"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";
import { categories } from "@/lib/data/categories";
import ArticleCard from "@/components/ArticleCard";
import LeagueCrest from "@/components/ui/LeagueCrest";

const SUGGESTIONS = ["Super Eagles", "Arsenal", "Transfers", "NPFL", "Champions League", "Real Madrid"];

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => setLoading(true));
    const timer = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
      fetch(`/api/articles/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setResults(data.articles ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, router]);

  const hasQuery = query.trim() !== "";

  return (
    <>
      <section className="relative overflow-hidden bg-night px-4 pb-12 pt-12 text-white sm:px-6">
        <div className="pitch-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl">
          <h1 className="font-display text-6xl font-black leading-[0.85] sm:text-8xl">Search</h1>
          <div className="relative mt-8">
            <MagnifyingGlass size={24} weight="bold" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Teams, players, leagues…"
              aria-label="Search articles"
              className="h-16 w-full rounded-full bg-white pl-14 pr-6 text-lg text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-orange/60"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="cursor-pointer rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/15 hover:bg-white hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6" aria-live="polite">
        {!hasQuery ? (
          <div>
            <h2 className="font-display text-3xl font-black text-ink">Or browse a league</h2>
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 font-semibold text-ink ring-1 ring-line hover:ring-ink">
                    <LeagueCrest slug={c.slug} size={32} />
                    <span className="truncate">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : loading && results.length === 0 ? (
          <div className="grid gap-8 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <div className="skeleton aspect-[16/10] rounded-xl" />
                <div className="skeleton mt-3 h-5 w-3/4 rounded" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="text-lg text-muted">No stories match &ldquo;{query.trim()}&rdquo;. Try a club, player or league name.</p>
        ) : (
          <>
            <p className="mb-6 text-sm font-semibold text-muted">
              {results.length} {results.length === 1 ? "story" : "stories"} for &ldquo;{query.trim()}&rdquo;
            </p>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
