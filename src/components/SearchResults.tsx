"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";
import ArticleCard from "@/components/ArticleCard";

export default function SearchResults() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => setLoading(true));
    const timer = setTimeout(() => {
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
  }, [query]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl tracking-wide text-ink sm:text-5xl">Search</h1>
      <div className="relative mt-6">
        <MagnifyingGlass size={20} weight="bold" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams, players, leagues…"
          aria-label="Search articles"
          className="w-full rounded-full border border-line py-3 pl-12 pr-4 text-base focus:border-indigo focus:outline-none"
        />
      </div>

      <div className="mt-8">
        {query.trim() === "" ? (
          <p className="text-muted">Start typing to search Onibsport&apos;s coverage.</p>
        ) : loading ? (
          <p className="text-muted">Searching…</p>
        ) : results.length === 0 ? (
          <p className="text-muted">No stories found for &ldquo;{query}&rdquo;.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2">
            {results.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
