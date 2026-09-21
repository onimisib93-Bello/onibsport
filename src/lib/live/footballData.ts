import { CategorySlug, Fixture, StandingRow } from "@/lib/types";
import { fixtures as mockFixtures } from "@/lib/data/fixtures";
import { standings as mockStandings } from "@/lib/data/standings";

/**
 * Real live-score/standings source via football-data.org (free tier available
 * at football-data.org/client/register). Set FOOTBALL_DATA_API_KEY to enable —
 * without it, or if a request fails, everything falls back to the mock data
 * so the site never breaks.
 *
 * NPFL/Nigeria Football aren't covered by football-data.org's free tier (or
 * most mainstream free football APIs), so those two categories always use
 * the mock data below until a Nigeria-specific data source is wired in.
 */

const COMPETITION_CODES: Partial<Record<CategorySlug, string>> = {
  "premier-league": "PL",
  "la-liga": "PD",
  "serie-a": "SA",
  bundesliga: "BL1",
  "champions-league": "CL",
};

const STATUS_MAP: Record<string, Fixture["status"]> = {
  SCHEDULED: "upcoming",
  TIMED: "upcoming",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "finished",
  SUSPENDED: "upcoming",
  POSTPONED: "upcoming",
  CANCELLED: "upcoming",
  AWARDED: "finished",
};

interface FootballDataTeam {
  name?: string;
  shortName?: string;
}

interface FootballDataMatch {
  id: number;
  homeTeam?: FootballDataTeam;
  awayTeam?: FootballDataTeam;
  score?: { fullTime?: { home: number | null; away: number | null } };
  minute?: number | null;
  status: string;
  utcDate: string;
}

interface FootballDataStandingRow {
  team?: FootballDataTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

async function fetchFromFootballData<T>(path: string): Promise<T | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.football-data.org/v4${path}`, {
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getFixturesForLeague(slug: CategorySlug): Promise<Fixture[]> {
  const code = COMPETITION_CODES[slug];
  const fallback = mockFixtures.filter((f) => f.league === slug);
  if (!code) return fallback;

  const data = await fetchFromFootballData<{ matches: FootballDataMatch[] }>(`/competitions/${code}/matches`);
  if (!data?.matches) return fallback;

  return data.matches.map((m) => ({
    id: String(m.id),
    league: slug,
    home: m.homeTeam?.shortName ?? m.homeTeam?.name ?? "TBD",
    away: m.awayTeam?.shortName ?? m.awayTeam?.name ?? "TBD",
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
    minute: m.minute ?? null,
    status: STATUS_MAP[m.status] ?? "upcoming",
    kickoff: m.utcDate,
  }));
}

export async function getAllLiveFixtures(): Promise<Fixture[]> {
  const supportedSlugs = Object.keys(COMPETITION_CODES) as CategorySlug[];
  const results = await Promise.all(supportedSlugs.map(getFixturesForLeague));
  const live = results.flat().filter((f) => f.status === "live");

  const mockLive = mockFixtures.filter((f) => f.status === "live" && !COMPETITION_CODES[f.league]);
  return [...live, ...mockLive];
}

export async function getStandingsForLeague(slug: CategorySlug): Promise<StandingRow[] | undefined> {
  const code = COMPETITION_CODES[slug];
  const fallback = mockStandings[slug];
  if (!code) return fallback;

  const data = await fetchFromFootballData<{ standings: { type: string; table: FootballDataStandingRow[] }[] }>(
    `/competitions/${code}/standings`
  );
  const table = data?.standings?.find((s) => s.type === "TOTAL")?.table;
  if (!table) return fallback;

  return table.map((row) => ({
    team: row.team?.shortName ?? row.team?.name ?? "Unknown",
    played: row.playedGames,
    won: row.won,
    drawn: row.draw,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
  }));
}
