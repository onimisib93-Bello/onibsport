import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/admin/StatusBadge";
import { PublishButton, DeleteButton } from "@/components/admin/ArticleActions";

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-ink">Articles</h1>
        <Link href="/admin/articles/new" className="rounded-full bg-indigo px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-dark">
          New Article
        </Link>
      </div>

      <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-white">
        {articles.length === 0 && <p className="p-6 text-sm text-muted">No articles yet.</p>}
        {articles.map((article) => (
          <div key={article.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusBadge status={article.status} />
                <p className="text-xs font-semibold text-muted">{article.category.name}</p>
              </div>
              <Link href={`/admin/articles/${article.id}`} className="mt-1 line-clamp-1 block font-semibold text-ink hover:text-indigo">
                {article.title}
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {article.status === "PENDING_REVIEW" && <PublishButton id={article.id} />}
              <Link
                href={`/admin/articles/${article.id}`}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-paper"
              >
                Edit
              </Link>
              <DeleteButton id={article.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
