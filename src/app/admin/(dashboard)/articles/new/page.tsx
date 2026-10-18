import { prisma } from "@/lib/prisma";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [categories, params] = await Promise.all([prisma.category.findMany({ orderBy: { name: "asc" } }), searchParams]);

  return (
    <div>
      <h1 className="font-display text-5xl font-black leading-none text-ink">Write a story</h1>
      <div className="mt-6">
        <ArticleForm categories={categories} openImport={params.import === "1"} aiEnabled={!!process.env.ANTHROPIC_API_KEY} />
      </div>
    </div>
  );
}
