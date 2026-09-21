import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PublishButton } from "@/components/admin/ArticleActions";
import { timeAgo } from "@/lib/time";

export default async function AdminDashboard() {
  const [draftCount, pendingCount, publishedCount, pending] = await Promise.all([
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = [
    { label: "Published", value: publishedCount, accent: "text-sky" },
    { label: "Pending review", value: pendingCount, accent: "text-orange" },
    { label: "Drafts", value: draftCount, accent: "text-ink/60" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Overview of Onibsport&apos;s newsroom.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-white p-5">
            <p className={`font-display text-4xl ${s.accent}`}>{s.value}</p>
            <p className="mt-1 text-sm font-semibold text-ink/70">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wide text-ink">Pending Review</h2>
          <Link href="/admin/articles" className="text-sm font-semibold text-indigo hover:text-orange">
            View all articles
          </Link>
        </div>

        {pending.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nothing waiting on review. AI-drafted stories will land here for approval before they go live.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((article) => (
              <div key={article.id} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-orange">{article.category.name}</p>
                  <Link href={`/admin/articles/${article.id}`} className="line-clamp-1 font-semibold text-ink hover:text-indigo">
                    {article.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    {article.author} · {timeAgo(article.createdAt.toISOString())}
                    {article.source && <> · via {article.source}</>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-paper"
                  >
                    Review
                  </Link>
                  <PublishButton id={article.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
