"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";
import { getCategory } from "@/lib/data/categories";

export default function HeroCarousel({ articles }: { articles: Article[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = introRef.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const badges = el.querySelectorAll("[data-hero-badge]");
      const heading = el.querySelector("[data-hero-heading]");
      const dek = el.querySelector("[data-hero-dek]");
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(badges, { opacity: 0, y: 8, duration: 0.35, stagger: 0.08 })
        .from(heading, { opacity: 0, y: 18, duration: 0.5 }, "-=0.15")
        .from(dek, { opacity: 0, y: 10, duration: 0.4 }, "-=0.25");
    });
    return () => mm.revert();
  }, []);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    const id = requestAnimationFrame(onSelect);
    return () => {
      cancelAnimationFrame(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const id = setInterval(() => emblaApi.scrollNext(), 6500);
    return () => clearInterval(id);
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {articles.map((article, i) => {
            const category = getCategory(article.category);
            return (
              <div className="relative min-w-0 flex-[0_0_100%]" key={article.slug}>
                <Link href={`/article/${article.slug}`} className="group block">
                  <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
                    <Image
                      src={article.image}
                      alt={article.imageAlt}
                      fill
                      priority={i === 0}
                      sizes="100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8" ref={i === 0 ? introRef : undefined}>
                      <div className="flex items-center gap-2">
                        {article.isBreaking && (
                          <span data-hero-badge className="rounded-full bg-orange px-3 py-1 text-xs font-bold text-white">
                            Breaking
                          </span>
                        )}
                        {category && (
                          <span data-hero-badge className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            {category.name}
                          </span>
                        )}
                      </div>
                      <h1
                        data-hero-heading={i === 0 ? true : undefined}
                        className="mt-3 max-w-3xl font-display text-3xl leading-[1.05] tracking-wide text-white sm:text-5xl"
                      >
                        {article.title}
                      </h1>
                      <p data-hero-dek={i === 0 ? true : undefined} className="mt-2 hidden max-w-xl text-white/80 sm:block">
                        {article.dek}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <button
        aria-label="Previous story"
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-white/40 sm:grid sm:place-items-center"
      >
        <CaretLeft size={20} weight="bold" />
      </button>
      <button
        aria-label="Next story"
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-white/40 sm:grid sm:place-items-center"
      >
        <CaretRight size={20} weight="bold" />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
        {articles.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${i === selected ? "w-5 bg-orange" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
