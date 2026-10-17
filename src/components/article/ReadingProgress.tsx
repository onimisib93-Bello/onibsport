"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin bar under the header that fills as the story is read. */
export default function ReadingProgress({ color = "#f7941d" }: { color?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left"
      style={{ scaleX, background: color }}
    />
  );
}
