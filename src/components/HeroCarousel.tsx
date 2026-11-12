"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";
import { leagueTheme } from "@/lib/leagues";
import TimeAgo from "@/components/ui/TimeAgo";
import NewsImage from "@/components/ui/NewsImage";
import ViewTransition, { storyPhotoName } from "@/components/fx/ViewTransition";
import { cn } from "@/lib/utils";

const SLIDE_MS = 7000;

/**
 * Front-page stage: the lead stories as a swipeable slideshow, with the
 * running order beside it. Each story's bar fills while it is on screen and
 * the next one follows; hovering, focusing or pausing holds it.
 */
export default function HeroCarousel({ articles }: { articles: Article[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 28 });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const reduce = useReducedMotion();
  const autoplay = !reduce && !paused && !held && articles.length > 1;

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const hold = () => setHeld(true);
    const release = () => setHeld(false);
    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", hold);
    emblaApi.on("pointerUp", release);
    const id = requestAnimationFrame(onSelect);
    return () => {
      cancelAnimationFrame(id);
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", hold);
      emblaApi.off("pointerUp", release);
    };
  }, [emblaApi, onSelect]);

  if (articles.length === 0) return null;
  const current = articles[selected] ?? articles[0];
  const currentCategory = getCategory(current.category);
  const theme = leagueTheme(current.category);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Top stories"
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      <div data-parallax="" className="stage-in grain relative overflow-hidden rounded-3xl bg-night">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {articles.map((article, i) => (
              <div
                key={article.slug}
                className="relative min-w-0 flex-[0_0_100%] overflow-hidden"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${articles.length}`}
                aria-hidden={i !== selected}
              >
                <Link href={`/article/${article.slug}`} tabIndex={i === selected ? 0 : -1} data-cursor="Read story" className="group block">
                  <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10] lg:aspect-auto lg:h-[min(72vh,640px)]">
                    {/* The photo drifts against the pointer, and grows into the lead photo of the article when the story is opened. */}
                    <ViewTransition name={storyPhotoName(article.slug)} share="morph" default="none">
                      <div className="parallax-layer absolute inset-0">
                        <NewsImage
                      src={article.image || article.coverImage} focus={article.imageFocus}
                      alt={article.imageAlt}
                      fill
                      priority={i === 0}
                      sizes="(min-width: 1024px) 70vw, 100vw"
                      className={cn(
                        "object-cover transition-transform ease-out",
                        i === selected && !reduce ? "scale-100 duration-[7000ms]" : "scale-[1.08] duration-0"
                      )}
                    />
                      </div>
                    </ViewTransition>
                    <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-night/0" />
                    <div className="absolute inset-0 bg-gradient-to-r from-night/60 via-transparent to-transparent" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Story-style progress segments */}
        <div className="pointer-events-none absolute inset-x-5 top-5 z-[2] flex gap-1.5 sm:inset-x-7 sm:top-7" aria-hidden="true">
          {articles.map((a, i) => (
            <span key={a.slug} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <span
                key={`${selected}-${i}`}
                className={cn("absolute inset-0 origin-left rounded-full bg-white", i < selected ? "scale-x-100" : "scale-x-0")}
                style={
                  i === selected
                    ? autoplay
                      ? { animation: `progress-fill ${SLIDE_MS}ms linear forwards` }
                      : { transform: "scaleX(1)" }
                    : undefined
                }
                onAnimationEnd={i === selected ? () => emblaApi?.scrollNext() : undefined}
              />
            </span>
          ))}
        </div>

        {/* Headline for the current slide */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] p-5 pb-20 sm:p-8 sm:pb-24 lg:p-10 lg:pb-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.slug}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              transition={{ duration: 0.35 }}
              className="max-w-3xl"
            >
              <div className="flex flex-wrap items-center gap-2">
                {current.isBreaking && <span className="rounded-md bg-orange px-2.5 py-1 text-xs font-bold text-ink">Breaking</span>}
                {currentCategory && (
                  <span className="rounded-md px-2.5 py-1 text-xs font-bold" style={{ background: theme.tint, color: theme.onTint }}>
                    {currentCategory.name}
                  </span>
                )}
                <TimeAgo iso={current.publishedAt} className="text-xs font-medium text-white/70" />
              </div>
              {/* Each word rises out of its own line, one after another. */}
              <h2 aria-label={current.title} className="mt-3 font-display text-[36px] font-black leading-[0.94] text-white sm:text-[52px] xl:text-[64px]">
                {current.title.split(/\s+/).map((word, i) => (
                  <span key={i} aria-hidden="true" className="-my-[0.1em] mr-[0.22em] inline-block overflow-hidden py-[0.1em] align-bottom">
                    <motion.span
                      className="inline-block"
                      initial={reduce ? false : { y: "110%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.05 + i * 0.045 }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </h2>
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
                className="mt-3 hidden max-w-2xl text-[17px] leading-relaxed text-white/80 sm:block"
              >
                {current.dek}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-5 right-5 z-[2] flex gap-2 sm:bottom-8 sm:right-8">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            data-magnetic="6"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 motion-reduce:hidden"
          >
            {paused ? <Play size={16} weight="fill" /> : <Pause size={16} weight="fill" />}
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous story"
            data-magnetic="6"
            className="hidden h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 sm:grid"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next story"
            data-magnetic="6"
            className="hidden h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 sm:grid"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Running order */}
      <ol className="hidden flex-col gap-2 lg:flex" aria-label="Top stories running order">
        {articles.map((article, i) => {
          const cat = getCategory(article.category);
          const active = i === selected;
          return (
            <li key={article.slug} className="load-in-side flex-1" style={{ "--i": i } as React.CSSProperties}>
              <button
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-current={active ? "true" : undefined}
                data-glow=""
                data-spot={active ? "" : "light"}
                className={cn(
                  "group relative flex h-full w-full cursor-pointer items-center gap-4 overflow-hidden rounded-2xl p-3 text-left transition-colors [--spot-size:260px]",
                  active ? "bg-night text-white" : "bg-white text-ink hover:bg-white/70"
                )}
              >
                <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-line">
                  <NewsImage src={article.image} focus={article.imageFocus} alt="" fill sizes="96px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className={cn("text-xs font-bold", active ? "text-orange" : "text-muted")}>{cat?.name}</span>
                  <span className="mt-1 line-clamp-3 block font-display text-[19px] font-extrabold leading-[1.05]">{article.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
