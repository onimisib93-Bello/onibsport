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

const SLUG_BY_CODE = Object.fromEntries(
  Object.entries(COMPETITION_CODES).map(([slug, code]) => [code, slug as CategorySlug])
) as Record<string, CategorySlug>;

/** Leagues that have results/fixtures at all (live API or placeholder data). */
export const SCORE_LEAGUES: CategorySlug[] = [
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "champions-league",
  "npfl",
  "nigeria-football",
];

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
  crest?: string;
}

interface FootballDataMatch {
  id: number;
  competition?: { code?: string };
  homeTeam?: FootballDataTeam;
  awayTeam?: FootballDataTeam;
  score?: { fullTime?: { home: number | null; away: number | null } };
  minute?: number | null;
  matchday?: number | null;
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
  form?: string | null;
}

/**
 * Sample fixtures are for local development and demos only. Once a
 * football-data.org key is set, a failed request (the free plan allows 10 a
 * minute) must show nothing rather than made-up scores that look live.
 */
function sampleFixtures(match: (f: Fixture) => boolean): Fixture[] {
  return process.env.FOOTBALL_DATA_API_KEY ? [] : mockFixtures.filter(match);
}

async function fetchFromFootballData<T>(path: string, revalidate = 60): Promise<T | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.football-data.org/v4${path}`, {
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

/** Today's date as YYYY-MM-DD (UTC). */
export function todayIso(): string {
  return isoDate(0);
}

/** Accepts only a real calendar date in YYYY-MM-DD form. */
export function parseDateParam(value: string | undefined | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : value;
}

function toFixture(m: FootballDataMatch, slug: CategorySlug): Fixture {
  return {
    id: String(m.id),
    league: slug,
    home: m.homeTeam?.shortName ?? m.homeTeam?.name ?? "TBD",
    away: m.awayTeam?.shortName ?? m.awayTeam?.name ?? "TBD",
    homeCrest: m.homeTeam?.crest,
    awayCrest: m.awayTeam?.crest,
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
    minute: m.minute ?? null,
    paused: m.status === "PAUSED",
    matchday: m.matchday ?? undefined,
    status: STATUS_MAP[m.status] ?? "upcoming",
    kickoff: m.utcDate,
  };
}

/**
 * football-data.org returns the WHOLE season (~380 matches) if you don't
 * bound it — so every call here is scoped to a rolling window of recent
 * results and near-term fixtures rather than the full fixture list.
 */
export async function getFixturesForLeague(slug: CategorySlug): Promise<Fixture[]> {
  const code = COMPETITION_CODES[slug];
  const fallback = sampleFixtures((f) => f.league === slug);
  if (!code) return fallback;

  const dateFrom = isoDate(-14);
  const dateTo = isoDate(21);
  const data = await fetchFromFootballData<{ matches: FootballDataMatch[] }>(
    `/competitions/${code}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
  );
  if (!data?.matches) return fallback;

  return data.matches.map((m) => toFixture(m, slug));
}

/**
 * Every match on one calendar day (YYYY-MM-DD, UTC) across all covered
 * leagues — one API request for the five football-data.org competitions,
 * plus the placeholder NPFL/Nigeria fixtures for that day.
 */
export async function getFixturesForDate(date: string): Promise<Fixture[]> {
  return getFixturesForRange(date, date);
}

/** Every match between two dates inclusive (YYYY-MM-DD, UTC; at most 10 days apart). */
export async function getFixturesForRange(dateFrom: string, dateTo: string): Promise<Fixture[]> {
  const inRange = (iso: string) => iso.slice(0, 10) >= dateFrom && iso.slice(0, 10) <= dateTo;
  const codes = Object.values(COMPETITION_CODES).join(",");
  // The /matches endpoint treats dateTo as exclusive, so ask for one more day and trim.
  const end = new Date(`${dateTo}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const data = await fetchFromFootballData<{ matches: FootballDataMatch[] }>(
    `/matches?competitions=${codes}&dateFrom=${dateFrom}&dateTo=${end.toISOString().slice(0, 10)}`,
    // Live scores move fast; this one request covers every competition, so refresh it more often.
    30
  );

  const live: Fixture[] = data?.matches
    ? data.matches
        .filter((m) => inRange(m.utcDate) && m.competition?.code && SLUG_BY_CODE[m.competition.code])
        .map((m) => toFixture(m, SLUG_BY_CODE[m.competition!.code!]))
    : sampleFixtures((f) => !!COMPETITION_CODES[f.league] && inRange(f.kickoff));

  const local = sampleFixtures((f) => !COMPETITION_CODES[f.league] && inRange(f.kickoff));
  return [...live, ...local].sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
}

export async function getAllLiveFixtures(): Promise<Fixture[]> {
  const supportedSlugs = Object.keys(COMPETITION_CODES) as CategorySlug[];
  const results = await Promise.all(supportedSlugs.map(getFixturesForLeague));
  const live = results.flat().filter((f) => f.status === "live");

  const mockLive = sampleFixtures((f) => f.status === "live" && !COMPETITION_CODES[f.league]);
  return [...live, ...mockLive];
}

/**
 * What the scoreboard ticker shows: live matches first, then today's
 * remaining kick-offs and the most recent results, so it is never empty on
 * a quiet day.
 */
export async function getTickerFixtures(limit = 14): Promise<Fixture[]> {
  const pool = await getFixturesForRange(isoDate(-4), isoDate(4));
  const now = Date.now();
  const live = pool.filter((f) => f.status === "live");
  const upcoming = pool.filter((f) => f.status === "upcoming" && +new Date(f.kickoff) >= now - 3 * 3600_000);
  const results = pool.filter((f) => f.status === "finished").reverse();
  // Live first, then alternate the next kick-offs with the latest results.
  const mixed: Fixture[] = [...live];
  for (let i = 0; mixed.length < limit && (i < upcoming.length || i < results.length); i++) {
    if (results[i]) mixed.push(results[i]);
    if (upcoming[i]) mixed.push(upcoming[i]);
  }
  return mixed.slice(0, limit);
}

export interface Scoreboard {
  /** YYYY-MM-DD (UTC) the board was built for. */
  today: string;
  /** For the LED ticker in the header. */
  ticker: Fixture[];
  /** For the homepage match centre strip. */
  strip: Fixture[];
  /** True when nothing is scheduled today, so the strip shows recent results and next kick-offs. */
  quietDay: boolean;
  generatedAt: string;
}

/**
 * Everything the ticker and the homepage strip show, from one cached request.
 * Served to the browser by /api/scores/live so open pages stay current.
 */
export async function getScoreboard(): Promise<Scoreboard> {
  const today = todayIso();
  const [todays, ticker] = await Promise.all([getFixturesForDate(today), getTickerFixtures(16)]);
  // Today's matches; on a quiet day, pad with recent results and upcoming kick-offs.
  const seen = new Set(todays.map((f) => f.id));
  const strip = todays.length >= 6 ? todays : [...todays, ...ticker.filter((f) => !seen.has(f.id))].slice(0, 14);
  return { today, ticker: ticker.slice(0, 14), strip, quietDay: todays.length === 0, generatedAt: new Date().toISOString() };
}

interface FootballDataMatchDetail extends FootballDataMatch {
  competition?: { code?: string; name?: string };
  season?: { startDate?: string };
  venue?: string | null;
  stage?: string | null;
  referees?: { name?: string; type?: string }[];
  homeTeam?: FootballDataTeam & { tla?: string };
  awayTeam?: FootballDataTeam & { tla?: string };
  score?: FootballDataMatch["score"] & { halfTime?: { home: number | null; away: number | null } };
}

export interface MatchInfo {
  fixture: Fixture;
  competition: string | null;
  /** Season start year, e.g. 2026 for 2026/27. */
  season: number;
  /** Full team names, as well as the short ones on the fixture. */
  homeName: string;
  awayName: string;
  venue: string | null;
  referee: string | null;
  stage: string | null;
  halftime: { home: number; away: number } | null;
}

/** The scores feed could not be reached (rate limit or network), as opposed to the match not existing. */
export class MatchUnavailableError extends Error {}

/** One match by its scores-feed id, or null if it doesn't exist. Throws MatchUnavailableError if the feed is unreachable. */
export async function getMatch(id: string): Promise<MatchInfo | null> {
  if (!/^\d+$/.test(id)) {
    const sample = sampleFixtures((f) => f.id === id)[0];
    if (!sample) return null;
    return {
      fixture: sample,
      competition: null,
      season: new Date(sample.kickoff).getUTCFullYear(),
      homeName: sample.home,
      awayName: sample.away,
      venue: null,
      referee: null,
      stage: null,
      halftime: null,
    };
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return null;
  let m: FootballDataMatchDetail;
  try {
    const res = await fetch(`https://api.football-data.org/v4/matches/${id}`, { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 30 } });
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) throw new Error(`football-data ${res.status}`);
    m = (await res.json()) as FootballDataMatchDetail;
  } catch (error) {
    // Rate limit or network trouble: the match may well exist, so don't report it missing.
    throw new MatchUnavailableError(error instanceof Error ? error.message : "football-data request failed");
  }
  const slug = m.competition?.code ? SLUG_BY_CODE[m.competition.code] : undefined;
  if (!slug) return null;

  const ht = m.score?.halfTime;
  const startYear = Number(m.season?.startDate?.slice(0, 4));
  return {
    fixture: toFixture(m, slug),
    competition: m.competition?.name ?? null,
    season: Number.isFinite(startYear) && startYear > 0 ? startYear : new Date(m.utcDate).getUTCFullYear(),
    homeName: m.homeTeam?.name ?? m.homeTeam?.shortName ?? "TBD",
    awayName: m.awayTeam?.name ?? m.awayTeam?.shortName ?? "TBD",
    venue: m.venue ?? null,
    referee: m.referees?.find((r) => r.type === "REFEREE")?.name ?? m.referees?.[0]?.name ?? null,
    stage: m.stage ?? null,
    halftime: ht && ht.home != null && ht.away != null ? { home: ht.home, away: ht.away } : null,
  };
}

export async function getStandingsForLeague(slug: CategorySlug): Promise<StandingRow[] | undefined> {
  const code = COMPETITION_CODES[slug];
  const fallback = mockStandings[slug];
  if (!code) return fallback;

  const data = await fetchFromFootballData<{ standings: { type: string; table: FootballDataStandingRow[] }[] }>(
    `/competitions/${code}/standings`
  );
  const table = data?.standings?.find((s) => s.type === "TOTAL")?.table;
  // Same rule as fixtures: no made-up table when the real request failed.
  if (!table) return process.env.FOOTBALL_DATA_API_KEY ? undefined : fallback;

  return table.map((row) => ({
    team: row.team?.shortName ?? row.team?.name ?? "Unknown",
    crest: row.team?.crest,
    played: row.playedGames,
    won: row.won,
    drawn: row.draw,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    form: row.form ?? undefined,
  }));
}
