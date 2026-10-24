import { unstable_cache } from "next/cache";
import { CategorySlug, Fixture, StandingRow } from "@/lib/types";
import { fixtures as mockFixtures } from "@/lib/data/fixtures";
import { standings as mockStandings } from "@/lib/data/standings";
import { dateKey, shiftDate } from "@/lib/time";
import { currentNpflSeason, getNpflFixtures, getNpflMatch, getNpflStandings } from "@/lib/live/npfl";
import { fillMissingResults } from "@/lib/live/highlightly";

/**
 * Live scores, fixtures and tables from football-data.org (set
 * FOOTBALL_DATA_API_KEY). The free plan allows 10 requests a minute for the
 * whole site, so requests are pooled and cached by how fast the data changes:
 *
 * - One "window" request every minute covers every competition from 3 days
 *   ago to 5 days ahead. The ticker, homepage, scores page, date search,
 *   hubs and match pages all read from it.
 * - A league's wider fixture list refreshes every 5 minutes, tables every
 *   15, top scorers hourly, and days outside the window (all finished, or
 *   far ahead) every few hours.
 * - A refused request (rate limit, outage) is never cached: the last good
 *   copy keeps showing, so pages don't flash empty.
 *
 * The NPFL comes from Highlightly instead (see npfl.ts). Without a key,
 * sample fixtures are used for local development only.
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

const ALL_CODES = Object.values(COMPETITION_CODES).join(",");

/** Competitions with real results, fixtures and tables. */
export const SCORE_LEAGUES: CategorySlug[] = ["premier-league", "la-liga", "serie-a", "bundesliga", "champions-league", "npfl"];

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
  competition?: { code?: string; name?: string };
  season?: { startDate?: string };
  homeTeam?: FootballDataTeam;
  awayTeam?: FootballDataTeam;
  score?: { fullTime?: { home: number | null; away: number | null }; halfTime?: { home: number | null; away: number | null } };
  minute?: number | null;
  matchday?: number | null;
  stage?: string | null;
  venue?: string | null;
  referees?: { name?: string; type?: string }[];
  status: string;
  utcDate: string;
  lastUpdated?: string;
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

/* ---------- Requests ---------- */

/** Requests this server made in the last minute, to stay under the plan's 10 a minute. */
const recentRequests: number[] = [];
const MINUTE_BUDGET = 8;

type FdResult<T> = { data: T } | { missing: true };

/**
 * One football-data.org GET. "Not found" is an answer (and cached); a
 * refusal or outage throws, so the cache keeps the last good copy.
 */
async function fdRequest<T>(path: string): Promise<FdResult<T>> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return { missing: true };

  const now = Date.now();
  while (recentRequests.length && now - recentRequests[0] > 60_000) recentRequests.shift();
  if (recentRequests.length >= MINUTE_BUDGET) throw new Error("football-data: holding back to stay under the rate limit");
  recentRequests.push(now);

  const res = await fetch(`https://api.football-data.org/v4${path}`, { headers: { "X-Auth-Token": apiKey }, cache: "no-store" });
  if (res.status === 404 || res.status === 400) return { missing: true };
  if (!res.ok) throw new Error(`football-data ${res.status} for ${path}`);
  return { data: (await res.json()) as T };
}

// One cache per refresh rate. Each keeps the last good answer while a refresh fails.
const tiers = {
  live: unstable_cache(fdRequest, ["football-data", "live"], { revalidate: 60 }),
  league: unstable_cache(fdRequest, ["football-data", "league"], { revalidate: 120 }),
  table: unstable_cache(fdRequest, ["football-data", "table"], { revalidate: 900 }),
  hourly: unstable_cache(fdRequest, ["football-data", "hourly"], { revalidate: 3600 }),
  settled: unstable_cache(fdRequest, ["football-data", "settled"], { revalidate: 6 * 3600 }),
};

/** The data, or null when there is none or the feed can't be reached and nothing is cached yet. */
async function fd<T>(tier: keyof typeof tiers, path: string): Promise<T | null> {
  if (!process.env.FOOTBALL_DATA_API_KEY) return null;
  try {
    const result = (await tiers[tier](path)) as FdResult<T>;
    return "data" in result ? result.data : null;
  } catch (error) {
    console.warn(error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Sample fixtures are for local development and demos only. Once a
 * football-data.org key is set, nothing made-up is ever shown.
 */
function sampleFixtures(match: (f: Fixture) => boolean): Fixture[] {
  return process.env.FOOTBALL_DATA_API_KEY ? [] : mockFixtures.filter(match);
}

/* ---------- Dates ---------- */

/** Today's date as YYYY-MM-DD (UTC). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Accepts only a real calendar date in YYYY-MM-DD form. */
export function parseDateParam(value: string | undefined | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : value;
}

/** The days the shared window covers (UTC, inclusive). */
function windowBounds() {
  const today = todayIso();
  return { from: shiftDate(today, -3), to: shiftDate(today, 5) };
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/* ---------- Matches ---------- */

/** How far along a match is, so the more up-to-date of two copies can be kept. */
const PROGRESS: Record<string, number> = { FINISHED: 3, AWARDED: 3, IN_PLAY: 2, PAUSED: 2 };

/** The fresher of two copies of the same match (the feed's lists don't always agree). */
function fresher(a: FootballDataMatch, b: FootballDataMatch): FootballDataMatch {
  const pa = PROGRESS[a.status] ?? 0;
  const pb = PROGRESS[b.status] ?? 0;
  if (pa !== pb) return pa > pb ? a : b;
  return (b.lastUpdated ?? "") > (a.lastUpdated ?? "") ? b : a;
}

/**
 * The furthest-along copy of each recent match this server has seen. The free
 * feed sometimes answers from a stale copy (a finished match back to "not
 * started"); remembering the best copy keeps scores from going backwards.
 */
const bestSeen = new Map<number, FootballDataMatch>();

function remember(m: FootballDataMatch): FootballDataMatch {
  const known = bestSeen.get(m.id);
  const best = known ? fresher(known, m) : m;
  bestSeen.set(m.id, best);
  if (bestSeen.size > 2000) {
    const old = Date.now() - 3 * 86_400_000;
    for (const [id, match] of bestSeen) if (Date.parse(match.utcDate) < old) bestSeen.delete(id);
  }
  return best;
}

function toFixture(match: FootballDataMatch, slug: CategorySlug): Fixture {
  const m = remember(match);
  const status = STATUS_MAP[m.status] ?? "upcoming";
  // Not started according to the feed, but kick-off was a while ago: the feed is behind.
  const pending = status === "upcoming" && (m.status === "TIMED" || m.status === "SCHEDULED") && Date.parse(m.utcDate) < Date.now() - 5 * 60_000;
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
    pending: pending || undefined,
    matchday: m.matchday ?? undefined,
    status,
    kickoff: m.utcDate,
  };
}

function toFixtures(matches: FootballDataMatch[]): Fixture[] {
  return matches.filter((m) => m.competition?.code && SLUG_BY_CODE[m.competition.code]).map((m) => toFixture(m, SLUG_BY_CODE[m.competition!.code!]));
}

function leagueListPath(code: string) {
  const today = todayIso();
  return `/competitions/${code}/matches?dateFrom=${shiftDate(today, -14)}&dateTo=${shiftDate(today, 21)}`;
}

/**
 * Every competition's matches in the shared window. The combined list
 * refreshes every minute; each league's own list (every 2 minutes) is merged
 * in too, because the feed sometimes updates one and not the other. The
 * fresher copy of each match wins.
 */
async function getWindowMatches(): Promise<FootballDataMatch[] | null> {
  const { from, to } = windowBounds();
  const codes = Object.values(COMPETITION_CODES);
  const [combined, ...leagues] = await Promise.all([
    // The /matches endpoint treats dateTo as exclusive.
    fd<{ matches: FootballDataMatch[] }>("live", `/matches?competitions=${ALL_CODES}&dateFrom=${from}&dateTo=${shiftDate(to, 1)}`),
    ...codes.map((code) => fd<{ matches: FootballDataMatch[] }>("league", leagueListPath(code))),
  ]);
  if (!combined && leagues.every((l) => !l)) return null;

  const inWindow = (m: FootballDataMatch) => m.utcDate.slice(0, 10) >= from && m.utcDate.slice(0, 10) <= to;
  const byId = new Map<number, FootballDataMatch>();
  for (const m of combined?.matches ?? []) byId.set(m.id, m);
  for (const list of leagues) {
    for (const m of list?.matches ?? []) {
      if (!inWindow(m)) continue;
      const known = byId.get(m.id);
      byId.set(m.id, known ? fresher(known, m) : m);
    }
  }
  return [...byId.values()];
}

/** Matches on days outside the window, in pieces of at most 10 days. Past days are settled, so they refresh rarely. */
async function getMatchesOutsideWindow(from: string, to: string): Promise<FootballDataMatch[] | null> {
  const pieces: Promise<{ matches: FootballDataMatch[] } | null>[] = [];
  const settled = to < shiftDate(todayIso(), -1);
  for (let start = from; start <= to; start = shiftDate(start, 10)) {
    const end = daysBetween(start, to) >= 9 ? shiftDate(start, 9) : to;
    pieces.push(fd(settled ? "settled" : "hourly", `/matches?competitions=${ALL_CODES}&dateFrom=${start}&dateTo=${shiftDate(end, 1)}`));
  }
  const results = await Promise.all(pieces);
  return results.some((r) => r) ? results.flatMap((r) => r?.matches ?? []) : null;
}

/**
 * Every match between two UTC dates inclusive, across all competitions
 * including the NPFL. Days inside the shared window cost nothing extra.
 */
export async function getFixturesForRange(dateFrom: string, dateTo: string): Promise<Fixture[]> {
  const inRange = (iso: string) => iso.slice(0, 10) >= dateFrom && iso.slice(0, 10) <= dateTo;
  const win = windowBounds();
  const sources: Promise<FootballDataMatch[] | null>[] = [];
  if (dateTo >= win.from && dateFrom <= win.to) sources.push(getWindowMatches());
  if (dateFrom < win.from) sources.push(getMatchesOutsideWindow(dateFrom, dateTo < win.from ? dateTo : shiftDate(win.from, -1)));
  if (dateTo > win.to) sources.push(getMatchesOutsideWindow(dateFrom > win.to ? dateFrom : shiftDate(win.to, 1), dateTo));

  const results = await Promise.all(sources);
  const seen = new Set<number>();
  const matches = results.flatMap((r) => r ?? []).filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  const main = results.some((r) => r)
    ? await fillMissingResults(toFixtures(matches.filter((m) => inRange(m.utcDate))))
    : sampleFixtures((f) => !!COMPETITION_CODES[f.league] && inRange(f.kickoff));

  const npfl = (await getNpflFixtures()).filter((f) => inRange(f.kickoff));
  const local = sampleFixtures((f) => f.league === "nigeria-football" && inRange(f.kickoff));
  return [...main, ...npfl, ...local].sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
}

/**
 * Every match on one calendar day (YYYY-MM-DD). The day is the UTC one
 * unless a time zone is given; a local day overlaps three UTC days.
 */
export async function getFixturesForDate(date: string, timeZone = "UTC"): Promise<Fixture[]> {
  if (timeZone === "UTC") return getFixturesForRange(date, date);
  const around = await getFixturesForRange(shiftDate(date, -1), shiftDate(date, 1));
  return around.filter((f) => dateKey(f.kickoff, timeZone) === date);
}

/**
 * One competition's results and fixtures from two weeks back to three weeks
 * ahead. The list refreshes every 5 minutes; matches inside the shared window
 * use its fresher (minute-by-minute) scores.
 */
export async function getFixturesForLeague(slug: CategorySlug): Promise<Fixture[]> {
  if (slug === "npfl") return getNpflFixtures();
  const code = COMPETITION_CODES[slug];
  if (!code) return sampleFixtures((f) => f.league === slug);

  const [league, window] = await Promise.all([fd<{ matches: FootballDataMatch[] }>("league", leagueListPath(code)), getWindowMatches()]);
  if (!league && !window) return sampleFixtures((f) => f.league === slug);

  const byId = new Map<number, FootballDataMatch>();
  for (const m of league?.matches ?? []) byId.set(m.id, m);
  for (const m of window ?? []) {
    if (m.competition?.code !== code) continue;
    const known = byId.get(m.id);
    byId.set(m.id, known ? fresher(known, m) : m);
  }
  const fixtures = [...byId.values()].map((m) => toFixture(m, slug)).sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
  return fillMissingResults(fixtures);
}

export async function getAllLiveFixtures(): Promise<Fixture[]> {
  const today = todayIso();
  return (await getFixturesForRange(shiftDate(today, -1), today)).filter((f) => f.status === "live");
}

/**
 * What the scoreboard ticker shows: live matches first, then today's
 * remaining kick-offs and the most recent results, so it is never empty on
 * a quiet day.
 */
export async function getTickerFixtures(limit = 14): Promise<Fixture[]> {
  const today = todayIso();
  const pool = await getFixturesForRange(shiftDate(today, -4), shiftDate(today, 4));
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
 * Everything the ticker and the homepage strip show, from the shared window.
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

/* ---------- One match ---------- */

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

function toMatchInfo(m: FootballDataMatch, slug: CategorySlug): MatchInfo {
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

/**
 * One match by its scores-feed id, or null if it doesn't exist. Matches in
 * the shared window come from it (no extra request, minute-fresh); older or
 * later ones are fetched on their own and cached for an hour. Throws
 * MatchUnavailableError when the feed can't be reached and nothing is cached.
 */
export async function getMatch(id: string): Promise<MatchInfo | null> {
  if (id.startsWith("hl-")) {
    const npfl = await getNpflMatch(id);
    if (!npfl) return null;
    return { fixture: npfl, competition: "NPFL", season: currentNpflSeason(), homeName: npfl.home, awayName: npfl.away, venue: null, referee: null, stage: null, halftime: null };
  }
  if (!/^\d+$/.test(id)) {
    const sample = sampleFixtures((f) => f.id === id)[0];
    if (!sample) return null;
    return { fixture: sample, competition: null, season: new Date(sample.kickoff).getUTCFullYear(), homeName: sample.home, awayName: sample.away, venue: null, referee: null, stage: null, halftime: null };
  }
  if (!process.env.FOOTBALL_DATA_API_KEY) return null;

  const inWindow = (await getWindowMatches())?.find((m) => String(m.id) === id);
  if (inWindow) {
    const slug = inWindow.competition?.code ? SLUG_BY_CODE[inWindow.competition.code] : undefined;
    return slug ? toMatchInfo(inWindow, slug) : null;
  }

  let result: FdResult<FootballDataMatch>;
  try {
    result = (await tiers.hourly(`/matches/${id}`)) as FdResult<FootballDataMatch>;
  } catch (error) {
    // Rate limit or network trouble: the match may well exist, so don't report it missing.
    throw new MatchUnavailableError(error instanceof Error ? error.message : "football-data request failed");
  }
  if (!("data" in result)) return null;
  const slug = result.data.competition?.code ? SLUG_BY_CODE[result.data.competition.code] : undefined;
  return slug ? toMatchInfo(result.data, slug) : null;
}

/* ---------- Tables and scorers ---------- */

export async function getStandingsForLeague(slug: CategorySlug): Promise<StandingRow[] | undefined> {
  if (slug === "npfl") return getNpflStandings();
  const code = COMPETITION_CODES[slug];
  // Made-up tables only ever appear in local development without a key.
  if (!code) return process.env.FOOTBALL_DATA_API_KEY ? undefined : mockStandings[slug];

  const data = await fd<{ standings: { type: string; table: FootballDataStandingRow[] }[] }>("table", `/competitions/${code}/standings`);
  const table = data?.standings?.find((s) => s.type === "TOTAL")?.table;
  if (!table) return process.env.FOOTBALL_DATA_API_KEY ? undefined : mockStandings[slug];

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

export interface TopScorer {
  player: string;
  nationality: string | null;
  team: string;
  crest?: string;
  goals: number;
  assists: number | null;
  penalties: number | null;
  played: number | null;
}

interface FootballDataScorer {
  player?: { name?: string; nationality?: string | null };
  team?: FootballDataTeam;
  goals?: number | null;
  assists?: number | null;
  penalties?: number | null;
  playedMatches?: number | null;
}

/** A competition's top scorers this season, refreshed hourly. Empty when unavailable. */
export async function getTopScorers(slug: CategorySlug, limit = 10): Promise<TopScorer[]> {
  const code = COMPETITION_CODES[slug];
  if (!code) return [];
  const data = await fd<{ scorers?: FootballDataScorer[] }>("hourly", `/competitions/${code}/scorers?limit=${limit}`);
  return (data?.scorers ?? [])
    .filter((s) => s.player?.name && s.goals != null)
    .map((s) => ({
      player: s.player!.name!,
      nationality: s.player?.nationality ?? null,
      team: s.team?.shortName ?? s.team?.name ?? "",
      crest: s.team?.crest,
      goals: s.goals ?? 0,
      assists: s.assists ?? null,
      penalties: s.penalties ?? null,
      played: s.playedMatches ?? null,
    }));
}
