import { CategorySlug, StandingRow } from "@/lib/types";

function row(team: string, played: number, won: number, drawn: number, goalsFor: number, goalsAgainst: number): StandingRow {
  return { team, played, won, drawn, lost: played - won - drawn, goalsFor, goalsAgainst };
}

export const standings: Partial<Record<CategorySlug, StandingRow[]>> = {
  "premier-league": [
    row("Arsenal", 12, 8, 3, 27, 11),
    row("Man City", 12, 8, 2, 29, 14),
    row("Liverpool", 12, 7, 3, 24, 13),
    row("Chelsea", 12, 7, 2, 23, 15),
    row("Aston Villa", 12, 6, 4, 20, 16),
    row("Newcastle", 12, 5, 4, 18, 17),
    row("Tottenham", 12, 5, 3, 21, 19),
    row("Brighton", 12, 4, 5, 17, 18),
  ],
  "la-liga": [
    row("Real Madrid", 12, 9, 2, 28, 10),
    row("Barcelona", 12, 8, 3, 30, 15),
    row("Atletico Madrid", 12, 7, 3, 22, 13),
    row("Sevilla", 12, 5, 4, 17, 16),
    row("Real Sociedad", 12, 5, 3, 16, 15),
    row("Villarreal", 12, 4, 5, 19, 20),
    row("Athletic Bilbao", 12, 4, 4, 15, 14),
  ],
  "serie-a": [
    row("Juventus", 12, 8, 3, 22, 9),
    row("Inter", 12, 8, 2, 25, 12),
    row("AC Milan", 12, 6, 4, 20, 15),
    row("Napoli", 12, 6, 3, 19, 14),
    row("AS Roma", 12, 5, 4, 16, 15),
    row("Atalanta", 12, 5, 3, 21, 18),
    row("Lazio", 12, 4, 5, 15, 16),
  ],
  bundesliga: [
    row("Bayern Munich", 12, 9, 2, 33, 12),
    row("Dortmund", 12, 7, 3, 26, 17),
    row("Bayer Leverkusen", 12, 7, 2, 24, 14),
    row("RB Leipzig", 12, 6, 3, 21, 15),
    row("Stuttgart", 12, 5, 4, 19, 17),
    row("Eintracht Frankfurt", 12, 4, 5, 18, 19),
  ],
  npfl: [
    row("Rivers United", 14, 9, 3, 24, 10),
    row("Enyimba", 14, 8, 4, 22, 13),
    row("Remo Stars", 14, 8, 3, 21, 12),
    row("Plateau United", 14, 7, 4, 18, 14),
    row("Kano Pillars", 14, 6, 4, 17, 16),
    row("Shooting Stars", 14, 5, 5, 15, 17),
    row("Bendel Insurance", 14, 4, 5, 13, 18),
    row("Sunshine Stars", 14, 3, 4, 12, 22),
  ],
};

export function getStandings(slug: string): StandingRow[] | undefined {
  return standings[slug as CategorySlug];
}
