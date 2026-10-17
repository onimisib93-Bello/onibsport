"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react/dist/ssr";
import NewsletterForm from "@/components/NewsletterForm";

const DISMISS_KEY = "onibsport-newsletter-dismissed";

export default function NewsletterModal() {
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // sessionStorage unavailable (private mode) — fall through and show once.
    }
    const timer = setTimeout(() => setVisible(true), 25000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Best-effort only.
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="newsletter-title"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-sm overflow-hidden rounded-2xl bg-night text-white shadow-[0_30px_80px_-20px_rgb(18_10_51/0.7)] sm:left-auto sm:right-5 sm:bottom-5"
        >
          <div className="pitch-lines absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative p-5">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close newsletter sign-up"
              className="absolute right-3 top-3 grid h-9 w-9 cursor-pointer place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X size={16} weight="bold" />
            </button>
            <p className="font-display text-5xl font-black leading-none text-orange">90&apos;+</p>
            <h2 id="newsletter-title" className="mt-2 pr-8 font-display text-2xl font-extrabold leading-tight">
              Don&apos;t miss the late drama
            </h2>
            <p className="mt-1.5 text-sm text-white/65">The day&apos;s biggest stories and results in one email. No spam.</p>
            <div className="mt-4">
              <NewsletterForm tone="dark" onDone={dismiss} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
