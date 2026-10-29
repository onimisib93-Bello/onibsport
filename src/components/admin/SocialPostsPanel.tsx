"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Check,
  ClipboardText,
  DownloadSimple,
  FacebookLogo,
  ImageSquare,
  InstagramLogo,
  LinkSimple,
  ArrowSquareOut,
  ShareNetwork,
  Sparkle,
  ThreadsLogo,
  TiktokLogo,
  WhatsappLogo,
  XLogo,
} from "@phosphor-icons/react/dist/ssr";
import {
  SOCIAL_PLATFORMS,
  buildSocialPrompt,
  fillLink,
  imageTextFrom,
  withoutImageText,
  parseSocialSection,
  postLength,
  splitSocialSection,
  trackedLink,
  unfillLink,
  type SocialKit,
  type SocialPlatform,
} from "@/lib/ai/social";
import { cn } from "@/lib/utils";

const ICONS: Record<SocialPlatform, typeof XLogo> = {
  facebook: FacebookLogo,
  x: XLogo,
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
  whatsapp: WhatsappLogo,
  threads: ThreadsLogo,
};

const noSubscribe = () => () => {};

/**
 * The one share image for Facebook + Instagram and TikTok photo posts:
 * 1080 × 1350 portrait, made from the story photo, a teaser and the league.
 */
function ShareImage({ photos, tag, initialText }: { photos: { label: string; src: string }[]; tag?: string; initialText: string }) {
  const [text, setText] = useState(initialText);
  const [shownText, setShownText] = useState(initialText);
  const [photo, setPhoto] = useState(photos[0]?.src ?? "");
  const query = new URLSearchParams({ image: photo, text: shownText, ...(tag ? { tag } : {}) }).toString();
  const src = `/api/admin/social-image?${query}`;

  return (
    <div className="mt-5 border-t border-line pt-5">
      <h3 className="flex items-center gap-2 font-display text-xl font-black text-ink">
        <ImageSquare size={20} weight="bold" className="text-indigo" aria-hidden="true" />
        Share image
      </h3>
      <p className="mt-1 text-xs text-muted">
        One image for Facebook, Instagram and TikTok: 1080 × 1350 portrait (4:5). Instagram and Facebook show it full size in the feed; on TikTok it sits between
        thin bars, and the text is kept clear of TikTok&apos;s buttons.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- a generated PNG from our own route */}
        <img key={src} src={src} alt="Share image preview" width={1080} height={1350} className="aspect-[4/5] w-full max-w-[200px] rounded-xl bg-paper object-cover ring-1 ring-line" />
        <div className="space-y-3">
          {photos.length > 1 && (
            <div role="radiogroup" aria-label="Photo" className="flex flex-wrap gap-1.5">
              {photos.map((p) => (
                <button
                  key={p.src}
                  type="button"
                  role="radio"
                  aria-checked={photo === p.src}
                  onClick={() => setPhoto(p.src)}
                  className={cn(
                    "cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                    photo === p.src ? "bg-night text-white" : "bg-paper text-ink/70 hover:text-ink"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <div>
            <label htmlFor="share-image-text" className="text-xs font-bold text-ink">
              Teaser on the image
            </label>
            <input
              id="share-image-text"
              value={text}
              maxLength={90}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => setShownText(text)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setShownText(text);
                }
              }}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:border-indigo focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-muted">A question or an unfinished thought, never the answer. Press Enter to update the preview.</p>
          </div>
          <a
            href={`${src}&download=1`}
            download="onibsport-share-image.png"
            className="inline-flex items-center gap-1.5 rounded-full bg-night px-4 py-2 text-sm font-bold text-white hover:bg-indigo"
          >
            <DownloadSimple size={16} weight="bold" aria-hidden="true" />
            Download image
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Ready-to-post copy for each network, with the story's tracked link filled
 * in. Posts arrive with a Claude chat reply or an AI Desk draft, or can be
 * written for any story from here.
 */
export default function SocialPostsPanel({
  slug,
  published,
  article,
  photos = [],
  aiEnabled,
  kit,
  onKitChange,
}: {
  slug: string;
  published: boolean;
  article: { title: string; dek: string; body: string; hub?: string };
  /** Photos the share image can use, first is the default. */
  photos?: { label: string; src: string }[];
  aiEnabled: boolean;
  kit: SocialKit | null;
  onKitChange: (kit: SocialKit | null) => void;
}) {
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
  const [active, setActive] = useState<SocialPlatform>("facebook");
  const [copied, setCopied] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platforms = SOCIAL_PLATFORMS.filter((p) => kit?.[p.id]);
  const current = platforms.find((p) => p.id === active) ?? platforms[0];
  const articleUrl = origin && slug ? `${origin}/article/${slug}` : "";
  const link = current && articleUrl ? trackedLink(articleUrl, current.id) : "";
  const text = current && kit?.[current.id] ? (link ? fillLink(kit[current.id]!, link) : kit[current.id]!) : "";

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      window.setTimeout(() => setCopied((c) => (c === what ? null : c)), 2000);
    } catch {
      setError("Your browser blocked copying. Select the text and copy it by hand.");
    }
  }

  async function writeWithAi() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't write the posts. Try again.");
      onKitChange(data.social);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't write the posts. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyPrompt() {
    setError(null);
    await copy(buildSocialPrompt(article), "prompt");
    setPasteOpen(true);
  }

  function addPasted() {
    const [, section] = splitSocialSection(pasteText);
    const parsed = parseSocialSection(section ?? pasteText);
    if (Object.keys(parsed).length === 0) {
      setError("Couldn't find the FACEBOOK: / X: / INSTAGRAM: ... sections. Copy Claude's whole reply with the copy button on its code block.");
      return;
    }
    onKitChange(parsed);
    setPasteText("");
    setPasteOpen(false);
    setError(null);
  }

  const canWrite = article.title.trim() && article.body.trim();

  return (
    <section aria-labelledby="social-posts-title" className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <h2 id="social-posts-title" className="flex items-center gap-2 font-display text-2xl font-black text-ink">
          <ShareNetwork size={22} weight="bold" className="text-indigo" aria-hidden="true" />
          Social posts
        </h2>
        {kit && (
          <button type="button" onClick={() => onKitChange(null)} className="cursor-pointer text-xs font-semibold text-muted hover:text-ink">
            Start over
          </button>
        )}
      </div>

      {!kit && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted">
            One post for Facebook + Instagram, a TikTok photo post, and posts for X, WhatsApp and Threads, each linking back to this story with tracking so you can
            see which network sends readers.
          </p>
          <div className="flex flex-wrap gap-2">
            {aiEnabled && (
              <button
                type="button"
                onClick={writeWithAi}
                disabled={busy || !canWrite}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-night px-4 py-2 text-sm font-bold text-white hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkle size={16} weight="fill" className={busy ? "animate-spin text-orange" : "text-orange"} aria-hidden="true" />
                {busy ? "Writing posts…" : "Write social posts"}
              </button>
            )}
            <button
              type="button"
              onClick={copyPrompt}
              disabled={!canWrite}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60",
                aiEnabled ? "bg-white text-ink ring-1 ring-line hover:ring-ink" : "bg-night text-white hover:bg-indigo"
              )}
            >
              <ClipboardText size={16} weight="bold" aria-hidden="true" />
              {copied === "prompt" ? "Prompt copied" : "Copy social prompt"}
            </button>
          </div>
          {!canWrite && <p className="text-xs text-muted">Add the headline and story first.</p>}
          {pasteOpen && (
            <div className="space-y-2 rounded-xl bg-paper p-3">
              <p className="text-sm text-ink">
                Paste the prompt into a{" "}
                <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer" className="font-bold text-indigo hover:text-sky-dark">
                  new Claude chat
                </a>
                , then paste Claude&apos;s reply here.
              </p>
              <label htmlFor="social-paste" className="sr-only">
                Claude&apos;s reply
              </label>
              <textarea
                id="social-paste"
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"=== SOCIAL ===\nFACEBOOK: …\nX: …"}
                className="w-full rounded-xl border border-line bg-white p-2.5 font-mono text-xs focus:border-indigo focus:outline-none"
              />
              <button
                type="button"
                onClick={addPasted}
                disabled={!pasteText.trim()}
                className="cursor-pointer rounded-full bg-orange px-4 py-2 text-sm font-bold text-ink hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add the posts
              </button>
            </div>
          )}
        </div>
      )}

      {kit && current && (
        <div className="mt-3">
          <div role="tablist" aria-label="Network" className="flex flex-wrap gap-1.5">
            {platforms.map((p) => {
              const PIcon = ICONS[p.id];
              const selected = p.id === current.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(p.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                    selected ? "bg-night text-white" : "bg-paper text-ink/70 hover:text-ink"
                  )}
                >
                  <PIcon size={14} weight="fill" aria-hidden="true" />
                  {p.id === "facebook" && <InstagramLogo size={14} weight="fill" aria-hidden="true" />}
                  {p.name}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" className="mt-3">
            <label htmlFor="social-text" className="sr-only">
              {current.name} post
            </label>
            <textarea
              id="social-text"
              rows={current.id === "tiktok" || current.id === "instagram" ? 12 : 7}
              value={text}
              onChange={(e) => onKitChange({ ...kit, [current.id]: link ? unfillLink(e.target.value, link) : e.target.value })}
              className="w-full rounded-xl border border-line bg-white p-3 text-sm leading-relaxed text-ink focus:border-indigo focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>{current.tip ? "" : published ? "Link goes to the live story." : "The link works once this story is published."}</span>
              {current.limit && (
                <span className={cn("font-semibold tabular-nums", postLength(text, current.id) > current.limit && "text-[#b42318]")}>
                  {postLength(text, current.id)}/{current.limit}
                </span>
              )}
            </div>
            {current.tip && <p className="mt-1 text-xs text-muted">{current.tip}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(withoutImageText(text), current.id)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-night px-4 py-2 text-sm font-bold text-white hover:bg-indigo"
              >
                {copied === current.id ? <Check size={16} weight="bold" className="text-orange" aria-hidden="true" /> : <ClipboardText size={16} weight="bold" aria-hidden="true" />}
                {copied === current.id ? "Copied" : "Copy post"}
              </button>
              {current.shareUrl && link && (
                <a
                  href={current.shareUrl(text, link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (current.id === "facebook") void copy(withoutImageText(text), current.id);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-line hover:ring-ink"
                >
                  <ArrowSquareOut size={16} weight="bold" aria-hidden="true" />
                  {current.shareLabel}
                </a>
              )}
              {current.id === "facebook" && articleUrl && (
                <button
                  type="button"
                  onClick={() => copy(trackedLink(articleUrl, "instagram"), "instagram-link")}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-line hover:ring-ink"
                >
                  <InstagramLogo size={16} weight="bold" aria-hidden="true" />
                  {copied === "instagram-link" ? "Link copied" : "Copy Instagram bio link"}
                </button>
              )}
              {!current.linkInPost && articleUrl && (
                <button
                  type="button"
                  onClick={() => copy(trackedLink(articleUrl, current.id), `${current.id}-link`)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-line hover:ring-ink"
                >
                  <LinkSimple size={16} weight="bold" aria-hidden="true" />
                  {copied === `${current.id}-link` ? "Link copied" : "Copy link for bio"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {photos.length > 0 && canWrite && (
        <ShareImage key={imageTextFrom(kit) || article.title} photos={photos} tag={article.hub} initialText={imageTextFrom(kit) || article.title} />
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-[#fde8e8] p-3 text-sm font-semibold text-[#b42318]">
          {error}
        </p>
      )}
      {!slug && kit && <p className="mt-3 text-xs text-muted">Add a web address for the story to fill in the links.</p>}
    </section>
  );
}
