"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import VaporizeTextCycle, { Tag } from "@/components/ui/vapour-text-effect";
import LeagueOrbit from "@/components/ui/integration-card";
import LeagueCrest from "@/components/ui/LeagueCrest";
import { categories } from "@/lib/data/categories";
import { useDisplayFont } from "@/lib/useDisplayFont";
import { useMediaQuery } from "@/lib/useMediaQuery";

const CYCLE = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Champions League", "Super Eagles", "NPFL"];

export default function LeagueHubs() {
  const family = useDisplayFont();
  const reduce = useReducedMotion();
  const narrow = useMediaQuery("(max-width: 640px)");

  return (
    <section aria-labelledby="league-hubs-title" className="relative overflow-hidden bg-night text-white">
      <div className="pitch-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-24">
        <div>
          <h2 id="league-hubs-title" className="font-display text-5xl font-black leading-[0.9] sm:text-6xl">
            Every league,
            <br />
            its own desk
          </h2>
          <div className="mt-4 h-[64px] sm:h-[88px]" aria-hidden="true">
            {family && !reduce ? (
              <VaporizeTextCycle
                texts={CYCLE}
                font={{ fontFamily: family, fontSize: narrow ? "52px" : "78px", fontWeight: 900 }}
                color="rgb(247, 148, 29)"
                spread={4}
                density={6}
                animation={{ vaporizeDuration: 1.6, fadeInDuration: 0.8, waitDuration: 1.4 }}
                direction="left-to-right"
                alignment="left"
                tag={Tag.P}
              />
            ) : (
              <p className="font-display text-[52px] font-black leading-none text-orange sm:text-[78px]">{CYCLE[0]}</p>
            )}
          </div>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/70">
            News, results, fixtures and tables for each competition we follow — pick a hub and go straight to it.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-2 sm:max-w-lg">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-sm font-semibold ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] hover:ring-white/25"
                >
                  <LeagueCrest slug={c.slug} size={26} />
                  <span className="truncate">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <LeagueOrbit className="mx-auto max-w-[640px]" />
      </div>
    </section>
  );
}
