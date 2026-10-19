"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextHTwo,
  TextB,
  LinkSimple,
  Quotes,
  ListBullets,
  ImageSquare,
  Warning,
  UploadSimple,
  ClipboardText,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";
import { parseBlocks, plainText, readingMinutes, RichText } from "@/lib/richText";
import NewsImage from "@/components/ui/NewsImage";
import { clearHandoff, parseChatDraft, readHandoff } from "@/lib/ai/chatDraft";
import { readSocialKit, saveSocialKit, type SocialKit } from "@/lib/ai/social";
import SocialPostsPanel from "@/components/admin/SocialPostsPanel";
import SocialCardPreview from "@/components/admin/SocialCardPreview";
import { cn } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
  slug?: string;
}

export interface ArticleFormValues {
  id?: string;
  title: string;
  slug: string;
  dek: string;
  body: string;
  image: string;
  imageAlt: string;
  coverImage: string;
  author: string;
  source: string;
  tags: string;
  isBreaking: boolean;
  featured: boolean;
  featuredVideoUrl: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED";
  categoryId: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** True for images hot-linked from another site (e.g. picked up from the source story). */
function isExternalImage(src: string) {
  if (!src || src.startsWith("/")) return false;
  try {
    return !new URL(src).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

const input =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-muted/70 focus:border-indigo focus:outline-none focus:ring-4 focus:ring-indigo/10";
const label = "block text-sm font-semibold text-ink";

function Counter({ value, ideal, max }: { value: number; ideal: [number, number]; max: number }) {
  const tone = value > max ? "text-[#b42318]" : value >= ideal[0] && value <= ideal[1] ? "text-[#1f7a4a]" : "text-muted";
  return (
    <span className={cn("text-xs font-semibold tabular-nums", tone)}>
      {value}/{max}
    </span>
  );
}

export default function ArticleForm({
  categories,
  initial,
  openImport = false,
  aiEnabled = false,
}: {
  categories: CategoryOption[];
  initial?: ArticleFormValues;
  /** Start with the "Paste a draft from Claude" panel open. */
  openImport?: boolean;
  /** ANTHROPIC_API_KEY is set, so social posts can be written in one click. */
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [values, setValues] = useState<ArticleFormValues>(
    initial ?? {
      title: "",
      slug: "",
      dek: "",
      body: "",
      image: "/placeholders/pl-title-race.jpg",
      imageAlt: "",
      coverImage: "/covers/pl-title-race-cover.jpg",
      author: "",
      source: "",
      tags: "",
      isBreaking: false,
      featured: false,
      featuredVideoUrl: "",
      status: "DRAFT",
      categoryId: categories[0]?.id ?? "",
    }
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<{ image?: boolean; coverImage?: boolean; body?: boolean }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<"story" | "search" | "social">("story");
  const [importOpen, setImportOpen] = useState(openImport);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [socialKit, setSocialKit] = useState<SocialKit | null>(null);

  // Posts written earlier for this story (kept in this browser) show up again when it's reopened.
  useEffect(() => {
    const saved = readSocialKit(initial?.slug ?? "");
    if (!saved || Object.keys(saved).length === 0) return;
    const id = window.setTimeout(() => setSocialKit(saved), 0);
    return () => window.clearTimeout(id);
  }, [initial?.slug]);

  function changeSocialKit(kit: SocialKit | null, slug = values.slug) {
    setSocialKit(kit);
    saveSocialKit(slug, kit ?? {});
  }

  function update<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function upload(file: File): Promise<string | null> {
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setUploadError(typeof data.error === "string" ? data.error : "Upload failed.");
      return null;
    }
    return data.url as string;
  }

  async function handleFileUpload(field: "image" | "coverImage", file: File) {
    setUploading((u) => ({ ...u, [field]: true }));
    try {
      const url = await upload(file);
      if (url) update(field, url);
    } finally {
      setUploading((u) => ({ ...u, [field]: false }));
    }
  }

  /** Wraps the current selection in the body (or inserts a block) and restores the cursor. */
  function format(kind: "h2" | "bold" | "link" | "quote" | "list") {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end);
    let insert = "";
    let cursorFrom = 0;
    let cursorTo = 0;
    const block = (text: string) => {
      const before = start > 0 && !value.slice(0, start).endsWith("\n\n") ? (value.slice(0, start).endsWith("\n") ? "\n" : "\n\n") : "";
      return `${before}${text}\n\n`;
    };
    if (kind === "bold") {
      insert = `**${selected || "bold text"}**`;
      cursorFrom = start + 2;
      cursorTo = cursorFrom + (selected || "bold text").length;
    } else if (kind === "link") {
      const text = selected || "link text";
      insert = `[${text}](https://)`;
      cursorFrom = start + text.length + 3;
      cursorTo = cursorFrom + 8;
    } else {
      const prefix = kind === "h2" ? "## " : kind === "quote" ? "> " : "- ";
      const text = selected || (kind === "h2" ? "Subheading" : kind === "quote" ? "Quote" : "List item");
      const content = kind === "list" ? text.split("\n").map((l) => `- ${l}`).join("\n") : `${prefix}${text}`;
      insert = block(content);
      const offset = insert.indexOf(content) + (kind === "list" ? 2 : prefix.length);
      cursorFrom = start + offset;
      cursorTo = cursorFrom + (kind === "list" ? text.split("\n")[0].length : text.length);
    }
    const next = value.slice(0, start) + insert + value.slice(end);
    update("body", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorFrom, cursorTo);
    });
  }

  async function insertPhoto(file: File) {
    setUploading((u) => ({ ...u, body: true }));
    try {
      const url = await upload(file);
      if (!url) return;
      const el = bodyRef.current;
      const pos = el?.selectionStart ?? values.body.length;
      const snippet = `\n\n![Describe the photo](${url} "Caption")\n\n`;
      update("body", values.body.slice(0, pos) + snippet + values.body.slice(pos));
    } finally {
      setUploading((u) => ({ ...u, body: false }));
    }
  }

  /** Fills the form from a Claude chat reply, plus the source details saved when the prompt was copied. */
  function importFromChat() {
    const parsed = parseChatDraft(importText);
    if ("error" in parsed) {
      setImportResult({ ok: false, message: parsed.error });
      return;
    }
    const handoff = readHandoff();
    const wanted = parsed.category ?? handoff?.categorySlug;
    const category = categories.find((c) => wanted && (c.slug === wanted || slugify(c.name) === wanted));
    const nextSlug = slugTouched ? values.slug : slugify(parsed.title);
    if (parsed.social && Object.keys(parsed.social).length > 0) changeSocialKit(parsed.social, nextSlug);
    setValues((v) => ({
      ...v,
      title: parsed.title,
      slug: nextSlug,
      dek: parsed.dek || v.dek,
      body: parsed.body,
      tags: parsed.tags || v.tags,
      imageAlt: parsed.imageAlt || v.imageAlt,
      categoryId: category?.id ?? v.categoryId,
      author: v.author || "Onibsport Desk",
      source: handoff?.outlet ?? v.source,
      image: handoff?.image ?? v.image,
      coverImage: handoff?.image ?? v.coverImage,
    }));
    clearHandoff();
    setImportText("");
    setImportOpen(false);
    setImportResult({
      ok: true,
      message: handoff
        ? `Filled in from Claude, with the source details from ${handoff.outlet}. Read it through, check the photo, then save.`
        : "Filled in from Claude. Add the source outlet and a photo, read it through, then save.",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/admin/articles/${initial!.id}` : "/api/admin/articles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Could not save the article. Check the fields and try again.");
        return;
      }
      // Keep the social posts under the web address the story was saved with.
      if (socialKit) saveSocialKit(values.slug, socialKit);
      router.push("/admin/articles");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const paragraphs = useMemo(
    () =>
      values.body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    [values.body]
  );
  const blocks = useMemo(() => parseBlocks(paragraphs), [paragraphs]);
  const words = paragraphs.map(plainText).join(" ").split(/\s+/).filter(Boolean).length;
  const subheads = blocks.filter((b) => b.type === "h2").length;
  const links = (values.body.match(/\]\((?:https?:\/\/|\/)/g) ?? []).length;
  const externalImage = isExternalImage(values.image) || isExternalImage(values.coverImage);
  const categoryName = categories.find((c) => c.id === values.categoryId)?.name ?? "";

  const checks = [
    { ok: values.title.length >= 30 && values.title.length <= 70, text: "Headline is 30-70 characters" },
    { ok: values.dek.length >= 70 && values.dek.length <= 160, text: "Standfirst/meta description is 70-160 characters" },
    { ok: words >= 400, text: `Story is at least 400 words (now ${words})` },
    { ok: subheads >= 2, text: "Has at least two subheadings" },
    { ok: links >= 2, text: "Has at least two links" },
    { ok: values.imageAlt.length >= 10, text: "Lead photo has descriptive alt text" },
    { ok: values.tags.split(",").filter((t) => t.trim()).length >= 3, text: "Has three or more tags" },
  ];

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl bg-night text-white">
          <button
            type="button"
            onClick={() => setImportOpen((o) => !o)}
            aria-expanded={importOpen}
            aria-controls="chat-import"
            className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
          >
            <ClipboardText size={22} weight="bold" className="shrink-0 text-orange" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-2xl font-black leading-tight">Paste a draft from Claude</span>
              <span className="block text-sm text-white/65">Fills in the headline, standfirst, story, tags, hub and source in one go.</span>
            </span>
            <CaretDown size={18} weight="bold" className={cn("shrink-0 transition-transform", importOpen && "rotate-180")} aria-hidden="true" />
          </button>
          {importOpen && (
            <div id="chat-import" className="space-y-3 border-t border-white/10 px-5 pb-5 pt-4">
              <label htmlFor="chat-import-text" className="block text-sm text-white/75">
                Paste Claude&apos;s whole reply. Use the copy button on its code block so the formatting comes through.
              </label>
              <textarea
                id="chat-import-text"
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"TITLE: …\nSTANDFIRST: …\nCATEGORY: …\nTAGS: …\nIMAGE ALT: …\nBODY:\n…"}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-3 font-mono text-[13px] text-white placeholder:text-white/35 focus:border-orange focus:outline-none"
              />
              <button
                type="button"
                onClick={importFromChat}
                disabled={!importText.trim()}
                className="cursor-pointer rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Fill in the story
              </button>
            </div>
          )}
        </section>

        {importResult && (
          <p
            role={importResult.ok ? "status" : "alert"}
            className={cn(
              "rounded-2xl p-4 text-sm font-semibold",
              importResult.ok ? "bg-[#1f9d5c]/10 text-[#1f7a4a]" : "bg-[#fde8e8] text-[#b42318]"
            )}
          >
            {importResult.message}
          </p>
        )}

        {externalImage && (
          <div className="flex gap-3 rounded-2xl border border-orange/40 bg-orange/10 p-4 text-sm text-ink">
            <Warning size={22} weight="fill" className="shrink-0 text-orange-deep" aria-hidden="true" />
            <p>
              <span className="font-bold">Check the photo rights before publishing.</span> The lead or cover photo is loaded from another website (usually the
              source story). Upload a photo you own or have licensed, or confirm you have permission to use this one.
            </p>
          </div>
        )}

        <section className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <div>
            <div className="flex items-end justify-between gap-3">
              <label htmlFor="f-title" className={label}>
                Headline
              </label>
              <Counter value={values.title.length} ideal={[30, 70]} max={70} />
            </div>
            <input
              id="f-title"
              required
              value={values.title}
              onChange={(e) => {
                update("title", e.target.value);
                if (!slugTouched) update("slug", slugify(e.target.value));
              }}
              className={cn(input, "font-display text-2xl font-extrabold")}
            />
          </div>

          <div>
            <label htmlFor="f-slug" className={label}>
              Web address
            </label>
            <div className="mt-1.5 flex items-center rounded-xl border border-line bg-paper focus-within:border-indigo focus-within:ring-4 focus-within:ring-indigo/10">
              <span className="pl-3.5 text-sm text-muted">/article/</span>
              <input
                id="f-slug"
                required
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update("slug", slugify(e.target.value));
                }}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 font-mono text-sm text-ink focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <label htmlFor="f-dek" className={label}>
                Standfirst
              </label>
              <Counter value={values.dek.length} ideal={[70, 160]} max={160} />
            </div>
            <p id="f-dek-help" className="mt-0.5 text-xs text-muted">
              One sentence under the headline. It&apos;s also the description Google and social networks show.
            </p>
            <textarea id="f-dek" aria-describedby="f-dek-help" required rows={2} value={values.dek} onChange={(e) => update("dek", e.target.value)} className={input} />
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <label htmlFor="f-body" className={label}>
                Story
              </label>
              <span className="text-xs text-muted">
                {words} words, about {readingMinutes(paragraphs)} min read
              </span>
            </div>
            <div className="mt-1.5 overflow-hidden rounded-xl border border-line focus-within:border-indigo focus-within:ring-4 focus-within:ring-indigo/10">
              <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1 border-b border-line bg-paper px-2 py-1.5">
                {[
                  { kind: "h2" as const, Icon: TextHTwo, label: "Subheading" },
                  { kind: "bold" as const, Icon: TextB, label: "Bold" },
                  { kind: "link" as const, Icon: LinkSimple, label: "Link" },
                  { kind: "quote" as const, Icon: Quotes, label: "Pull quote" },
                  { kind: "list" as const, Icon: ListBullets, label: "List" },
                ].map(({ kind, Icon, label: l }) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => format(kind)}
                    title={l}
                    aria-label={l}
                    className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-ink/70 hover:bg-white hover:text-ink"
                  >
                    <Icon size={18} weight="bold" />
                  </button>
                ))}
                <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-ink/70 hover:bg-white hover:text-ink">
                  <ImageSquare size={18} weight="bold" aria-hidden="true" />
                  {uploading.body ? "Uploading…" : "Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading.body}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void insertPhoto(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <textarea
                id="f-body"
                ref={bodyRef}
                required
                rows={20}
                value={values.body}
                onChange={(e) => update("body", e.target.value)}
                aria-describedby="f-body-help"
                className="block w-full resize-y bg-white px-4 py-3 font-mono text-[14px] leading-relaxed text-ink focus:outline-none"
              />
            </div>
            <p id="f-body-help" className="mt-1.5 text-xs text-muted">
              Leave a blank line between paragraphs. Use the toolbar for subheadings, links, quotes, lists and photos.
            </p>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-display text-2xl font-black text-ink">Photos</h2>
          <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line">
              {values.image && <NewsImage src={values.image} alt="" fill sizes="160px" className="object-cover" />}
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="f-image" className={label}>
                  Lead photo
                </label>
                <input
                  id="f-image"
                  required
                  value={values.image}
                  onChange={(e) => update("image", e.target.value)}
                  placeholder="/placeholders/pl-title-race.jpg or https://…"
                  className={cn(input, "font-mono text-sm")}
                />
                <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-indigo hover:text-indigo-dark">
                  <UploadSimple size={16} weight="bold" aria-hidden="true" />
                  {uploading.image ? "Uploading…" : "Upload a photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading.image}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFileUpload("image", file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <div>
                <label htmlFor="f-alt" className={label}>
                  Photo description (alt text)
                </label>
                <input id="f-alt" required value={values.imageAlt} onChange={(e) => update("imageAlt", e.target.value)} className={input} />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="f-cover" className={label}>
              Share image (1200×630)
            </label>
            <p className="mt-0.5 text-xs text-muted">Shown when the story is shared and in search results. Leave blank to use the lead photo.</p>
            <input
              id="f-cover"
              value={values.coverImage}
              onChange={(e) => update("coverImage", e.target.value)}
              placeholder={values.image}
              className={cn(input, "font-mono text-sm")}
            />
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-indigo hover:text-indigo-dark">
              <UploadSimple size={16} weight="bold" aria-hidden="true" />
              {uploading.coverImage ? "Uploading…" : "Upload a share image"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading.coverImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload("coverImage", file);
                  e.target.value = "";
                }}
              />
            </label>
            {uploadError && (
              <p role="alert" className="mt-2 text-sm font-semibold text-[#b42318]">
                {uploadError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="f-video" className={label}>
              Video embed URL (optional)
            </label>
            <input
              id="f-video"
              value={values.featuredVideoUrl}
              onChange={(e) => update("featuredVideoUrl", e.target.value)}
              placeholder="https://www.youtube.com/embed/…"
              className={input}
            />
          </div>
        </section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-line">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div>
              <label htmlFor="f-status" className={label}>
                Status
              </label>
              <select
                id="f-status"
                value={values.status}
                onChange={(e) => update("status", e.target.value as ArticleFormValues["status"])}
                className={input}
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending review</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <div>
              <label htmlFor="f-category" className={label}>
                League hub
              </label>
              <select id="f-category" required value={values.categoryId} onChange={(e) => update("categoryId", e.target.value)} className={input}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-author" className={label}>
                Author
              </label>
              <input id="f-author" required value={values.author} onChange={(e) => update("author", e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="f-source" className={label}>
                Source outlet
              </label>
              <input id="f-source" value={values.source} onChange={(e) => update("source", e.target.value)} placeholder="e.g. BBC Sport" className={input} />
            </div>
          </div>
          <div>
            <label htmlFor="f-tags" className={label}>
              Tags
            </label>
            <input id="f-tags" value={values.tags} onChange={(e) => update("tags", e.target.value)} placeholder="Arsenal, Premier League, Title race" className={input} />
            <p className="mt-1 text-xs text-muted">Separate with commas. Tags power search and related stories.</p>
          </div>
          <fieldset className="space-y-2.5">
            <legend className="sr-only">Placement</legend>
            {[
              { key: "isBreaking" as const, title: "Breaking news", help: "Shows the Breaking label and the site-wide alert." },
              { key: "featured" as const, title: "Feature on the homepage", help: "Puts it in the hero slideshow and Editor's picks. It stays on its hub too." },
            ].map((o) => (
              <label key={o.key} className="flex cursor-pointer gap-3 rounded-xl p-2 hover:bg-paper">
                <input
                  type="checkbox"
                  checked={values[o.key]}
                  onChange={(e) => update(o.key, e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#2d1b69]"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{o.title}</span>
                  <span className="block text-xs text-muted">{o.help}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {error && (
            <p role="alert" className="rounded-xl bg-[#fde8e8] p-3 text-sm font-semibold text-[#b42318]">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 border-t border-line pt-5">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 cursor-pointer rounded-full bg-night px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create article"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/articles")}
              className="cursor-pointer rounded-full px-5 py-3 text-sm font-semibold text-muted hover:bg-paper hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-display text-2xl font-black text-ink">Search-ready checklist</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {checks.map((c) => (
              <li key={c.text} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-black", c.ok ? "bg-[#1f9d5c] text-white" : "bg-line text-muted")}
                >
                  {c.ok ? "✓" : ""}
                </span>
                <span className={c.ok ? "text-ink" : "text-muted"}>
                  <span className="sr-only">{c.ok ? "Done: " : "To do: "}</span>
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <SocialPostsPanel
          slug={values.slug}
          published={values.status === "PUBLISHED"}
          article={{ title: values.title, dek: values.dek, body: values.body, hub: categoryName }}
          aiEnabled={aiEnabled}
          kit={socialKit}
          onKitChange={(kit) => changeSocialKit(kit)}
        />

        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          <div role="tablist" aria-label="Preview" className="flex border-b border-line">
            {(
              [
                ["story", "Story"],
                ["search", "Google"],
                ["social", "Social card"],
              ] as const
            ).map(([id, l]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={preview === id}
                onClick={() => setPreview(id)}
                className={cn(
                  "flex-1 cursor-pointer border-b-2 py-3 text-sm font-bold transition-colors",
                  preview === id ? "border-indigo text-ink" : "border-transparent text-muted hover:text-ink"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-5">
            {preview === "story" && (
              <article>
                <p className="text-xs font-bold text-muted">{categoryName}</p>
                <h3 className="mt-1 font-display text-3xl font-black leading-[0.95] text-ink">{values.title || "Your headline"}</h3>
                <p className="mt-2 text-[15px] text-ink/70">{values.dek || "Your standfirst."}</p>
                <div className="story mt-4 text-base [&_h2]:text-2xl">
                  {blocks.length > 0 ? <RichText blocks={blocks} /> : <p className="text-muted">Start writing to see the story here.</p>}
                </div>
              </article>
            )}
            {preview === "search" && (
              <div className="font-[arial,sans-serif]">
                <p className="text-xs text-[#4d5156]">onibsport.com › article › {values.slug || "your-story"}</p>
                <p className="mt-1 line-clamp-1 text-xl leading-snug text-[#1a0dab]">{(values.title || "Your headline") + " | Onibsport"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{values.dek || "Your standfirst appears here as the description."}</p>
              </div>
            )}
            {preview === "social" && <SocialCardPreview image={values.coverImage || values.image} title={values.title} dek={values.dek} />}
          </div>
        </section>
      </div>
    </form>
  );
}
