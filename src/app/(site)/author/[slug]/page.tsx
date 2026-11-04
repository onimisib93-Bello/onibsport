import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { XLogo } from "@phosphor-icons/react/dist/ssr";
import { getArticlesByAuthor } from "@/lib/data/db-articles";
import { getAuthorBySlug, initials } from "@/lib/authors";
import ArticleCard from "@/components/ArticleCard";
import NewsImage from "@/components/ui/NewsImage";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};
  const description = author.bio || `The latest football stories by ${author.name} on Onibsport.`;
  return {
    title: `${author.name}${author.role ? `, ${author.role}` : ""}`,
    description,
    alternates: { canonical: `/author/${author.slug}` },
    openGraph: {
      title: `${author.name} on Onibsport`,
      description,
      type: "profile",
      url: `/author/${author.slug}`,
      ...(author.photo ? { images: [{ url: author.photo }] } : {}),
    },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();
  const stories = await getArticlesByAuthor(author.name);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: author.name,
        ...(author.role ? { jobTitle: author.role } : {}),
        ...(author.bio ? { description: author.bio } : {}),
        ...(author.photo ? { image: absoluteUrl(author.photo) } : {}),
        ...(author.xHandle ? { sameAs: [`https://x.com/${author.xHandle}`] } : {}),
        worksFor: { "@type": "NewsMediaOrganization", name: "Onibsport", url: absoluteUrl("/") },
        url: absoluteUrl(`/author/${author.slug}`),
      },
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: author.name, path: `/author/${author.slug}` },
    ]),
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-14">
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-1.5" aria-hidden="true">
          /
        </span>
        <span>Writers</span>
      </nav>

      <header className="mt-6 flex flex-col gap-6 rounded-3xl bg-night p-6 text-white sm:flex-row sm:items-center sm:p-10">
        <span className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo font-display text-5xl font-black ring-4 ring-orange sm:h-36 sm:w-36">
          {author.photo ? <NewsImage src={author.photo} alt={author.name} fill sizes="144px" priority className="object-cover" /> : initials(author.name)}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-5xl font-black leading-[0.9] sm:text-7xl">{author.name}</h1>
          {author.role && <p className="mt-2 text-lg font-semibold text-orange">{author.role}</p>}
          {author.bio && <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-white/75">{author.bio}</p>}
          {author.xHandle && (
            <a
              href={`https://x.com/${author.xHandle}`}
              target="_blank"
              rel="noopener noreferrer me"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-orange hover:text-ink"
            >
              <XLogo size={16} weight="bold" aria-hidden="true" />@{author.xHandle}
            </a>
          )}
        </div>
      </header>

      <section aria-labelledby="author-stories" className="mt-12">
        <h2 id="author-stories" className="font-display text-4xl font-black text-ink">
          Latest from {author.name.split(/\s+/)[0]}
        </h2>
        {stories.length === 0 ? (
          <p className="mt-4 text-muted">No stories yet.</p>
        ) : (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {stories.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
