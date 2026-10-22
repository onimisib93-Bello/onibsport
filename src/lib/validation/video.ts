import { z } from "zod";
import { parseYouTubeId } from "@/lib/videos";

/** True for files we host ourselves (Vercel Blob), so only those can be uploaded links. */
function isBlobUrl(value: string) {
  try {
    return new URL(value).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

const thumbnailField = z
  .string()
  .max(1000)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), "Use an uploaded image or an https:// image link")
  .optional();

export const videoInputSchema = z
  .object({
    title: z.string().trim().min(3, "Give the video a title").max(160),
    description: z.string().trim().max(400).optional().default(""),
    kind: z.enum(["youtube", "upload"]),
    youtubeUrl: z.string().trim().max(500).optional(),
    videoUrl: z.string().trim().max(1000).optional(),
    thumbnail: thumbnailField,
    published: z.boolean().optional().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "youtube" && !parseYouTubeId(v.youtubeUrl ?? "")) {
      ctx.addIssue({ code: "custom", path: ["youtubeUrl"], message: "Paste a YouTube video link" });
    }
    if (v.kind === "upload" && !(v.videoUrl && isBlobUrl(v.videoUrl))) {
      ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "Upload the video file first" });
    }
  });

export const videoUpdateSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(400).optional(),
  thumbnail: thumbnailField,
  published: z.boolean().optional(),
});

export type VideoInput = z.infer<typeof videoInputSchema>;
