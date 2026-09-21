"use client";

import { useEffect, useState } from "react";
import { X, EnvelopeSimple, CheckCircle } from "@phosphor-icons/react/dist/ssr";

const DISMISS_KEY = "onibsport-newsletter-dismissed";

export default function NewsletterModal() {
  const [visible, setVisible] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // sessionStorage unavailable (private mode) — fall through and show once.
    }
    const timer = setTimeout(() => setVisible(true), 15000);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(dismiss, 1800);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Subscribe to the Onibsport newsletter"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-sm rounded-xl border border-line bg-white p-5 shadow-xl sm:right-4 sm:left-auto animate-[slide-up_0.4s_ease-out]"
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink"
      >
        <X size={16} weight="bold" />
      </button>

      {subscribed ? (
        <div className="flex items-center gap-3 py-2 pr-6">
          <CheckCircle size={28} weight="fill" className="shrink-0 text-sky" />
          <p className="text-sm font-semibold text-ink">Subscribed! Watch your inbox for the next breaking story.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 pr-6">
            <EnvelopeSimple size={20} weight="fill" className="text-orange" />
            <h3 className="font-display text-xl tracking-wide text-ink">Get the headlines first</h3>
          </div>
          <p className="mt-1.5 text-sm text-muted">Breaking football news, straight to your inbox. No spam.</p>
          <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
            <input
              type="email"
              required
              placeholder="you@email.com"
              aria-label="Email address"
              className="min-w-0 flex-1 rounded-full border border-line px-4 py-2 text-sm focus:border-indigo focus:outline-none"
            />
            <button type="submit" className="shrink-0 rounded-full bg-indigo px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-dark">
              Join
            </button>
          </form>
        </>
      )}
    </div>
  );
}
