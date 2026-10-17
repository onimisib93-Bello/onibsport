"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Category, Fixture } from "@/lib/types";
import MatchCard from "@/components/MatchCard";
import LeagueCrest from "@/components/ui/LeagueCrest";
import LiveDot from "@/components/ui/LiveDot";
import { DayGroups } from "@/components/LeagueDataTabs";
import { leagueTheme } from "@/lib/leagues";
import { formatDay } from "@/lib/time";
import { cn } from "@/lib/utils";

export type ScoresView = "date" | "results" | "fixtures";

function shift(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Scores page controls and lists. Everything lives in the URL
 * (?date=, ?league=, ?view=) so any day or filter can be shared.
 */
export default function LiveScoresView({
  fixtures,
  categories,
  date,
  today,
  league,
  view,
}: {
  fixtures: Fixture[];
  categories: Category[];
  date: string;
  today: string;
  league: string;
  view: ScoresView;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const stripRef = useRef<HTMLDivElement>(null);

  function go(next: Partial<{ date: string; league: string; view: ScoresView }>) {
    const params = new URLSearchParams();
    const v = next.view ?? view;
    const d = next.date ?? date;
    const l = next.league ?? league;
    if (v !== "date") params.set("view", v);
    if (v === "date" && d !== today) params.set("date", d);
    if (l !== "all") params.set("league", l);
    const qs = params.toString();
    startTransition(() => router.push(`/live-scores${qs ? `?${qs}` : ""}`, { scroll: false }));
  }

  // Keep the selected day centred in the date strip.
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>("[aria-current='date']");
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [date, reduce]);

  const days = Array.from({ length: 15 }, (_, i) => shift(date, i - 7));
  const filtered = league === "all" ? fixtures : fixtures.filter((f) => f.league === league);
  const live = filtered.filter((f) => f.status === "live");
  const notLive = filtered.filter((f) => f.status !== "live");

  const byLeague = categories
    .map((c) => ({ category: c, items: notLive.filter((f) => f.league === c.slug) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      {/* View switch */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["date", "By date"],
            ["results", "Latest results"],
            ["fixtures", "Upcoming fixtures"],
          ] as [ScoresView, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => go({ view: v })}
            aria-pressed={view === v}
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-colors",
              view === v ? "bg-night text-white" : "bg-white text-ink/70 ring-1 ring-line hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date strip + picker */}
      {view === "date" && (
        <div className="mt-5 flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => go({ date: shift(date, -1) })}
            aria-label="Previous day"
            className="grid w-11 shrink-0 cursor-pointer place-items-center rounded-2xl bg-white ring-1 ring-line hover:ring-ink"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <div ref={stripRef} className="no-scrollbar flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto" role="list" aria-label="Choose a day">
            {days.map((d) => {
              const selected = d === date;
              return (
                <button
                  key={d}
                  role="listitem"
                  type="button"
                  onClick={() => go({ date: d })}
                  aria-current={selected ? "date" : undefined}
                  className={cn(
                    "flex w-[68px] shrink-0 cursor-pointer snap-center flex-col items-center rounded-2xl py-2 transition-colors",
                    selected ? "bg-orange text-ink" : "bg-white text-ink ring-1 ring-line hover:ring-ink"
                  )}
                >
                  <span className="text-xs font-semibold opacity-75">{d === today ? "Today" : formatDay(`${d}T12:00:00Z`, { weekday: "short" })}</span>
                  <span className="font-display text-2xl font-black leading-none">{formatDay(`${d}T12:00:00Z`, { day: "numeric" })}</span>
                  <span className="text-[11px] font-semibold opacity-70">{formatDay(`${d}T12:00:00Z`, { month: "short" })}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => go({ date: shift(date, 1) })}
            aria-label="Next day"
            className="grid w-11 shrink-0 cursor-pointer place-items-center rounded-2xl bg-white ring-1 ring-line hover:ring-ink"
          >
            <CaretRight size={18} weight="bold" />
          </button>
          <label className="relative hidden shrink-0 cursor-pointer items-center gap-2 rounded-2xl bg-white px-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-sky sm:flex">
            <CalendarBlank size={18} weight="bold" className="text-muted" aria-hidden="true" />
            <span className="sr-only">Pick any date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && go({ date: e.target.value })}
              className="w-[8.5rem] bg-transparent text-sm font-semibold text-ink focus:outline-none"
            />
          </label>
        </div>
      )}
      {view === "date" && (
        <label className="mt-2 flex h-11 items-center gap-2 rounded-2xl bg-white px-3 ring-1 ring-line sm:hidden">
          <CalendarBlank size={18} weight="bold" className="text-muted" aria-hidden="true" />
          <span className="text-sm text-muted">Pick any date</span>
          <input type="date" value={date} onChange={(e) => e.target.value && go({ date: e.target.value })} className="ml-auto bg-transparent text-sm font-semibold text-ink focus:outline-none" />
        </label>
      )}

      {/* League filter */}
      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => go({ league: "all" })}
          aria-pressed={league === "all"}
          className={cn(
            "shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-colors",
            league === "all" ? "bg-indigo text-white" : "bg-white text-ink/70 ring-1 ring-line hover:text-ink"
          )}
        >
          All competitions
        </button>
        {categories.map((c) => {
          const selected = league === c.slug;
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => go({ league: c.slug })}
              aria-pressed={selected}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold transition-colors",
                selected ? "text-white" : "bg-white text-ink/70 ring-1 ring-line hover:text-ink"
              )}
              style={selected ? { background: leagueTheme(c.slug).deep } : undefined}
            >
              <LeagueCrest slug={c.slug} size={24} />
              {c.shortName}
            </button>
          );
        })}
      </div>

      <div className={cn("mt-8 transition-opacity", pending && "opacity-50")} aria-busy={pending}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${view}-${date}-${league}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.3 }}
          >
            {view === "date" && (
              <h2 className="mb-5 font-display text-3xl font-black text-ink">
                {date === today ? "Today, " : ""}
                {formatDay(`${date}T12:00:00Z`, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h2>
            )}

            {live.length > 0 && (
              <section className="mb-8">
                <h3 className="mb-3 flex items-center gap-2 font-display text-2xl font-black text-ink">
                  <LiveDot className="h-2.5 w-2.5" />
                  Live now
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {live.map((f) => (
                    <MatchCard key={f.id} fixture={f} showLeague />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
                <p className="font-display text-3xl font-black text-ink">No matches</p>
                <p className="mt-2 text-muted">
                  {view === "date" ? "Nothing scheduled in these competitions on this day. Try the next matchday." : "Nothing to show for this filter yet."}
                </p>
                {view === "date" && (
                  <button type="button" onClick={() => go({ date: shift(date, 1) })} className="mt-4 cursor-pointer rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo">
                    Check the next day
                  </button>
                )}
              </div>
            )}

            {view === "date" ? (
              <div className="space-y-8">
                {byLeague.map(({ category, items }) => (
                  <section key={category.slug} aria-labelledby={`league-${category.slug}`}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 id={`league-${category.slug}`} className="flex items-center gap-2.5 font-display text-2xl font-black text-ink">
                        <LeagueCrest slug={category.slug} size={30} />
                        {category.name}
                      </h3>
                      <Link href={`/category/${category.slug}#match-centre`} className="text-sm font-bold text-indigo hover:text-sky-dark">
                        {category.shortName} hub
                      </Link>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {items.map((f) => (
                        <MatchCard key={f.id} fixture={f} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              notLive.length > 0 && <DayGroups fixtures={notLive} showLeague />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
