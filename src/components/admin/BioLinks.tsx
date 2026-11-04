"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowSquareOut, Check, Copy, FacebookLogo, InstagramLogo, LinkSimple, ThreadsLogo, TiktokLogo, XLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

const noSubscribe = () => () => {};

const NETWORKS = [
  { id: "instagram", label: "Instagram", Icon: InstagramLogo },
  { id: "tiktok", label: "TikTok", Icon: TiktokLogo },
  { id: "x", label: "X", Icon: XLogo },
  { id: "facebook", label: "Facebook", Icon: FacebookLogo },
  { id: "threads", label: "Threads", Icon: ThreadsLogo },
  { id: "youtube", label: "YouTube", Icon: YoutubeLogo },
] as const;

/** The link-in-bio hub address for one network, tagged so analytics show where readers came from. */
export function bioLink(origin: string, network: string) {
  return `${origin}/links?utm_source=${network}`;
}

/** The admin dashboard's "Your bio link" box: one hub link per network, ready to paste into each bio. */
export default function BioLinks() {
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string) {
    try {
      await navigator.clipboard.writeText(bioLink(origin, id));
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
    } catch {
      // Clipboard blocked: the link is shown, so it can be copied by hand.
    }
  }

  return (
    <section aria-labelledby="bio-links" className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="bio-links" className="flex items-center gap-2 font-display text-2xl font-black text-ink">
            <LinkSimple size={22} weight="bold" className="text-indigo" aria-hidden="true" />
            Your bio link
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Set this once in each profile&apos;s bio and never change it. The page has Latest News, Watch Full Videos, Live Scores, the newest stories and all your
            accounts. Each network has its own copy so analytics show where readers came from.
          </p>
        </div>
        <a
          href="/links"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-night px-4 py-2 text-sm font-bold text-white hover:bg-indigo"
        >
          <ArrowSquareOut size={16} weight="bold" aria-hidden="true" />
          Open the page
        </a>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {NETWORKS.map(({ id, label, Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => copy(id)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-paper px-3 py-2.5 text-left ring-1 ring-line hover:ring-ink"
            >
              <Icon size={20} weight="fill" className="shrink-0 text-ink" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">{label}</span>
                <span className="block truncate font-mono text-[11px] text-muted">{origin ? bioLink(origin, id).replace(/^https?:\/\//, "") : "/links"}</span>
              </span>
              {copied === id ? (
                <Check size={18} weight="bold" className="shrink-0 text-[#1f7a4a]" aria-label="Copied" />
              ) : (
                <Copy size={18} weight="bold" className="shrink-0 text-muted" aria-label={`Copy the ${label} bio link`} />
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
