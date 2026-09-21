"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { articles } from "@/lib/data/articles";
import ArticleCard from "@/components/ArticleCard";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return articles.filter(
      (a) =>
        a.status === "published" &&
        (a.title.toLowerCase().includes(q) ||
          a.dek.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)))
    );
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
