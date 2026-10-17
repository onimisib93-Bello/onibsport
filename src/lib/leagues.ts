import { CategorySlug } from "@/lib/types";

/**
 * Presentation data for each league hub — kit colours, a one-line brief and
 * the region it belongs to. Kept separate from the Category rows in the
 * database so the look can change without a migration.
 */
export interface LeagueTheme {
  /** Deep kit colour used for hub headers and night panels. */
  deep: string;
  /** Bright accent used for active states on that hub. */
  tint: string;
  /** Text colour that reads on `tint`. */
  onTint: string;
  /** Two- or three-letter crest monogram. */
  crest: string;
  region: string;
  blurb: string;
  /** Whether results/fixtures/tables exist for this hub. */
  hasTable: boolean;
}

export const leagueThemes: Record<CategorySlug, LeagueTheme> = {
  "premier-league": {
    deep: "#2b0d47",
    tint: "#00d47e",
    onTint: "#0d0620",
    crest: "PL",
    region: "England",
    blurb: "Title races, relegation scraps and every twist from England's top flight.",
    hasTable: true,
  },
  "la-liga": {
    deep: "#4a0d18",
    tint: "#ff5a4e",
    onTint: "#1d0508",
    crest: "LL",
    region: "Spain",
    blurb: "Clásicos, Madrid derbies and the tactical chess of Spanish football.",
    hasTable: true,
  },
  "serie-a": {
    deep: "#0a2350",
    tint: "#3f8cff",
    onTint: "#04112a",
    crest: "SA",
    region: "Italy",
    blurb: "Calcio's defensive arts, derby days and the race for the Scudetto.",
    hasTable: true,
  },
  bundesliga: {
    deep: "#4d080d",
    tint: "#ff3b45",
    onTint: "#1f0305",
    crest: "BL",
    region: "Germany",
    blurb: "Der Klassiker, wonderkids and Germany's goal-heavy weekends.",
    hasTable: true,
  },
  "champions-league": {
    deep: "#071741",
    tint: "#9fbcff",
    onTint: "#061234",
    crest: "UCL",
    region: "Europe",
    blurb: "European nights: group stages, knockout drama and the road to the final.",
    hasTable: false,
  },
  "nigeria-football": {
    deep: "#003d24",
    tint: "#2fd38a",
    onTint: "#00170d",
    crest: "NGA",
    region: "Nigeria",
    blurb: "The Super Eagles, the Super Falcons and Nigerians making waves abroad.",
    hasTable: false,
  },
  npfl: {
    deep: "#0b3326",
    tint: "#f2c230",
    onTint: "#1d1600",
    crest: "NPFL",
    region: "Nigeria",
    blurb: "Every matchday from the Nigeria Professional Football League.",
    hasTable: true,
  },
  transfers: {
    deep: "#2e2103",
    tint: "#fbb03b",
    onTint: "#1d1400",
    crest: "TW",
    region: "Worldwide",
    blurb: "Done deals, medicals and the rumours worth your attention.",
    hasTable: false,
  },
};

export function leagueTheme(slug: string): LeagueTheme {
  return leagueThemes[slug as CategorySlug] ?? leagueThemes["premier-league"];
}
