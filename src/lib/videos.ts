/** A video as the site shows it: a YouTube video or an uploaded file. */
export interface SiteVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  /** Set for YouTube videos. */
  youtubeId?: string | null;
  /** Set for uploaded files. */
  videoUrl?: string | null;
  createdAt?: string;
}

/** File types accepted for direct uploads (MP4, WebM, MOV). */
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
/** Largest file accepted for a direct upload. Longer videos belong on YouTube. */
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

/**
 * The 11-character id from any YouTube link: watch?v=, youtu.be/, /shorts/,
 * /embed/, /live/ or a bare id. Null when it isn't a YouTube video.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/)?.[1] ?? null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

export function youTubeThumbnail(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youTubeEmbed(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}

/** What the popup player should load for a video, or null when it only links out to the channel. */
export function playSource(video: Pick<SiteVideo, "youtubeId" | "videoUrl">): { src: string; file: boolean } | null {
  if (video.youtubeId) return { src: youTubeEmbed(video.youtubeId), file: false };
  if (video.videoUrl) return { src: video.videoUrl, file: true };
  return null;
}
