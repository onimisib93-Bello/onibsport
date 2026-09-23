import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ArticleForm from "@/components/admin/ArticleForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { PublishButton } from "@/components/admin/ArticleActions";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [article, categories] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl tracking-wide text-ink">Edit Article</h1>
        <StatusBadge status={article.status} />
      </div>

      {article.status === "PENDING_REVIEW" && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-orange/30 bg-orange/5 px-4 py-3">
          <p className="text-sm text-ink/80">
            This story is waiting for editorial approval{article.source ? ` (sourced from ${article.source})` : ""}.
          </p>
          <PublishButton id={article.id} />
        </div>
      )}

      <div className="mt-6 max-w-2xl">
        <ArticleForm
          categories={categories}
          initial={{
            id: article.id,
            title: article.title,
            slug: article.slug,
            dek: article.dek,
            body: article.body,
            image: article.image,
            imageAlt: article.imageAlt,
            coverImage: article.coverImage ?? article.image,
            author: article.author,
            source: article.source ?? "",
            tags: article.tags,
            isBreaking: article.isBreaking,
            featured: article.featured,
            featuredVideoUrl: article.featuredVideoUrl ?? "",
            status: article.status,
            categoryId: article.categoryId,
          }}
        />
      </div>
    </div>
  );
}
