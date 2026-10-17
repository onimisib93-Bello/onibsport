import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/admin/StatusBadge";
import { PublishButton, DeleteButton } from "@/components/admin/ArticleActions";
import NewsImage from "@/components/ui/NewsImage";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
] as const;

type StatusFilter = "PENDING_REVIEW" | "PUBLISHED" | "DRAFT";

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = (["PENDING_REVIEW", "PUBLISHED", "DRAFT"] as const).includes(rawStatus as StatusFilter) ? (rawStatus as StatusFilter) : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const where: Prisma.ArticleWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { tags: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const articles = await prisma.article.findMany({ where, include: { category: true }, orderBy: { createdAt: "desc" } });

  const href = (next: { status?: string; q?: string }) => {
    const sp = new URLSearchParams();
    const s = next.status ?? status ?? "";
    const query = next.q ?? q;
    if (s) sp.set("status", s);
    if (query) sp.set("q", query);
    const qs = sp.toString();
    return `/admin/articles${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-black leading-none text-ink">Articles</h1>
        <Link href="/admin/articles/new" className="rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo">
          Write a story
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = (status ?? "") === f.value;
            return (
              <Link
                key={f.label}
                href={href({ status: f.value })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  active ? "bg-night text-white" : "bg-white text-ink/70 ring-1 ring-line hover:text-ink"
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
        <form action="/admin/articles" className="flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-sky">
          {status && <input type="hidden" name="status" value={status} />}
          <MagnifyingGlass size={18} weight="bold" className="text-muted" aria-hidden="true" />
          <label htmlFor="admin-q" className="sr-only">
            Search articles
          </label>
          <input id="admin-q" name="q" defaultValue={q} placeholder="Search titles and tags" className="w-56 bg-transparent text-sm focus:outline-none" />
        </form>
      </div>

      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        {articles.length === 0 && (
          <li className="p-8 text-center text-sm text-muted">{q || status ? "No articles match this filter." : "No articles yet. Write one or draft one from the AI Desk."}</li>
        )}
        {articles.map((article) => (
          <li key={article.id} className="flex items-center gap-4 p-3 transition-colors hover:bg-paper/60 sm:p-4">
            <Link href={`/admin/articles/${article.id}`} className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-line sm:block">
              <NewsImage src={article.image} alt="" fill sizes="96px" className="object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={article.status} />
                <span className="text-xs font-semibold text-muted">{article.category.name}</span>
                {article.featured && <span className="text-xs font-bold text-indigo">Featured</span>}
                {article.isBreaking && <span className="text-xs font-bold text-orange-deep">Breaking</span>}
              </div>
              <Link href={`/admin/articles/${article.id}`} className="mt-1 line-clamp-1 block font-semibold text-ink hover:text-indigo">
                {article.title}
              </Link>
              <p className="mt-0.5 text-xs text-muted">
                {article.author}, updated {timeAgo(article.updatedAt.toISOString())}
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
