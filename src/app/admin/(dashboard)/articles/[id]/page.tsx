import Link from "next/link";
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
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-5xl font-black leading-none text-ink">Edit story</h1>
        <StatusBadge status={article.status} />
        {article.status === "PUBLISHED" && (
          <Link href={`/article/${article.slug}`} target="_blank" className="ml-auto rounded-full px-4 py-2 text-sm font-bold text-ink ring-1 ring-line hover:ring-ink">
            View live story
          </Link>
        )}
      </div>

      {article.status === "PENDING_REVIEW" && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-night px-5 py-4 text-white">
          <p className="text-sm">
            <span className="font-bold text-orange">Waiting for approval.</span> Read it through, fix anything that&apos;s off, then publish
            {article.source ? ` (sourced from ${article.source})` : ""}.
          </p>
          <PublishButton id={article.id} />
        </div>
      )}

      <div className="mt-6">
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
