import { Category } from "@/lib/types";

export const categories: Category[] = [
  { slug: "premier-league", name: "Premier League", shortName: "PL", accent: "indigo" },
  { slug: "la-liga", name: "La Liga", shortName: "La Liga", accent: "sky" },
  { slug: "serie-a", name: "Serie A", shortName: "Serie A", accent: "orange" },
  { slug: "bundesliga", name: "Bundesliga", shortName: "Bundesliga", accent: "gold" },
  { slug: "champions-league", name: "Champions League", shortName: "UCL", accent: "indigo" },
  { slug: "nigeria-football", name: "Nigeria Football", shortName: "Nigeria", accent: "sky" },
  { slug: "npfl", name: "NPFL", shortName: "NPFL", accent: "orange" },
  { slug: "transfers", name: "Transfers", shortName: "Transfers", accent: "gold" },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
