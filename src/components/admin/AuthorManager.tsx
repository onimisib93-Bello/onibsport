"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOut, PencilSimple, Trash, UploadSimple, UserCirclePlus } from "@phosphor-icons/react/dist/ssr";
import NewsImage from "@/components/ui/NewsImage";
import { cn } from "@/lib/utils";

export interface AdminAuthor {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  xHandle: string | null;
  stories: number;
}

const field = "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20";
const label = "mb-1.5 block text-sm font-semibold text-ink";

const EMPTY = { name: "", role: "", bio: "", photo: "", xHandle: "" };

function Avatar({ name, photo, size = 56 }: { name: string; photo?: string | null; size?: number }) {
  const letters = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-indigo font-display font-black text-white" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {photo ? <NewsImage src={photo} alt="" fill sizes={`${size}px`} className="object-cover" /> : letters || "?"}
    </span>
  );
}

/** Writer profiles: the photo, role and bio on bylines and each writer's page. */
export default function AuthorManager({ authors, bylines, tableReady }: { authors: AdminAuthor[]; bylines: { name: string; stories: number }[]; tableReady: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function start(author?: AdminAuthor | { name: string }) {
    setError(null);
    if (author && "id" in author) {
      setEditing(author.id);
      setForm({ name: author.name, role: author.role, bio: author.bio, photo: author.photo ?? "", xHandle: author.xHandle ?? "" });
    } else {
      setEditing("new");
      setForm({ ...EMPTY, name: author?.name ?? "" });
    }
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Upload failed.");
      setForm((f) => ({ ...f, photo: json.url as string }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(editing === "new" ? "/api/admin/authors" : `/api/admin/authors/${editing}`, {
        method: editing === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Couldn't save the profile.");
      setEditing(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the profile.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(author: AdminAuthor) {
    if (!confirm(`Delete ${author.name}'s profile? Their stories stay, with a plain byline.`)) return;
    await fetch(`/api/admin/authors/${author.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (!tableReady) {
    return (
      <p className="rounded-2xl bg-orange/10 p-5 text-sm text-ink ring-1 ring-orange/40">
        Writer profiles need the Author table in the database. Run <code className="font-mono">npm run db:push</code> once, then reload.
      </p>
    );
  }

  const withoutProfile = bylines.filter((b) => !authors.some((a) => a.name.toLowerCase() === b.name.toLowerCase()));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-6">
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          {authors.length === 0 && <li className="p-6 text-sm text-muted">No writer profiles yet. Add one, or start from a byline below.</li>}
          {authors.map((a) => (
            <li key={a.id} className="flex items-center gap-4 p-4">
              <Avatar name={a.name} photo={a.photo} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">{a.name}</p>
                <p className="text-sm text-muted">
                  {[a.role, `${a.stories} ${a.stories === 1 ? "story" : "stories"}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <a href={`/author/${a.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${a.name}'s page`} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink">
                <ArrowSquareOut size={17} weight="bold" />
              </a>
              <button type="button" onClick={() => start(a)} aria-label={`Edit ${a.name}`} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-muted hover:bg-paper hover:text-ink">
                <PencilSimple size={17} weight="bold" />
              </button>
              <button type="button" onClick={() => remove(a)} aria-label={`Delete ${a.name}'s profile`} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-muted hover:bg-[#fde8e8] hover:text-[#b42318]">
                <Trash size={17} weight="bold" />
              </button>
            </li>
          ))}
        </ul>

        {withoutProfile.length > 0 && (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
            <h2 className="font-display text-2xl font-black text-ink">Bylines without a profile</h2>
            <p className="mt-1 text-sm text-muted">These names are on stories but have no photo or bio yet.</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {withoutProfile.map((b) => (
                <li key={b.name}>
                  <button type="button" onClick={() => start({ name: b.name })} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-paper px-3.5 py-2 text-sm font-semibold text-ink ring-1 ring-line hover:ring-ink">
                    <UserCirclePlus size={16} weight="bold" aria-hidden="true" />
                    {b.name} <span className="text-muted">({b.stories})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        {editing ? (
          <form onSubmit={save} className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line">
            <h2 className="font-display text-2xl font-black text-ink">{editing === "new" ? "Add a writer" : "Edit writer"}</h2>
            <div className="flex items-center gap-4">
              <Avatar name={form.name} photo={form.photo} size={72} />
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-indigo hover:text-indigo-dark">
                <UploadSimple size={16} weight="bold" aria-hidden="true" />
                {uploading ? "Uploading…" : form.photo ? "Change photo" : "Upload a photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadPhoto(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <div>
              <label htmlFor="au-name" className={label}>
                Name (as on the byline)
              </label>
              <input id="au-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
              {editing !== "new" && <p className="mt-1 text-xs text-muted">Renaming also updates the byline on their stories.</p>}
            </div>
            <div>
              <label htmlFor="au-role" className={label}>
                Role
              </label>
              <input id="au-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Premier League correspondent" className={field} />
            </div>
            <div>
              <label htmlFor="au-bio" className={label}>
                Short bio
              </label>
              <textarea
                id="au-bio"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Two or three sentences: what they cover and why readers should trust them."
                className={field}
              />
            </div>
            <div>
              <label htmlFor="au-x" className={label}>
                X handle (optional)
              </label>
              <input id="au-x" value={form.xHandle} onChange={(e) => setForm({ ...form, xHandle: e.target.value })} placeholder="onibsport" className={field} />
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-[#fde8e8] p-3 text-sm font-semibold text-[#b42318]">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={busy || uploading} className="flex-1 cursor-pointer rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo disabled:opacity-60">
                {busy ? "Saving…" : "Save profile"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold text-muted hover:bg-paper hover:text-ink">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => start()}
            className={cn("flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-night px-5 py-4 text-sm font-bold text-white hover:bg-indigo")}
          >
            <UserCirclePlus size={20} weight="bold" aria-hidden="true" />
            Add a writer
          </button>
        )}
      </div>
    </div>
  );
}
