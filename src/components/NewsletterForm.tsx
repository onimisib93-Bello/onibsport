"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Email capture used in the footer and the newsletter popup. There's no
 * mailing-list provider wired in yet — connect one in handleSubmit.
 */
export default function NewsletterForm({ tone = "light", onDone }: { tone?: "light" | "dark"; onDone?: () => void }) {
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubscribed(true);
    if (onDone) setTimeout(onDone, 1800);
  }

  if (subscribed) {
    return (
      <p role="status" className={cn("flex items-center gap-2 text-sm font-semibold", tone === "dark" ? "text-white" : "text-ink")}>
        <CheckCircle size={22} weight="fill" className="shrink-0 text-sky" />
        Subscribed. The next big story lands in your inbox first.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label className="sr-only" htmlFor={`newsletter-${tone}`}>
        Email address
      </label>
      <input
        id={`newsletter-${tone}`}
        type="email"
        required
        autoComplete="email"
        placeholder="you@email.com"
        className={cn(
          "h-11 min-w-0 flex-1 rounded-full border px-4 text-sm focus:outline-none",
          tone === "dark"
            ? "border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-orange"
            : "border-line bg-white text-ink placeholder:text-muted focus:border-indigo"
        )}
      />
      <button type="submit" className="h-11 shrink-0 cursor-pointer rounded-full bg-orange px-5 text-sm font-bold text-ink transition-colors hover:bg-gold">
        Subscribe
      </button>
    </form>
  );
}
