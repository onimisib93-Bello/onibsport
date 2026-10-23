/**
 * The coloured bands down the side of each league table: who qualifies for
 * what and who goes down. Positions are 1-based; negative numbers count from
 * the bottom (-1 is last place).
 */
export interface TableZone {
  from: number;
  to: number;
  label: string;
  /** "accent" uses the league's own colour. */
  color: string;
}

const RED = "#d23b3b";
const SKY = "#1576a6";
const AMBER = "#c27803";

const LEAGUE_ZONES: Record<string, TableZone[]> = {
  "premier-league": [
    { from: 1, to: 4, label: "Champions League", color: "accent" },
    { from: -3, to: -1, label: "Relegation", color: RED },
  ],
  "la-liga": [
    { from: 1, to: 4, label: "Champions League", color: "accent" },
    { from: -3, to: -1, label: "Relegation", color: RED },
  ],
  "serie-a": [
    { from: 1, to: 4, label: "Champions League", color: "accent" },
    { from: -3, to: -1, label: "Relegation", color: RED },
  ],
  bundesliga: [
    { from: 1, to: 4, label: "Champions League", color: "accent" },
    { from: -3, to: -3, label: "Relegation play-off", color: AMBER },
    { from: -2, to: -1, label: "Relegation", color: RED },
  ],
  "champions-league": [
    { from: 1, to: 8, label: "Round of 16", color: "accent" },
    { from: 9, to: 24, label: "Knockout play-offs", color: SKY },
    { from: 25, to: 36, label: "Eliminated", color: RED },
  ],
  npfl: [
    { from: 1, to: 2, label: "CAF Champions League", color: "accent" },
    { from: -4, to: -1, label: "Relegation", color: RED },
  ],
};

/** Generic bands for a league without its own: top four, and the bottom three in tables of ten or more. */
const DEFAULT_ZONES: TableZone[] = [
  { from: 1, to: 4, label: "Top four", color: "accent" },
  { from: -3, to: -1, label: "Relegation zone", color: RED },
];

export function zonesFor(league?: string): TableZone[] {
  return (league && LEAGUE_ZONES[league]) || DEFAULT_ZONES;
}

/** Resolve negative positions against the table size; drops bottom bands in tables too small for them. */
export function resolveZones(zones: TableZone[], total: number, accent: string) {
  return zones
    .map((z) => ({ ...z, from: z.from < 0 ? total + 1 + z.from : z.from, to: z.to < 0 ? total + 1 + z.to : z.to, color: z.color === "accent" ? accent : z.color }))
    .filter((z) => z.from >= 1 && z.to >= z.from && z.from <= total && !(z.from > 4 && total < 10));
}
