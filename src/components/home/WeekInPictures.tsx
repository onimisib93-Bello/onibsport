"use client";

import StackSpread from "@/components/ui/stack-spread";
import { Article } from "@/lib/types";

/** The week's photos stacked, then scattered across the screen as you scroll. */
export default function WeekInPictures({ articles }: { articles: Article[] }) {
  const items = articles
    .filter((a) => a.image)
    .slice(0, 8)
    .map((a) => ({ src: a.image || a.coverImage, alt: a.imageAlt, href: `/article/${a.slug}`, caption: a.title }));
  if (items.length < 4) return null;

  return (
    <section aria-label="The week in pictures">
      <StackSpread
        items={items}
        scrollLength={280}
        bgColor="#120a33"
        textColor="#ffffff"
        cardRadius={14}
        title={"The week\nin pictures"}
        subtitle="Every frame links to its story. Hover a photo to read the headline."
      />
    </section>
  );
}
