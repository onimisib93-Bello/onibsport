import { prisma } from "@/lib/prisma";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function NewArticlePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ink">New Article</h1>
      <div className="mt-6 max-w-2xl">
        <ArticleForm categories={categories} />
      </div>
    </div>
  );
}
