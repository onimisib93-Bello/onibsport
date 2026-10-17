import { prisma } from "@/lib/prisma";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function NewArticlePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-5xl font-black leading-none text-ink">Write a story</h1>
      <div className="mt-6">
        <ArticleForm categories={categories} />
      </div>
    </div>
  );
}
