import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { listAuthors } from "@/lib/authors";
import AuthorManager, { type AdminAuthor } from "@/components/admin/AuthorManager";

export const metadata: Metadata = { title: "Writers" };
export const dynamic = "force-dynamic";

export default async function AuthorsAdminPage() {
  const [profiles, counts] = await Promise.all([
    listAuthors(),
    prisma.article.groupBy({ by: ["author"], _count: { _all: true }, orderBy: { author: "asc" } }).catch(() => []),
  ]);
  const storiesBy = (name: string) => counts.find((c) => c.author.toLowerCase() === name.toLowerCase())?._count._all ?? 0;
  const authors: AdminAuthor[] = (profiles ?? []).map((a) => ({
    id: a.id!,
    slug: a.slug,
    name: a.name,
    role: a.role,
    bio: a.bio,
    photo: a.photo,
    xHandle: a.xHandle,
    stories: storiesBy(a.name),
  }));

  return (
    <div>
      <h1 className="font-display text-4xl font-black text-ink">Writers</h1>
      <p className="mt-2 max-w-2xl text-muted">
        A photo, role and short bio for each writer. They show on the byline of every story and on the writer&apos;s own page, which helps readers (and Google) trust
        who is behind the reporting.
      </p>
      <div className="mt-8">
        <AuthorManager authors={authors} bylines={counts.map((c) => ({ name: c.author, stories: c._count._all }))} tableReady={profiles !== null} />
      </div>
    </div>
  );
}
