import { cache } from "react";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

/**
 * Writers. Stories store the byline as a name (Article.author); a profile in
 * the Author table adds a photo, role and bio to that byline and to the
 * writer's page at /author/[slug]. Every byline gets a page, profile or not.
 */

export interface AuthorProfile {
  id?: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  xHandle: string | null;
}

export function authorSlug(name: string) {
  return slugify(name) || "onibsport-desk";
}

export function authorPath(name: string) {
  return `/author/${authorSlug(name)}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** The byline's profile, or a bare one made from the name. */
export const getAuthorByName = cache(async function getAuthorByName(name: string): Promise<AuthorProfile> {
  const bare: AuthorProfile = { slug: authorSlug(name), name, role: "", bio: "", photo: null, xHandle: null };
  try {
    const row = await prisma.author.findFirst({ where: { name: { equals: name.trim(), mode: "insensitive" } } });
    return row ?? bare;
  } catch {
    return bare;
  }
});

/** The writer behind /author/[slug]: a profile, or any byline whose name makes that slug. */
export const getAuthorBySlug = cache(async function getAuthorBySlug(slug: string): Promise<AuthorProfile | null> {
  try {
    const row = await prisma.author.findUnique({ where: { slug } });
    if (row) return row;
  } catch {
    // Table not created yet: fall back to bylines.
  }
  try {
    const names = await prisma.article.findMany({ where: { status: "PUBLISHED" }, select: { author: true }, distinct: ["author"] });
    const match = names.find((n) => authorSlug(n.author) === slug);
    return match ? { slug, name: match.author, role: "", bio: "", photo: null, xHandle: null } : null;
  } catch {
    return null;
  }
});

export async function listAuthors(): Promise<AuthorProfile[] | null> {
  try {
    return await prisma.author.findMany({ orderBy: { name: "asc" } });
  } catch {
    return null;
  }
}

/** Every writer name (profiles first, then any other byline) for the Author field in the editor. */
export async function writerNames(): Promise<string[]> {
  const [profiles, bylines] = await Promise.all([
    listAuthors(),
    prisma.article.findMany({ select: { author: true }, distinct: ["author"] }).catch(() => []),
  ]);
  const names = [...(profiles ?? []).map((a) => a.name), ...bylines.map((b) => b.author)];
  return [...new Map(names.map((n) => [n.toLowerCase(), n])).values()];
}

export const authorInputSchema = z.object({
  name: z.string().trim().min(2, "Add the writer's name").max(120),
  role: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(1200).default(""),
  photo: z.string().trim().max(1000).optional().or(z.literal("")),
  xHandle: z
    .string()
    .trim()
    .max(40)
    .transform((v) => v.replace(/^@/, ""))
    .refine((v) => v === "" || /^\w{1,15}$/.test(v), "Use the X handle only, like onibsport")
    .optional(),
});

export type AuthorInput = z.infer<typeof authorInputSchema>;
