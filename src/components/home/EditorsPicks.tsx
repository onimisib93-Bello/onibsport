"use client";

import { Article } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";
import { WorksWheel } from "@/components/ui/works-wheel";
import ArticleCard from "@/components/ArticleCard";
import SwipeRow from "@/components/ui/SwipeRow";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Editor's picks as a turnable wheel on large screens with a mouse or
 * trackpad (scroll or drag to turn, arrow keys work too). Touch devices get
 * a swipe row instead, so the wheel never traps vertical page scrolling.
 */
export default function EditorsPicks({ articles }: { articles: Article[] }) {
  const wheel = useMediaQuery("(min-width: 1024px) and (pointer: fine)");
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="picks-title" className="py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="picks-title" className="font-display text-4xl font-black leading-none text-ink sm:text-5xl">
            Editor&apos;s picks
          </h2>
          {wheel && <p className="text-sm text-muted">Scroll or drag over the wheel to turn it. Click a title to jump.</p>}
        </div>
      </div>
      {wheel ? (
        <div className="mx-auto mt-6 h-[min(82vh,760px)] max-w-[1400px] px-6">
          <WorksWheel
            className="rounded-3xl bg-white"
            label="Editor's picks"
            action="Read"
            items={articles.map((a) => ({
              id: a.slug,
              title: a.title,
              image: a.coverImage || a.image,
              href: `/article/${a.slug}`,
              kicker: getCategory(a.category)?.name,
            }))}
          />
        </div>
      ) : (
        <div className="mx-auto mt-6 max-w-[1400px] px-4 sm:px-6">
          <SwipeRow label="Editor's picks">
            {articles.map((a) => (
              <div key={a.slug} className="w-[78%] shrink-0 snap-start sm:w-[40%] lg:w-[30%]">
                <ArticleCard article={a} size="overlay" />
              </div>
            ))}
          </SwipeRow>
        </div>
      )}
    </section>
  );
}
