"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react/dist/ssr";

/** Popup player. Escape, the close button or a click outside closes it. */
export default function VideoModal({ src, title, onClose }: { src: string | null; title: string; onClose: () => void }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!src) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [src, onClose]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          className="fixed inset-0 z-[110] grid place-items-center bg-night/90 p-3 backdrop-blur-md sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-5xl"
            initial={reduce ? false : { scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Close video"
              className="absolute -top-12 right-0 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/15 text-white hover:bg-white/30"
            >
              <X size={18} weight="bold" />
            </button>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={src}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold text-white">{title}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
