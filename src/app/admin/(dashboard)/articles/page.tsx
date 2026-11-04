import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import ArticleList from "@/components/admin/ArticleList";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "DRAFT", label: "Drafts" },
] as const;

const FLAGS = [
  { value: "", label: "Any placement" },
  { value: "featured", label: "Featured" },
  { value: "breaking", label: "Breaking" },
] as const;

type StatusFilter = "PENDING_REVIEW" | "PUBLISHED" | "SCHEDULED" | "DRAFT";

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const rawStatus = one(params.status);
  const status = (["PENDING_REVIEW", "PUBLISHED", "SCHEDULED", "DRAFT"] as const).includes(rawStatus as StatusFilter) ? (rawStatus as StatusFilter) : undefined;
  const q = one(params.q);
  const hub = one(params.hub);
  const author = one(params.author);
  const flag = one(params.flag);
  const sort = one(params.sort) === "oldest" ? "oldest" : "newest";
  const now = new Date();

  const statusWhere: Prisma.ArticleWhereInput =
    status === "SCHEDULED"
      ? { status: "PUBLISHED", publishedAt: { gt: now } }
      : status === "PUBLISHED"
        ? { status: "PUBLISHED", OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] }
        : status
          ? { status }
          : {};
  const where: Prisma.ArticleWhereInput = {
    AND: [
      statusWhere,
      q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { tags: { contains: q, mode: "insensitive" } }] } : {},
      hub ? { category: { slug: hub } } : {},
      author ? { author } : {},
      flag === "featured" ? { featured: true } : flag === "breaking" ? { isBreaking: true } : {},
    ],
  };

  const [articles, categories, authors] = await Promise.all([
    prisma.article.findMany({ where, include: { category: true }, orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" }, take: 300 }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.article.findMany({ select: { author: true }, distinct: ["author"], orderBy: { author: "asc" } }),
  ]);

  const current = { status: status ?? "", q, hub, author, flag, sort: sort === "oldest" ? "oldest" : "" };
  const href = (next: Partial<typeof current>) => {
    const merged = { ...current, ...next };
    const sp = new URLSearchParams(Object.entries(merged).filter(([, v]) => v) as [string, string][]);
    const qs = sp.toString();
    return `/admin/articles${qs ? `?${qs}` : ""}`;
  };
  const filtered = !!(q || status || hub || author || flag);
  const select = "h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink focus:border-indigo focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-black leading-none text-ink">Articles</h1>
        <Link href="/admin/articles/new" className="rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo">
          Write a story
        </Link>
      </div>

      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-1.5">
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

      {/* A plain GET form, so filters work without JavaScript and the address can be bookmarked. */}
      <form action="/admin/articles" className="mt-3 flex flex-wrap items-center gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-sky">
          <MagnifyingGlass size={18} weight="bold" className="text-muted" aria-hidden="true" />
          <label htmlFor="admin-q" className="sr-only">
            Search articles
          </label>
          <input id="admin-q" name="q" defaultValue={q} placeholder="Search titles and tags" className="w-48 bg-transparent text-sm focus:outline-none" />
        </div>
        <label htmlFor="f-hub" className="sr-only">
          Hub
        </label>
        <select id="f-hub" name="hub" defaultValue={hub} className={select}>
          <option value="">All hubs</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <label htmlFor="f-author" className="sr-only">
          Writer
        </label>
        <select id="f-author" name="author" defaultValue={author} className={select}>
          <option value="">All writers</option>
          {authors.map((a) => (
            <option key={a.author} value={a.author}>
              {a.author}
            </option>
          ))}
        </select>
        <label htmlFor="f-flag" className="sr-only">
          Placement
        </label>
        <select id="f-flag" name="flag" defaultValue={flag} className={select}>
          {FLAGS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <label htmlFor="f-sort" className="sr-only">
          Order
        </label>
        <select id="f-sort" name="sort" defaultValue={current.sort} className={select}>
          <option value="">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button type="submit" className="h-11 cursor-pointer rounded-full bg-night px-5 text-sm font-bold text-white hover:bg-indigo">
          Filter
        </button>
        {filtered && (
          <Link href="/admin/articles" className="px-2 text-sm font-semibold text-muted hover:text-ink">
            Clear
          </Link>
        )}
        <span className="ml-auto text-sm text-muted">
          {articles.length} {articles.length === 1 ? "story" : "stories"}
        </span>
      </form>

      <ArticleList
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        emptyText={filtered ? "No articles match this filter." : "No articles yet. Write one or draft one from the AI Desk."}
        articles={articles.map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          image: a.image,
          imageFocus: a.imageFocus,
          status: a.status,
          publishedAt: a.publishedAt?.toISOString() ?? null,
          scheduled: a.status === "PUBLISHED" && !!a.publishedAt && a.publishedAt > now,
          updatedAt: a.updatedAt.toISOString(),
          author: a.author,
          hub: a.category.name,
          featured: a.featured,
          isBreaking: a.isBreaking,
        }))}
      />
    </div>
  );
}
