"use client";

import { useEffect, useState } from "react";
import { TwitterLogo, FacebookLogo, WhatsappLogo, LinkSimple, Check } from "@phosphor-icons/react/dist/ssr";

export default function ShareBar({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(path);

  useEffect(() => {
    const id = requestAnimationFrame(() => setUrl(`${window.location.origin}${path}`));
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
    { label: "Share on X", Icon: TwitterLogo, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { label: "Share on Facebook", Icon: FacebookLogo, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "Share on WhatsApp", Icon: WhatsappLogo, href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];

  return (
    <div className="flex items-center gap-2 border-y border-line py-4">
      <span className="mr-1 text-sm font-semibold text-muted">Share</span>
      {links.map(({ label, Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="grid h-9 w-9 place-items-center rounded-full bg-paper text-ink/70 transition-colors hover:bg-indigo hover:text-white"
        >
          <Icon size={18} weight="fill" />
        </a>
      ))}
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="grid h-9 w-9 place-items-center rounded-full bg-paper text-ink/70 transition-colors hover:bg-indigo hover:text-white"
      >
        {copied ? <Check size={18} weight="bold" /> : <LinkSimple size={18} weight="bold" />}
      </button>
    </div>
  );
}
