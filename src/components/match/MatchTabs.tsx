"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MatchTab {
  id: string;
  label: string;
  content: ReactNode;
}

/** Summary / Stats / Line-ups / Table tabs. The chosen tab is kept in the URL hash so it survives live refreshes and can be shared. */
export default function MatchTabs({ tabs }: { tabs: MatchTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const fromHash = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === fromHash)) setActive(fromHash);
    }, 0);
    return () => window.clearTimeout(id);
  }, [tabs]);

  function choose(id: string) {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    choose(next.id);
    document.getElementById(`match-tab-${next.id}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Match details" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`match-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`match-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => choose(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-colors",
              active === t.id ? "bg-night text-white" : "bg-white text-ink/70 ring-1 ring-line hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`match-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`match-tab-${t.id}`}
          hidden={active !== t.id}
          className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-line sm:p-8"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
