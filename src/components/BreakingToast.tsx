"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, LightningA } from "@phosphor-icons/react/dist/ssr";
import { Article } from "@/lib/types";

const SEEN_KEY = "onibsport-toast-seen";

export default function BreakingToast({ article }: { article: Article | undefined }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!article) return;
    try {
      if (sessionStorage.getItem(SEEN_KEY) === article.slug) return;
    } catch {
      // fall through
    }
    const showTimer = setTimeout(() => setVisible(true), 3000);
    const hideTimer = setTimeout(() => setVisible(false), 11000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [article]);

  if (!article || !visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(SEEN_KEY, article!.slug);
    } catch {
      // Best-effort only.
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-20 z-[70] w-[92%] max-w-md -translate-x-1/2 animate-[toast-in_0.4s_ease-out] sm:w-full"
    >
      <div className="flex items-center gap-3 rounded-full border border-orange/30 bg-ink py-2.5 pl-4 pr-2 text-white shadow-lg">
        <LightningA size={18} weight="fill" className="shrink-0 text-orange" />
        <Link href={`/article/${article.slug}`} onClick={dismiss} className="min-w-0 flex-1 truncate text-sm font-semibold hover:underline">
          {article.title}
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss breaking news alert"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
