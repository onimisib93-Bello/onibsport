import { Article } from "@/lib/types";
import ArticleCard from "@/components/ArticleCard";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/motion/Reveal";

export default function NigeriaRail({ articles }: { articles: Article[] }) {
  return (
    <section className="border-t-4 border-sky bg-indigo/[0.03] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading title="Nigeria Football & NPFL" href="/category/nigeria-football" accent="sky" />
        <Reveal
          stagger
          className="mt-6 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0"
        >
          {articles.map((article) => (
            <div key={article.slug} className="w-[80%] shrink-0 snap-start sm:w-auto">
              <ArticleCard article={article} />
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
