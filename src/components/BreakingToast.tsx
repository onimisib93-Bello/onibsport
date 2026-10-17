"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, LightningA } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";

const SEEN_KEY = "onibsport-toast-seen";
const VISIBLE_MS = 9000;

export default function BreakingToast({ article }: { article: Article | undefined }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!article) return;
    try {
      if (sessionStorage.getItem(SEEN_KEY) === article.slug) return;
    } catch {
      // fall through
    }
    const showTimer = setTimeout(() => {
      setVisible(true);
      try {
        sessionStorage.setItem(SEEN_KEY, article.slug);
      } catch {
        // Best-effort only.
      }
    }, 3000);
    return () => clearTimeout(showTimer);
  }, [article]);

  useEffect(() => {
    if (!visible || hovered) return;
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(hideTimer);
  }, [visible, hovered]);

  function dismiss() {
    setVisible(false);
    try {
      if (article) sessionStorage.setItem(SEEN_KEY, article.slug);
    } catch {
      // Best-effort only.
    }
  }

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-24 z-[70] flex justify-center px-3">
      <AnimatePresence>
        {article && visible && (
          <motion.div
            key={article.slug}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.8, bottom: 0 }}
            onDragEnd={(_, info) => info.offset.y < -40 && dismiss()}
            className="pointer-events-auto relative flex w-full max-w-lg items-center gap-3 overflow-hidden rounded-2xl bg-night py-3 pl-3 pr-2 text-white shadow-[0_24px_60px_-20px_rgb(18_10_51/0.7)]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange text-ink">
              <LightningA size={20} weight="fill" />
            </span>
            <Link href={`/article/${article.slug}`} onClick={dismiss} className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-orange">Breaking</span>
              <span className="line-clamp-2 text-sm font-semibold leading-snug hover:underline">{article.title}</span>
            </Link>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss breaking news alert"
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X size={16} weight="bold" />
            </button>
            {!reduce && !hovered && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-orange"
                style={{ animation: `progress-fill ${VISIBLE_MS}ms linear forwards` }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
