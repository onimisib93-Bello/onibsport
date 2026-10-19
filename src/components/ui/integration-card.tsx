"use client";

/**
 * Adapted from the "integration card" effect: dashed light pulses travel from
 * a central hub out to peripheral nodes. Here the hub is Onibsport and each
 * node is a league desk, linked to its hub page.
 */
import { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CategorySlug } from "@/lib/types";
import { leagueTheme } from "@/lib/leagues";
import { getCategory } from "@/lib/data/categories";
import LeagueCrest from "@/components/ui/LeagueCrest";
import { cn } from "@/lib/utils";

interface OrbitNode {
  slug: CategorySlug;
  x: number;
  y: number;
  path: string;
}

// Coordinates live in a 564×410 box with the hub at (282, 205).
const NODES: OrbitNode[] = [
  { slug: "premier-league", x: 110, y: 90, path: "M 270 205 V 105 Q 270 90 255 90 H 110" },
  { slug: "la-liga", x: 360, y: 60, path: "M 294 205 V 75 Q 294 60 309 60 H 360" },
  { slug: "transfers", x: 490, y: 115, path: "M 314 195 V 130 Q 314 115 329 115 H 490" },
  { slug: "world-football", x: 190, y: 40, path: "M 258 195 V 55 Q 258 40 243 40 H 190" },
  { slug: "serie-a", x: 120, y: 205, path: "M 250 205 H 120" },
  { slug: "bundesliga", x: 470, y: 225, path: "M 314 225 H 470" },
  { slug: "npfl", x: 110, y: 335, path: "M 250 215 V 320 Q 250 335 235 335 H 110" },
  { slug: "nigeria-football", x: 282, y: 370, path: "M 282 235 V 370" },
  { slug: "champions-league", x: 455, y: 345, path: "M 314 235 V 330 Q 314 345 329 345 H 455" },
];

function AnimatedPath({ d, id, color, index, reduce }: { d: string; id: string; color: string; index: number; reduce: boolean }) {
  return (
    <>
      <path d={d} stroke="rgb(255 255 255 / 0.14)" strokeWidth="1" fill="none" />
      {!reduce && (
        <motion.path
          d={d}
          stroke={`url(#${id})`}
          strokeWidth="2"
          fill="none"
          strokeDasharray="40 160"
          initial={{ strokeDashoffset: 200 }}
          animate={{ strokeDashoffset: -200 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: (index * 0.37) % 2 }}
        />
      )}
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </>
  );
}

export function LeagueOrbit({ className }: { className?: string }) {
  const containerId = useId().replace(/:/g, "");
  const reduce = useReducedMotion() === true;

  return (
    <div className={cn("relative aspect-[564/410] w-full", className)}>
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: "radial-gradient(circle, rgb(255 255 255 / 0.5) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-night)_78%)]" aria-hidden="true" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 564 410" fill="none" aria-hidden="true">
        {NODES.map((node, i) => (
          <AnimatedPath key={node.slug} d={node.path} id={`${containerId}-${node.slug}`} color={leagueTheme(node.slug).tint} index={i} reduce={reduce} />
        ))}
      </svg>

      {/* Hub */}
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-1.5 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.6)] sm:rounded-3xl sm:p-2.5">
        <div className="rounded-xl border border-line p-1.5 sm:rounded-2xl sm:p-2.5">
          <Image src="/logo.png" alt="Onibsport" width={56} height={49} className="h-7 w-auto sm:h-12" />
        </div>
        {!reduce && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-orange sm:rounded-3xl"
            animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* League nodes */}
      {NODES.map((node, i) => {
        const category = getCategory(node.slug);
        return (
          <motion.div
            key={node.slug}
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
            style={{ left: `${(node.x / 564) * 100}%`, top: `${(node.y / 410) * 100}%` }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <Link
              href={`/category/${node.slug}`}
              aria-label={category?.name}
              className="group relative grid place-items-center rounded-xl bg-night-2 p-1 ring-1 ring-white/15 transition-transform duration-300 hover:scale-110 hover:ring-white/40 sm:rounded-2xl sm:p-1.5"
            >
              <LeagueCrest slug={node.slug} size={28} className="sm:hidden" />
              <LeagueCrest slug={node.slug} size={44} className="hidden sm:grid" />
              <span className="pointer-events-none absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2 py-1 text-xs font-bold text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
                {category?.name}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

export default LeagueOrbit;
