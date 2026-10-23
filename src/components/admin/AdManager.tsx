"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOut, CursorClick, Pause, PencilSimple, Play, Trash, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import NewsImage from "@/components/ui/NewsImage";
import { AD_PLACEMENTS, AD_SIZES, adStatus, type AdSize, type AdStatus } from "@/lib/ads";
import { cn } from "@/lib/utils";

export interface AdminAd {
  id: string;
  name: string;
  size: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string;
  altText: string;
  placements: string[];
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  clicks: number;
  createdAt: string;
}

interface FormState {
  name: string;
  size: AdSize;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  altText: string;
  placements: string[];
  startsAt: string;
  endsAt: string;
}

const EMPTY: FormState = { name: "", size: "leaderboard", imageUrl: "", mobileImageUrl: "", linkUrl: "", altText: "", placements: [], startsAt: "", endsAt: "" };

const field = "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20";
const label = "mb-1.5 block text-sm font-semibold text-ink";

const STATUS_STYLE: Record<AdStatus, { text: string; cls: string }> = {
  running: { text: "Running", cls: "bg-[#e8f6ee] text-[#17663b]" },
  scheduled: { text: "Scheduled", cls: "bg-[#e8f1fb] text-[#1d5a96]" },
  ended: { text: "Ended", cls: "bg-paper text-muted" },
  paused: { text: "Paused", cls: "bg-[#fff4e5] text-orange-deep" },
};

/** ISO date → "YYYY-MM-DD" in Lagos time, for the date inputs. */
function dayInLagos(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Image upload failed.");
  return data.url as string;
}

function BannerPreview({ src, size, className }: { src: string; size: AdSize; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-paper ring-1 ring-line", AD_SIZES[size].aspect, className)}>
      {src ? (
        <NewsImage src={src} alt="" fill sizes="600px" className="object-contain" />
      ) : (
        <span className="absolute inset-0 grid place-items-center px-3 text-center text-xs text-muted">{AD_SIZES[size].dims}</span>
      )}
    </div>
  );
}

function AdForm({ editing, onDone }: { editing: AdminAd | null; onDone: () => void }) {
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          size: editing.size as AdSize,
          imageUrl: editing.imageUrl,
          mobileImageUrl: editing.mobileImageUrl ?? "",
          linkUrl: editing.linkUrl,
          altText: editing.altText,
          placements: editing.placements,
          startsAt: dayInLagos(editing.startsAt),
          endsAt: dayInLagos(editing.endsAt),
        }
      : EMPTY
  );
  const [uploading, setUploading] = useState<"imageUrl" | "mobileImageUrl" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const top = useRef<HTMLFormElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const spaces = AD_PLACEMENTS.filter((p) => p.size === form.size);

  function chooseSize(size: AdSize) {
    // Places only fit one size, so changing size clears the ticks (and the phone banner, which is for wide banners).
    setForm((f) => ({ ...f, size, placements: f.size === size ? f.placements : [], mobileImageUrl: size === "leaderboard" ? f.mobileImageUrl : "" }));
  }

  function togglePlace(id: string) {
    setForm((f) => ({ ...f, placements: f.placements.includes(id) ? f.placements.filter((p) => p !== id) : [...f.placements, id] }));
  }

  async function upload(key: "imageUrl" | "mobileImageUrl", file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(key);
    try {
      set(key, await uploadImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);
    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/admin/ads/${editing.id}` : "/api/admin/ads", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, active: editing ? editing.active : true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Couldn't save the ad.");
      setSaved(editing ? "Changes saved." : "Ad added. It's live in the places you ticked (or from its start date).");
      if (!editing) setForm(EMPTY);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the ad.");
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setBusy(false);
    }
  }

  const ready = form.name.trim().length >= 2 && !!form.imageUrl && /^https?:\/\/\S+\.\S+/.test(form.linkUrl.trim()) && form.placements.length > 0;

  return (
    <form ref={top} onSubmit={save} className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8">
      <h2 className="font-display text-2xl font-black text-ink">{editing ? `Edit “${editing.name}”` : "Add an ad"}</h2>

      <fieldset className="mt-6">
        <legend className={label}>1. Banner size</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(AD_SIZES) as AdSize[]).map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={form.size === size}
              onClick={() => chooseSize(size)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-left ring-1 transition-colors",
                form.size === size ? "bg-night text-white ring-night" : "bg-white text-ink ring-line hover:ring-ink/30"
              )}
            >
              <span
                aria-hidden="true"
                className={cn("shrink-0 rounded-sm", form.size === size ? "bg-orange" : "bg-line")}
                style={size === "leaderboard" ? { width: 48, height: 8 } : size === "rectangle" ? { width: 24, height: 20 } : { width: 14, height: 28 }}
              />
              <span>
                <span className="block text-sm font-bold">{AD_SIZES[size].label}</span>
                <span className={cn("block text-xs", form.size === size ? "text-white/70" : "text-muted")}>{AD_SIZES[size].dims}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <div>
          <span className={label}>2. Banner image</span>
          <BannerPreview src={form.imageUrl} size={form.size} className={form.size === "sidebar" ? "mx-auto max-w-[220px]" : form.size === "rectangle" ? "max-w-[300px]" : ""} />
          <label htmlFor="ad-image" className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-indigo hover:underline">
            <UploadSimple size={16} aria-hidden="true" />
            {uploading === "imageUrl" ? "Uploading…" : form.imageUrl ? "Replace image" : "Upload image"}
          </label>
          <input id="ad-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(e) => void upload("imageUrl", e.target.files?.[0])} />
          <p className="mt-1 text-xs text-muted">Best at {AD_SIZES[form.size].upload}. JPG, PNG, WebP or animated GIF, up to 8 MB. The whole image always shows; nothing is cropped.</p>

          {form.size === "leaderboard" && (
            <div className="mt-5">
              <span className={label}>
                Phone version <span className="font-normal text-muted">(optional)</span>
              </span>
              {form.mobileImageUrl && (
                <div className="relative mb-2 aspect-[3.2/1] max-w-[320px] overflow-hidden rounded-xl bg-paper ring-1 ring-line">
                  <NewsImage src={form.mobileImageUrl} alt="" fill sizes="320px" className="object-contain" />
                </div>
              )}
              <label htmlFor="ad-mobile" className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-indigo hover:underline">
                <UploadSimple size={16} aria-hidden="true" />
                {uploading === "mobileImageUrl" ? "Uploading…" : form.mobileImageUrl ? "Replace phone banner" : "Upload a phone banner"}
              </label>
              <input id="ad-mobile" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(e) => void upload("mobileImageUrl", e.target.files?.[0])} />
              {form.mobileImageUrl && (
                <button type="button" onClick={() => set("mobileImageUrl", "")} className="ml-4 cursor-pointer text-sm text-muted hover:text-ink">
                  Remove
                </button>
              )}
              <p className="mt-1 text-xs text-muted">A wide banner gets very small on phones. A 640 × 200 (or 320 × 100) version is shown there instead.</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="ad-link" className={label}>
              3. Link it opens
            </label>
            <input id="ad-link" className={field} inputMode="url" placeholder="https://advertiser.com/offer" value={form.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} />
            <p className="mt-1 text-xs text-muted">Readers go here when they click the banner. It opens in a new tab, and every click is counted.</p>
          </div>
          <div>
            <label htmlFor="ad-name" className={label}>
              Advertiser or campaign name
            </label>
            <input id="ad-name" className={field} placeholder="e.g. Bet9ja October promo" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />
            <p className="mt-1 text-xs text-muted">Only you see this.</p>
          </div>
          <div>
            <label htmlFor="ad-alt" className={label}>
              What the banner says <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="ad-alt" className={field} placeholder="e.g. Get 100% bonus on your first deposit" value={form.altText} onChange={(e) => set("altText", e.target.value)} maxLength={200} />
            <p className="mt-1 text-xs text-muted">Read out to visitors using screen readers.</p>
          </div>
        </div>
      </div>

      <fieldset className="mt-7">
        <legend className={label}>4. Where it shows</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {spaces.map((p) => (
            <label key={p.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 ring-1 transition-colors", form.placements.includes(p.id) ? "bg-indigo/5 ring-indigo/40" : "ring-line hover:bg-paper")}>
              <input type="checkbox" checked={form.placements.includes(p.id)} onChange={() => togglePlace(p.id)} className="h-4 w-4 accent-[#2d1b69]" />
              <span className="text-sm font-medium text-ink">{p.label}</span>
            </label>
          ))}
        </div>
        {spaces.length > 1 && (
          <button
            type="button"
            onClick={() => set("placements", form.placements.length === spaces.length ? [] : spaces.map((p) => p.id))}
            className="mt-2 cursor-pointer text-sm font-semibold text-indigo hover:underline"
          >
            {form.placements.length === spaces.length ? "Untick all" : `Tick all ${spaces.length} ${AD_SIZES[form.size].label.toLowerCase()} spaces`}
          </button>
        )}
      </fieldset>

      <fieldset className="mt-7">
        <legend className={label}>
          5. Dates <span className="font-normal text-muted">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-4">
          <label className="text-sm text-muted">
            Starts
            <input type="date" className={cn(field, "mt-1 w-auto")} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Ends
            <input type="date" className={cn(field, "mt-1 w-auto")} value={form.endsAt} min={form.startsAt || undefined} onChange={(e) => set("endsAt", e.target.value)} />
          </label>
        </div>
        <p className="mt-1 text-xs text-muted">Leave blank to start now and run until you pause it. The ad switches off by itself after the end date.</p>
      </fieldset>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-[#fdecec] px-4 py-3 text-sm text-[#a12226]">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-6 rounded-xl bg-[#e8f6ee] px-4 py-3 text-sm text-[#17663b]">
          {saved}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!ready || busy || !!uploading}
          className="cursor-pointer rounded-full bg-night px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Add ad"}
        </button>
        {editing && (
          <button type="button" onClick={onDone} className="cursor-pointer rounded-full px-6 py-3 text-sm font-bold text-muted hover:text-ink">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function AdRow({ ad, onEdit, onChanged }: { ad: AdminAd; onEdit: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const status = STATUS_STYLE[adStatus(ad)];
  const size = ad.size as AdSize;
  const places = ad.placements.map((id) => AD_PLACEMENTS.find((p) => p.id === id)?.label ?? id);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/ads/${ad.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !ad.active }) });
    setBusy(false);
    onChanged();
  }

  async function remove() {
    if (!window.confirm(`Delete the ad "${ad.name}"? Its click count is lost too.`)) return;
    setBusy(true);
    await fetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
    setBusy(false);
    onChanged();
  }

  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-line md:flex-row">
      <div className={cn("shrink-0", size === "leaderboard" ? "md:w-64" : "md:w-32")}>
        <BannerPreview src={ad.imageUrl} size={size} className={size === "sidebar" ? "mx-auto w-24 md:w-full" : ""} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-xl font-black leading-tight text-ink">{ad.name}</p>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", status.cls)}>{status.text}</span>
        </div>
        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex max-w-full items-center gap-1 truncate text-sm text-indigo hover:underline">
          <span className="truncate">{ad.linkUrl}</span>
          <ArrowSquareOut size={14} className="shrink-0" aria-hidden="true" />
        </a>
        <p className="mt-1.5 text-xs text-muted">
          {AD_SIZES[size].label} · {places.join(", ")}
        </p>
        <p className="mt-1 text-xs text-muted">
          {ad.startsAt ? `From ${formatDay(ad.startsAt)}` : `Since ${formatDay(ad.createdAt)}`}
          {ad.endsAt ? ` to ${formatDay(ad.endsAt)}` : ", no end date"}
        </p>
      </div>
      <div className="flex shrink-0 flex-row items-start gap-4 md:flex-col md:items-end">
        <p className="flex items-center gap-1.5 text-sm text-ink" title="Clicks from readers (bots and your own clicks aren't counted)">
          <CursorClick size={16} className="text-indigo" aria-hidden="true" />
          <span className="font-display text-2xl font-black tabular-nums">{ad.clicks.toLocaleString()}</span>
          <span className="text-muted">clicks</span>
        </p>
        <div className="flex gap-1">
          <button type="button" disabled={busy} onClick={() => void toggle()} className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-ink ring-1 ring-line hover:bg-paper">
            {ad.active ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {ad.active ? "Pause" : "Resume"}
          </button>
          <button type="button" disabled={busy} onClick={onEdit} aria-label={`Edit ${ad.name}`} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-ink ring-1 ring-line hover:bg-paper">
            <PencilSimple size={15} aria-hidden="true" />
          </button>
          <button type="button" disabled={busy} onClick={() => void remove()} aria-label={`Delete ${ad.name}`} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-[#a12226] ring-1 ring-line hover:bg-[#fdecec]">
            <Trash size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

/** Add, edit, pause and delete the banners in the site's ad spaces. */
export default function AdManager({ ads, tableReady }: { ads: AdminAd[]; tableReady: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminAd | null>(null);

  if (!tableReady) {
    return (
      <p className="rounded-2xl bg-[#fff4e5] px-5 py-4 text-sm text-ink">
        The ads table hasn&apos;t been created in the database yet. Once it is (a one-off <code>npm run db:push</code>), you can add ads here.
      </p>
    );
  }

  const free = AD_PLACEMENTS.filter((p) => !ads.some((a) => adStatus(a) === "running" && a.placements.includes(p.id)));

  return (
    <div className="space-y-10">
      <AdForm
        key={editing?.id ?? "new"}
        editing={editing}
        onDone={() => {
          setEditing(null);
          router.refresh();
        }}
      />

      <section aria-labelledby="your-ads">
        <h2 id="your-ads" className="font-display text-2xl font-black text-ink">
          Your ads <span className="text-muted">({ads.length})</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          {free.length === 0
            ? "Every ad space has a running ad."
            : `${free.length} of ${AD_PLACEMENTS.length} spaces have no running ad and show the "Advertise your brand here" box: ${free.map((p) => p.label).join("; ")}.`}
        </p>
        {ads.length > 0 && (
          <ul className="mt-4 space-y-3">
            {ads.map((ad) => (
              <AdRow
                key={ad.id}
                ad={ad}
                onEdit={() => {
                  setEditing(ad);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onChanged={() => router.refresh()}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
