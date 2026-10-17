"use client";

import Timeline from "@/components/ui/timeline";
import { Article } from "@/lib/types";
import { formatDay } from "@/lib/time";

/**
 * The window so far: the latest transfer stories laid out on a horizontal
 * timeline that slides past as you scroll, oldest on the left.
 */
export default function TransferTimeline({ articles }: { articles: Article[] }) {
  const recent = articles.slice(0, 7).reverse();
  const first = recent[0];
  const last = recent[recent.length - 1];

  return (
    <div id="timeline" className="scroll-mt-32">
      <Timeline
        items={recent.map((a, i) => ({
          id: `t${i}`,
          label: formatDay(a.publishedAt, { day: "numeric", month: "short" }),
          content: a.title,
          href: `/article/${a.slug}`,
        }))}
        title="The window so far"
        periodLabel={`${formatDay(first.publishedAt, { day: "numeric", month: "short" })} to ${formatDay(last.publishedAt, { day: "numeric", month: "short" })}`}
        backgroundColor="#120a33"
        textColor="#ffffff"
        mutedTextColor="rgb(255 255 255 / 0.7)"
        activeColor="#fbb03b"
        imageUrl={last.coverImage || last.image}
        imageAlt={last.imageAlt}
        duration={1.2}
      />
    </div>
  );
}
