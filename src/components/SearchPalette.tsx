"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MagnifyingGlass, ArrowElbowDownLeft, X } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";
import { categories, getCategory } from "@/lib/data/categories";
import LeagueCrest from "@/components/ui/LeagueCrest";
import NewsImage from "@/components/ui/NewsImage";
import TimeAgo from "@/components/ui/TimeAgo";

/** ⌘K search popup: instant results as you type, arrow keys to move, Enter to open. */
export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(id);
    };
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => setLoading(true));
    const timer = setTimeout(() => {
      fetch(`/api/articles/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          setResults((data.articles ?? []).slice(0, 8));
          setActive(0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const hasQuery = query.trim() !== "";
  const shown = hasQuery ? results : [];

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(shown.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) go(`/article/${shown[active].slug}`);
      else if (hasQuery) go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-night/70 px-3 pt-[8vh] backdrop-blur-md sm:pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search Onibsport"
            onKeyDown={onKeyDown}
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_40px_120px_-30px_rgb(18_10_51/0.6)]"
            initial={reduce ? false : { opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <MagnifyingGlass size={22} weight="bold" className="shrink-0 text-indigo" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Teams, players, leagues…"
                aria-label="Search stories"
                aria-controls="search-results"
                aria-activedescendant={shown[active] ? `search-result-${active}` : undefined}
                className="h-16 min-w-0 flex-1 bg-transparent text-lg text-ink placeholder:text-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-muted hover:bg-paper hover:text-ink"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div id="search-results" role="listbox" aria-label="Results" className="max-h-[60vh] overflow-y-auto p-2">
              {!hasQuery && (
                <div className="p-3">
                  <p className="text-sm font-semibold text-muted">Jump to a league</p>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/category/${c.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-ink hover:bg-paper"
                      >
                        <LeagueCrest slug={c.slug} size={24} />
                        <span className="truncate">{c.shortName}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {hasQuery && loading && shown.length === 0 && (
                <div className="space-y-2 p-2" aria-live="polite">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="skeleton h-14 w-20 rounded-lg" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="skeleton h-3 w-24 rounded" />
                        <div className="skeleton h-4 w-full rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasQuery && !loading && shown.length === 0 && (
                <p className="p-4 text-sm text-muted" aria-live="polite">
                  No stories match &ldquo;{query.trim()}&rdquo;. Try a club or player name.
                </p>
              )}

              {shown.map((a, i) => {
                const cat = getCategory(a.category);
                return (
                  <button
                    key={a.slug}
                    id={`search-result-${i}`}
                    role="option"
                    aria-selected={i === active}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(`/article/${a.slug}`)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors ${i === active ? "bg-paper" : ""}`}
                  >
                    <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-line">
                      <NewsImage src={a.image} alt="" fill sizes="80px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-muted">
                        {cat?.name}, <TimeAgo iso={a.publishedAt} className="font-normal" />
                      </span>
                      <span className="mt-0.5 line-clamp-2 block font-semibold leading-snug text-ink">{a.title}</span>
                    </span>
                    {i === active && <ArrowElbowDownLeft size={16} className="shrink-0 text-muted" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {hasQuery && (
              <div className="border-t border-line px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
                  className="cursor-pointer text-sm font-semibold text-indigo hover:text-sky-dark"
                >
                  See every result for &ldquo;{query.trim()}&rdquo;
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
