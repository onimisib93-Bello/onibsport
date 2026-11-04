"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import { PublishButton, DeleteButton } from "@/components/admin/ArticleActions";
import NewsImage from "@/components/ui/NewsImage";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface ListArticle {
  id: string;
  slug: string;
  title: string;
  image: string;
  imageFocus: string | null;
  status: string;
  publishedAt: string | null;
  /** Published, with a time still to come. */
  scheduled: boolean;
  updatedAt: string;
  author: string;
  hub: string;
  featured: boolean;
  isBreaking: boolean;
}

type Action = "publish" | "draft" | "feature" | "unfeature" | "unbreak" | "move" | "delete";

const ACTIONS: { value: Action; label: string }[] = [
  { value: "publish", label: "Publish" },
  { value: "draft", label: "Move to drafts" },
  { value: "feature", label: "Feature on homepage" },
  { value: "unfeature", label: "Remove from homepage" },
  { value: "unbreak", label: "Clear Breaking label" },
  { value: "move", label: "Move to hub…" },
  { value: "delete", label: "Delete" },
];

function when(a: ListArticle) {
  if (a.scheduled && a.publishedAt) {
    return `goes live ${new Date(a.publishedAt).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
  }
  return `updated ${timeAgo(a.updatedAt)}`;
}

/** The Articles list with checkboxes and one action for every ticked story. */
export default function ArticleList({ articles, categories, emptyText }: { articles: ListArticle[]; categories: { id: string; name: string }[]; emptyText: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<Action>("publish");
  const [hub, setHub] = useState(categories[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const all = articles.length > 0 && articles.every((a) => selected.has(a.id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function apply() {
    const ids = articles.filter((a) => selected.has(a.id)).map((a) => a.id);
    if (ids.length === 0) return;
    const label = ACTIONS.find((a) => a.value === action)!.label.replace("…", "");
    if (action === "delete" && !confirm(`Delete ${ids.length} ${ids.length === 1 ? "story" : "stories"}? This can't be undone.`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/articles/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, categoryId: action === "move" ? hub : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "That didn't work. Try again.");
      setMessage({ ok: true, text: `${label}: done for ${data.count} ${data.count === 1 ? "story" : "stories"}.` });
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "That didn't work. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-line">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={all}
            onChange={() => setSelected(all ? new Set() : new Set(articles.map((a) => a.id)))}
            className="h-5 w-5 accent-[#2d1b69]"
            aria-label="Select all stories shown"
          />
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label htmlFor="bulk-action" className="sr-only">
            Action
          </label>
          <select
            id="bulk-action"
            value={action}
            onChange={(e) => setAction(e.target.value as Action)}
            className="h-10 rounded-full border border-line bg-white px-3 text-sm font-semibold text-ink focus:border-indigo focus:outline-none"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          {action === "move" && (
            <>
              <label htmlFor="bulk-hub" className="sr-only">
                Hub
              </label>
              <select id="bulk-hub" value={hub} onChange={(e) => setHub(e.target.value)} className="h-10 rounded-full border border-line bg-white px-3 text-sm text-ink focus:border-indigo focus:outline-none">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            type="button"
            onClick={apply}
            disabled={busy || selected.size === 0}
            className={cn(
              "h-10 cursor-pointer rounded-full px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50",
              action === "delete" ? "bg-[#b42318] hover:bg-[#912018]" : "bg-night hover:bg-indigo"
            )}
          >
            {busy ? "Working…" : "Apply"}
          </button>
        </div>
      </div>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={cn("mt-3 rounded-xl p-3 text-sm font-semibold", message.ok ? "bg-[#1f9d5c]/10 text-[#1f7a4a]" : "bg-[#fde8e8] text-[#b42318]")}>
          {message.text}
        </p>
      )}

      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        {articles.length === 0 && <li className="p-8 text-center text-sm text-muted">{emptyText}</li>}
        {articles.map((article) => (
          <li key={article.id} className={cn("flex items-center gap-3 p-3 transition-colors hover:bg-paper/60 sm:gap-4 sm:p-4", selected.has(article.id) && "bg-indigo/[0.04]")}>
            <input
              type="checkbox"
              checked={selected.has(article.id)}
              onChange={() => toggle(article.id)}
              aria-label={`Select "${article.title}"`}
              className="h-5 w-5 shrink-0 cursor-pointer accent-[#2d1b69]"
            />
            <Link href={`/admin/articles/${article.id}`} className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-line sm:block">
              <NewsImage src={article.image} focus={article.imageFocus} alt="" fill sizes="96px" className="object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={article.status} scheduled={article.scheduled} />
                <span className="text-xs font-semibold text-muted">{article.hub}</span>
                {article.featured && <span className="text-xs font-bold text-indigo">Featured</span>}
                {article.isBreaking && <span className="text-xs font-bold text-orange-deep">Breaking</span>}
              </div>
              <Link href={`/admin/articles/${article.id}`} className="mt-1 line-clamp-1 block font-semibold text-ink hover:text-indigo">
                {article.title}
              </Link>
              <p className="mt-0.5 text-xs text-muted">
                {article.author}, {when(article)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {article.status === "PENDING_REVIEW" && <PublishButton id={article.id} />}
              <Link href={`/admin/articles/${article.id}`} className="rounded-full px-3.5 py-2 text-xs font-bold text-ink ring-1 ring-line hover:ring-ink">
                Edit
              </Link>
              <DeleteButton id={article.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
