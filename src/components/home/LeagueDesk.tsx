"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Article, CategorySlug, StandingRow } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";
import { leagueTheme } from "@/lib/leagues";
import ArticleCard from "@/components/ArticleCard";
import LeagueCrest from "@/components/ui/LeagueCrest";
import { MiniTable } from "@/components/StandingsTable";
import { cn } from "@/lib/utils";

export interface DeskData {
  slug: CategorySlug;
  articles: Article[];
  standings?: StandingRow[];
}

/** One panel per league: its lead story, latest headlines and the top of the table. */
export default function LeagueDesk({ desks }: { desks: DeskData[] }) {
  const [active, setActive] = useState(desks[0]?.slug);
  const reduce = useReducedMotion();
  const baseId = useId();
  const desk = desks.find((d) => d.slug === active) ?? desks[0];
  if (!desk) return null;
  const theme = leagueTheme(desk.slug);
  const category = getCategory(desk.slug);
  const [lead, ...rest] = desk.articles;

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = desks[(index + dir + desks.length) % desks.length];
    setActive(next.slug);
    document.getElementById(`${baseId}-tab-${next.slug}`)?.focus();
  }

  return (
    <section aria-labelledby={`${baseId}-title`} className="py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id={`${baseId}-title`} className="font-display text-4xl font-black leading-none text-ink sm:text-5xl">
            League desk
          </h2>
          <div role="tablist" aria-label="Choose a league" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {desks.map((d, i) => {
              const selected = d.slug === desk.slug;
              const t = leagueTheme(d.slug);
              return (
                <button
                  key={d.slug}
                  id={`${baseId}-tab-${d.slug}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(d.slug)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold transition-colors",
                    selected ? "text-white" : "bg-white text-ink/75 ring-1 ring-line hover:text-ink"
                  )}
                  style={selected ? { background: t.deep } : undefined}
                >
                  <LeagueCrest slug={d.slug} size={26} />
                  {getCategory(d.slug)?.shortName}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${desk.slug}`}
          className="relative mt-6 overflow-hidden rounded-3xl"
          style={{ background: theme.deep }}
        >
          <div className="pitch-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={desk.slug}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24, transition: { duration: 0.15 } }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.25fr_1fr_340px] lg:p-8"
            >
              {lead ? (
                <ArticleCard article={lead} size="overlay" className="lg:row-span-1" />
              ) : (
                <p className="text-white/70">No {category?.name} stories yet.</p>
              )}
              <div className="flex flex-col gap-3">
                {rest.slice(0, 4).map((a) => (
                  <Link
                    key={a.slug}
                    href={`/article/${a.slug}`}
                    className="group flex gap-3 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10 transition-colors hover:bg-white/[0.12]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-3 font-display text-[21px] font-extrabold leading-[1.05] text-white">{a.title}</span>
                    </span>
                  </Link>
                ))}
                <Link
                  href={`/category/${desk.slug}`}
                  className="mt-auto inline-flex w-fit items-center rounded-full px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.03]"
                  style={{ background: theme.tint, color: theme.onTint }}
                >
                  Open the {category?.name} hub
                </Link>
              </div>
              {desk.standings && desk.standings.length > 0 ? (
                <div className="rounded-2xl bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-black text-ink">Table</h3>
                    <Link href={`/category/${desk.slug}#table`} className="text-sm font-bold text-indigo hover:text-sky-dark">
                      Full table
                    </Link>
                  </div>
                  <MiniTable rows={desk.standings} limit={6} accent={theme.deep} />
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.07] p-5 text-white ring-1 ring-white/10">
                  <h3 className="font-display text-2xl font-black">{category?.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{theme.blurb}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
