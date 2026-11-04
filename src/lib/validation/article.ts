import { z } from "zod";

export const articleInputSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
  dek: z.string().min(3).max(400),
  body: z.string().min(1),
  image: z.string().min(1),
  imageAlt: z.string().min(1).max(200),
  imageFocus: z
    .string()
    .regex(/^\d{1,3},\d{1,3}$/)
    .optional()
    .or(z.literal("")),
  coverImage: z.string().max(1000).optional().or(z.literal("")),
  shareText: z.string().max(120).optional().or(z.literal("")),
  keyPoints: z.string().max(1500).optional().or(z.literal("")),
  author: z.string().min(1).max(120),
  source: z.string().max(200).optional().or(z.literal("")),
  tags: z.string().max(300).optional().or(z.literal("")),
  isBreaking: z.boolean().optional(),
  featured: z.boolean().optional(),
  featuredVideoUrl: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED"]),
  /** When a published story goes live (ISO date). Blank = now; a future date schedules it. */
  publishAt: z
    .string()
    .max(40)
    .refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date and time")
    .optional()
    .or(z.literal("")),
  categoryId: z.string().min(1),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;
