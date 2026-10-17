import Link from "next/link";
import { PencilSimpleLine, Robot } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { PublishButton } from "@/components/admin/ArticleActions";
import NewsImage from "@/components/ui/NewsImage";
import { timeAgo } from "@/lib/time";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 3600 * 1000);
}

export default async function AdminDashboard() {
  const weekAgo = daysAgo(7);
  const [draftCount, pendingCount, publishedCount, publishedThisWeek, pending, recent] = await Promise.all([
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "PUBLISHED", publishedAt: { gte: weekAgo } } }),
    prisma.article.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Waiting for review", value: pendingCount, tone: "bg-orange text-ink" },
    { label: "Published", value: publishedCount, tone: "bg-night text-white" },
    { label: "Published this week", value: publishedThisWeek, tone: "bg-white text-ink ring-1 ring-line" },
    { label: "Drafts", value: draftCount, tone: "bg-white text-ink ring-1 ring-line" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-black leading-none text-ink">Newsroom</h1>
          <p className="mt-2 text-muted">Review AI drafts, publish stories and keep every hub fresh.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/ai-desk" className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-ink ring-1 ring-line hover:ring-ink">
            <Robot size={18} weight="bold" aria-hidden="true" />
            Open the AI Desk
          </Link>
          <Link href="/admin/articles/new" className="flex items-center gap-2 rounded-full bg-night px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo">
            <PencilSimpleLine size={18} weight="bold" aria-hidden="true" />
            Write a story
          </Link>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.tone}`}>
            <dd className="font-display text-6xl font-black leading-none tabular-nums">{s.value}</dd>
            <dt className="mt-2 text-sm font-semibold opacity-80">{s.label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="pending-title">
          <div className="flex items-center justify-between">
            <h2 id="pending-title" className="font-display text-3xl font-black text-ink">
              Waiting for review
            </h2>
            <Link href="/admin/articles?status=PENDING_REVIEW" className="text-sm font-bold text-indigo hover:text-sky-dark">
              See all
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
              <p className="font-display text-2xl font-black text-ink">All caught up</p>
              <p className="mt-1 text-sm text-muted">AI-drafted stories land here for approval before they go live. Draft one from the AI Desk.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {pending.map((article) => (
                <li key={article.id} className="flex flex-col gap-4 rounded-2xl bg-white p-3 ring-1 ring-line sm:flex-row sm:items-center">
                  <Link href={`/admin/articles/${article.id}`} className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-line sm:w-36">
                    <NewsImage src={article.image} alt="" fill sizes="144px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-orange-deep">{article.category.name}</p>
                    <Link href={`/admin/articles/${article.id}`} className="mt-0.5 line-clamp-2 font-display text-xl font-extrabold leading-tight text-ink hover:text-indigo">
                      {article.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {article.author}, {timeAgo(article.createdAt.toISOString())}
                      {article.source && <> — via {article.source}</>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                    <Link href={`/admin/articles/${article.id}`} className="rounded-full px-3.5 py-2 text-xs font-bold text-ink ring-1 ring-line hover:ring-ink">
                      Review and edit
                    </Link>
                    <PublishButton id={article.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className="font-display text-3xl font-black text-ink">
            Recently published
          </h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
            {recent.length === 0 && <li className="p-5 text-sm text-muted">Nothing published yet.</li>}
            {recent.map((a) => (
              <li key={a.id} className="p-4">
                <p className="text-xs font-bold text-muted">{a.category.name}</p>
                <div className="mt-0.5 flex items-start justify-between gap-3">
                  <Link href={`/admin/articles/${a.id}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-indigo">
                    {a.title}
                  </Link>
                  <Link href={`/article/${a.slug}`} target="_blank" className="shrink-0 text-xs font-bold text-indigo hover:text-sky-dark">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
