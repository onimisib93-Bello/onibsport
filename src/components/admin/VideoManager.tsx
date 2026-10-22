"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPresigned } from "@vercel/blob/client";
import { Eye, EyeSlash, FilmStrip, PencilSimple, Trash, UploadSimple, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import NewsImage from "@/components/ui/NewsImage";
import { MAX_VIDEO_BYTES, VIDEO_TYPES, parseYouTubeId, youTubeThumbnail } from "@/lib/videos";
import { cn } from "@/lib/utils";

export interface AdminVideo {
  id: string;
  title: string;
  description: string;
  kind: string;
  youtubeId: string | null;
  videoUrl: string | null;
  thumbnail: string | null;
  published: boolean;
  createdAt: string;
}

type Kind = "youtube" | "upload";

const field = "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20";
const label = "mb-1.5 block text-sm font-semibold text-ink";

function thumbOf(v: Pick<AdminVideo, "thumbnail" | "youtubeId">) {
  return v.thumbnail || (v.youtubeId ? youTubeThumbnail(v.youtubeId) : "/covers/video-highlights-cover.jpg");
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** Sends an image to the existing image-upload route and returns its URL. */
async function uploadImage(file: Blob, name: string): Promise<string> {
  const form = new FormData();
  form.append("file", new File([file], name, { type: file.type || "image/jpeg" }));
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Image upload failed.");
  return data.url as string;
}

/** Grabs a frame about a second in as a JPEG, for the thumbnail of an uploaded video. */
function captureFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;
    const done = (blob: Blob | null) => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    video.onerror = () => done(null);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1280 / (video.videoWidth || 1280));
      canvas.width = Math.round((video.videoWidth || 1280) * scale);
      canvas.height = Math.round((video.videoHeight || 720) * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return done(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => done(blob), "image/jpeg", 0.85);
    };
    window.setTimeout(() => done(null), 15000);
  });
}

function AddVideoForm({ onSaved }: { onSaved: () => void }) {
  const [kind, setKind] = useState<Kind>("youtube");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const youtubeId = parseYouTubeId(youtubeUrl);
  const preview = thumbnail || (kind === "youtube" && youtubeId ? youTubeThumbnail(youtubeId) : "");

  function reset() {
    setTitle("");
    setDescription("");
    setYoutubeUrl("");
    setFile(null);
    setVideoUrl("");
    setThumbnail("");
    setProgress(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function chooseFile(next: File | undefined) {
    setError(null);
    setVideoUrl("");
    if (!next) return;
    if (!VIDEO_TYPES.includes(next.type)) return setError("Use an MP4, WebM or MOV video file.");
    if (next.size > MAX_VIDEO_BYTES) return setError(`That file is ${formatSize(next.size)}. The limit is ${formatSize(MAX_VIDEO_BYTES)}; put longer videos on YouTube and paste the link instead.`);
    setFile(next);
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));

    setBusy(true);
    setProgress(0);
    try {
      const safeName = next.name.toLowerCase().replace(/[^\w.-]+/g, "-").slice(-80);
      const blob = await uploadPresigned(`videos/${Date.now()}-${safeName}`, next, {
        access: "public",
        handleUploadUrl: "/api/admin/videos/upload",
        contentType: next.type,
        multipart: next.size > 30 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      setVideoUrl(blob.url);
      // A frame from the video makes the thumbnail unless one was chosen already.
      if (!thumbnail) {
        const frame = await captureFrame(next);
        if (frame) setThumbnail(await uploadImage(frame, `${safeName}-poster.jpg`).catch(() => ""));
      }
    } catch (e) {
      setFile(null);
      setError(e instanceof Error ? `The upload didn't finish: ${e.message}` : "The upload didn't finish. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseThumbnail(next: File | undefined) {
    if (!next) return;
    setError(null);
    setBusy(true);
    try {
      setThumbnail(await uploadImage(next, next.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, kind, youtubeUrl, videoUrl, thumbnail, published: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Couldn't save the video.");
      reset();
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the video.");
    } finally {
      setBusy(false);
    }
  }

  const ready = title.trim().length >= 3 && (kind === "youtube" ? !!youtubeId : !!videoUrl);

  return (
    <form onSubmit={save} className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8">
      <h2 className="font-display text-2xl font-black text-ink">Add a video</h2>

      <div role="radiogroup" aria-label="Video source" className="mt-5 inline-flex rounded-full bg-paper p-1">
        {(
          [
            ["youtube", "YouTube link", YoutubeLogo],
            ["upload", "Upload a file", UploadSimple],
          ] as const
        ).map(([id, text, Icon]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={kind === id}
            onClick={() => {
              setKind(id);
              setError(null);
            }}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
              kind === id ? "bg-night text-white" : "text-ink/70 hover:text-ink"
            )}
          >
            <Icon size={18} weight="fill" aria-hidden="true" className={id === "youtube" && kind !== id ? "text-[#ff0033]" : undefined} />
            {text}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {kind === "youtube" ? (
            <div>
              <label htmlFor="video-youtube" className={label}>
                YouTube link
              </label>
              <input
                id="video-youtube"
                className={field}
                placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                inputMode="url"
              />
              <p className={cn("mt-1.5 text-xs", youtubeUrl && !youtubeId ? "text-[#c42b2e]" : "text-muted")}>
                {youtubeUrl && !youtubeId ? "That doesn't look like a YouTube video link." : "Works with normal videos, Shorts and live streams. The thumbnail is added for you."}
              </p>
            </div>
          ) : (
            <div>
              <span className={label}>Video file</span>
              <label
                htmlFor="video-file"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void chooseFile(e.dataTransfer.files[0]);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-8 text-center transition-colors hover:border-indigo/40"
              >
                <FilmStrip size={28} className="text-indigo" aria-hidden="true" />
                <span className="text-sm font-semibold text-ink">{file ? file.name : "Choose a video, or drop it here"}</span>
                <span className="text-xs text-muted">MP4, WebM or MOV, up to {formatSize(MAX_VIDEO_BYTES)}</span>
              </label>
              <input
                ref={fileInput}
                id="video-file"
                type="file"
                accept={VIDEO_TYPES.join(",")}
                className="sr-only"
                onChange={(e) => void chooseFile(e.target.files?.[0])}
              />
              {progress != null && (
                <div className="mt-3" aria-live="polite">
                  <div className="h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-indigo transition-[width]" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{videoUrl ? "Uploaded." : `Uploading… ${progress}%`}</p>
                </div>
              )}
              <p className="mt-2 text-xs text-muted">
                Uploaded videos use your Vercel storage and bandwidth. For long videos, upload to YouTube and paste the link instead.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="video-title" className={label}>
              Title
            </label>
            <input id="video-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
          </div>
          <div>
            <label htmlFor="video-description" className={label}>
              Short description <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea id="video-description" className={cn(field, "min-h-20")} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} />
          </div>
        </div>

        <div>
          <span className={label}>Thumbnail</span>
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
            {preview ? (
              <NewsImage src={preview} alt="" fill sizes="320px" className="object-cover" />
            ) : (
              <p className="absolute inset-0 grid place-items-center px-6 text-center text-xs text-muted">
                {kind === "youtube" ? "Paste a link to see the thumbnail" : "A frame from your video is used after it uploads"}
              </p>
            )}
          </div>
          <label htmlFor="video-thumb" className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-indigo hover:underline">
            <UploadSimple size={16} aria-hidden="true" />
            Use my own image
          </label>
          <input id="video-thumb" type="file" accept="image/*" className="sr-only" onChange={(e) => void chooseThumbnail(e.target.files?.[0])} />
          {thumbnail && (
            <button type="button" onClick={() => setThumbnail("")} className="ml-4 cursor-pointer text-sm text-muted hover:text-ink">
              Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-[#fdecec] px-4 py-3 text-sm text-[#a12226]">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-5 rounded-xl bg-[#e8f6ee] px-4 py-3 text-sm text-[#17663b]">
          Video added. It&apos;s now in the Watch section on the homepage and on the Videos page.
        </p>
      )}

      <button
        type="submit"
        disabled={!ready || busy}
        className="mt-6 cursor-pointer rounded-full bg-night px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Working…" : "Add video"}
      </button>
    </form>
  );
}

function VideoRow({ video, onChanged }: { video: AdminVideo; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "Couldn't save.");
      setEditing(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${video.title}"? ${video.kind === "upload" ? "The uploaded file is deleted too." : ""}`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/videos/${video.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onChanged();
    else setError("Couldn't delete it. Try again.");
  }

  return (
    <li className={cn("flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-line sm:flex-row", !video.published && "opacity-70")}>
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-paper sm:w-48">
        <NewsImage src={thumbOf(video)} alt="" fill sizes="192px" className="object-cover" />
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-night/80 px-2 py-0.5 text-[11px] font-bold text-white">
          {video.kind === "youtube" ? <YoutubeLogo size={12} weight="fill" aria-hidden="true" /> : <FilmStrip size={12} aria-hidden="true" />}
          {video.kind === "youtube" ? "YouTube" : "Uploaded"}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="space-y-3">
            <input aria-label="Title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
            <textarea aria-label="Description" className={cn(field, "min-h-16")} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} />
            <div className="flex gap-2">
              <button type="button" disabled={busy || title.trim().length < 3} onClick={() => void patch({ title, description })} className="cursor-pointer rounded-full bg-night px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setTitle(video.title);
                  setDescription(video.description);
                }}
                className="cursor-pointer rounded-full px-4 py-2 text-xs font-bold text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-display text-xl font-black leading-tight text-ink">{video.title}</p>
            {video.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{video.description}</p>}
            <p className="mt-2 text-xs text-muted">
              Added {new Date(video.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              {" · "}
              <span className={video.published ? "font-semibold text-[#17663b]" : "font-semibold text-orange-deep"}>{video.published ? "On the site" : "Hidden"}</span>
            </p>
          </>
        )}
        {error && <p className="mt-2 text-sm text-[#a12226]">{error}</p>}
      </div>
      {!editing && (
        <div className="flex shrink-0 items-start gap-1">
          <button type="button" disabled={busy} onClick={() => void patch({ published: !video.published })} className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-ink ring-1 ring-line hover:bg-paper">
            {video.published ? <EyeSlash size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            {video.published ? "Hide" : "Show"}
          </button>
          <button type="button" disabled={busy} onClick={() => setEditing(true)} aria-label={`Edit ${video.title}`} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-ink ring-1 ring-line hover:bg-paper">
            <PencilSimple size={15} aria-hidden="true" />
          </button>
          <button type="button" disabled={busy} onClick={() => void remove()} aria-label={`Delete ${video.title}`} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-[#a12226] ring-1 ring-line hover:bg-[#fdecec]">
            <Trash size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}

/** Add, edit, hide and delete the videos in the site's Watch section. */
export default function VideoManager({ videos, tableReady }: { videos: AdminVideo[]; tableReady: boolean }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  if (!tableReady) {
    return (
      <p className="rounded-2xl bg-[#fff4e5] px-5 py-4 text-sm text-ink">
        The videos table hasn&apos;t been created in the database yet. Once it is (a one-off <code>npm run db:push</code>), you can add videos here.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <AddVideoForm onSaved={refresh} />
      <section aria-labelledby="your-videos">
        <h2 id="your-videos" className="font-display text-2xl font-black text-ink">
          Your videos <span className="text-muted">({videos.length})</span>
        </h2>
        {videos.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No videos yet. Until you add one, the site shows three placeholder cards that link to your YouTube channel.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {videos.map((v) => (
              <VideoRow key={v.id} video={v} onChanged={refresh} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
