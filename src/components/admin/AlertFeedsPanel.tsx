"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Plus, Rss, Trash, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export interface FeedRow {
  url: string;
  origin: "admin" | "vercel";
  id?: string;
  keyword: string;
  ok: boolean;
  count: number;
}

/**
 * The Google Alerts feeding the AI Desk: each alert's keyword, how many
 * stories it has now, and a box to add a new alert by pasting its RSS link.
 */
export default function AlertFeedsPanel({ feeds }: { feeds: FeedRow[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const broken = feeds.filter((f) => !f.ok).length;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdded(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/alert-feeds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Couldn't add that alert.");
      setAdded(`Added "${data.feed?.keyword ?? "alert"}". Its stories are now in the queue below.`);
      setUrl("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that alert.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(feed: FeedRow) {
    if (!feed.id || !window.confirm(`Stop reading the "${feed.keyword}" alert? You can add it again any time.`)) return;
    setBusy(true);
    await fetch(`/api/admin/alert-feeds/${feed.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <details className="group mt-6 rounded-2xl bg-white ring-1 ring-line" open={feeds.length === 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span className="flex items-center gap-2 font-semibold text-ink">
          <Rss size={20} weight="bold" className="text-orange-deep" aria-hidden="true" />
          Your Google Alerts ({feeds.length})
          {broken > 0 && <span className="rounded-full bg-[#fdecec] px-2 py-0.5 text-xs font-bold text-[#a12226]">{broken} not working</span>}
        </span>
        <span className="text-sm font-semibold text-indigo group-open:hidden">Manage or add an alert</span>
        <span className="hidden text-sm font-semibold text-indigo group-open:inline">Close</span>
      </summary>

      <div className="border-t border-line p-4">
        <form onSubmit={add} className="rounded-xl bg-paper p-4">
          <label htmlFor="alert-feed-url" className="block text-sm font-bold text-ink">
            Add a new alert
          </label>
          <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-xs text-muted">
            <li>
              At{" "}
              <a href="https://www.google.com/alerts" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo underline">
                google.com/alerts
              </a>
              , create the alert. Under <span className="font-semibold">Show options</span>, set <span className="font-semibold">Deliver to</span> to{" "}
              <span className="font-semibold">RSS feed</span>.
            </li>
            <li>
              In your list of alerts, right-click the orange <span className="font-semibold">RSS icon</span> next to it and choose{" "}
              <span className="font-semibold">Copy link address</span>.
            </li>
            <li>Paste it here.</li>
          </ol>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              id="alert-feed-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              placeholder="https://www.google.com/alerts/feeds/…"
              className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
            />
            <button
              type="submit"
              disabled={busy || !url.trim()}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={16} weight="bold" aria-hidden="true" />
              {busy ? "Checking…" : "Add alert"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-[#a12226]">
              {error}
            </p>
          )}
          {added && (
            <p role="status" className="mt-2 text-sm text-[#17663b]">
              {added}
            </p>
          )}
        </form>

        {feeds.length > 0 && (
          <ul className="mt-4 divide-y divide-line">
            {feeds.map((f) => (
              <li key={f.url} className="flex items-center gap-3 py-2.5">
                {f.ok ? (
                  <CheckCircle size={18} weight="fill" className="shrink-0 text-[#1a8f4c]" aria-label="Working" />
                ) : (
                  <WarningCircle size={18} weight="fill" className="shrink-0 text-[#c42b2e]" aria-label="Not working" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{f.keyword}</p>
                  <p className={cn("text-xs", f.ok ? "text-muted" : "text-[#a12226]")}>
                    {f.ok ? `${f.count} ${f.count === 1 ? "story" : "stories"} right now` : "Couldn't be read. Check the link, or remove it and add it again."}
                    {f.origin === "vercel" && " · from the Vercel setting"}
                  </p>
                </div>
                {f.origin === "admin" && f.id && (
                  <button type="button" disabled={busy} onClick={() => void remove(f)} aria-label={`Remove ${f.keyword}`} className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-[#a12226] hover:bg-[#fdecec]">
                    <Trash size={15} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
