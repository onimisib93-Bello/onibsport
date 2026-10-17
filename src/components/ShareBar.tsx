"use client";

import { useEffect, useState } from "react";
import { XLogo, FacebookLogo, WhatsappLogo, LinkSimple, Check, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/** Share links. `vertical` is the sticky rail beside the story on wide screens. */
export default function ShareBar({ title, path, vertical = false }: { title: string; path: string; vertical?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(path);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setUrl(`${window.location.origin}${path}`);
      setCanNativeShare(typeof navigator.share === "function");
    });
    return () => cancelAnimationFrame(id);
  }, [path]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing to recover from client-side here.
    }
  }

  const links = [
    { label: "Share on X", Icon: XLogo, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { label: "Share on Facebook", Icon: FacebookLogo, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "Share on WhatsApp", Icon: WhatsappLogo, href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];
  const btn = "grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white text-ink/75 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:bg-night hover:text-white hover:ring-night";

  return (
    <div className={cn("flex items-center gap-2", vertical ? "flex-col" : "flex-wrap")}>
      <span className={cn("text-sm font-semibold text-muted", vertical ? "mb-1" : "mr-1")}>Share</span>
      {links.map(({ label, Icon, href }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={btn}>
          <Icon size={18} weight="fill" />
        </a>
      ))}
      <button type="button" onClick={copyLink} aria-label={copied ? "Link copied" : "Copy link"} className={btn}>
        {copied ? <Check size={18} weight="bold" className="text-[#1f9d5c]" /> : <LinkSimple size={18} weight="bold" />}
      </button>
      {canNativeShare && !vertical && (
        <button type="button" onClick={() => navigator.share({ title, url }).catch(() => {})} aria-label="More sharing options" className={btn}>
          <ShareNetwork size={18} weight="bold" />
        </button>
      )}
      <span role="status" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
