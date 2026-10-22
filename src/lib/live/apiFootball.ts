import { unstable_cache } from "next/cache";
import { CategorySlug } from "@/lib/types";

/**
 * Match details (scorers, cards, substitutions, line-ups and team stats) from
 * API-Football (api-sports.io). Set API_FOOTBALL_KEY to enable; without it,
 * match pages show the score, venue and referee only.
 *
 * The free plan allows 100 requests a day, so every answer is cached and
 * shared by all visitors: a finished match is fetched about once, a live one
 * at most every 15 minutes, and the lookup that finds a match's API-Football
 * id is one request per league per day. Failed requests are never cached;
 * the last good copy keeps showing instead.
 */

const BASE = "https://v3.football.api-sports.io";

const LEAGUE_IDS: Partial<Record<CategorySlug, number>> = {
  "premier-league": 39,
  "la-liga": 140,
  "serie-a": 135,
  bundesliga: 78,
  "champions-league": 2,
};

/** Requests left today, from the last response this server saw. */
let remainingToday: number | null = null;

class QuotaError extends Error {}

interface ApiResponse<T> {
  errors: unknown;
  response: T[];
}

/**
 * One API-Football GET. Returns null when the plan cannot serve it (for
 * example a season the free plan does not cover), which is safe to cache.
 * Throws when the daily or per-minute limit is hit, so nothing is cached.
 */
async function apiGet<T>(path: string): Promise<T[] | null> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return null;
  if (remainingToday != null && remainingToday <= 3) throw new QuotaError("API-Football daily limit nearly used");

  const res = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": key }, cache: "no-store" });
  const left = Number(res.headers.get("x-ratelimit-requests-remaining"));
  if (Number.isFinite(left) && res.headers.has("x-ratelimit-requests-remaining")) remainingToday = left;
  if (res.status === 429) throw new QuotaError("API-Football rate limit");
  if (!res.ok) throw new Error(`API-Football ${res.status}`);

  const body = (await res.json()) as ApiResponse<T>;
  const errors = body.errors && typeof body.errors === "object" ? (body.errors as Record<string, string>) : {};
  if (errors.requests || errors.rateLimit) throw new QuotaError(String(errors.requests ?? errors.rateLimit));
  if (Object.keys(errors).length > 0) {
    console.warn("API-Football refused", path, errors);
    return null;
  }
  return body.response ?? [];
}

/* ---------- Finding the API-Football fixture for a football-data match ---------- */

interface DayFixture {
  id: number;
  ts: number;
  home: string;
  away: string;
}

interface RawFixtureSummary {
  fixture: { id: number; timestamp: number };
  teams: { home: { name: string }; away: { name: string } };
}

const getLeagueDay = unstable_cache(
  async (leagueId: number, season: number, date: string): Promise<DayFixture[] | null> => {
    const rows = await apiGet<RawFixtureSummary>(`/fixtures?league=${leagueId}&season=${season}&date=${date}&timezone=UTC`);
    return rows?.map((r) => ({ id: r.fixture.id, ts: r.fixture.timestamp, home: r.teams.home.name, away: r.teams.away.name })) ?? null;
  },
  ["api-football-league-day"],
  { revalidate: 12 * 3600 }
);

const STOP_WORDS = new Set(["fc", "cf", "afc", "sc", "ac", "as", "ss", "ssc", "sv", "fk", "club", "de", "calcio", "1907", "1909", "1899", "cp", "rc", "vfb", "vfl", "tsg"]);

function tokens(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP_WORDS.has(t));
}

/** 0..1 overlap between two team names; "Man United" and "Manchester United" match. */
function nameScore(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.length || !tb.length) return 0;
  const hits = ta.filter((x) => tb.some((y) => x === y || (x.length >= 3 && y.startsWith(x)) || (y.length >= 3 && x.startsWith(y)))).length;
  return hits / Math.min(ta.length, tb.length);
}

export interface MatchRef {
  league: CategorySlug;
  /** Season start year, e.g. 2026 for 2026/27. */
  season: number;
  kickoff: string;
  /** Every name the scores feed has for each team. */
  homeNames: string[];
  awayNames: string[];
}

async function findFixtureId(ref: MatchRef): Promise<number | null> {
  const leagueId = LEAGUE_IDS[ref.league];
  if (!leagueId) return null;
  const day = await getLeagueDay(leagueId, ref.season, ref.kickoff.slice(0, 10));
  if (!day?.length) return null;

  const kickoffTs = Math.floor(new Date(ref.kickoff).getTime() / 1000);
  const best = (names: string[], candidate: string) => Math.max(...names.map((n) => nameScore(n, candidate)));
  const scored = day
    .map((f) => ({ f, score: best(ref.homeNames, f.home) + best(ref.awayNames, f.away) + (f.ts === kickoffTs ? 0.5 : 0) }))
    .sort((a, b) => b.score - a.score);
  // Both teams must match at least partly; kick-off time alone is not enough.
  return scored[0] && scored[0].score >= 1.2 ? scored[0].f.id : null;
}

/* ---------- Match details ---------- */

interface RawPlayer {
  id: number | null;
  name: string | null;
}

interface RawEvent {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number };
  player: RawPlayer;
  assist: RawPlayer;
  type: string;
  detail: string;
  comments: string | null;
}

interface RawLineupPlayer {
  player: { id: number | null; name: string; number: number | null; pos: string | null; grid: string | null };
}

interface RawLineup {
  team: { id: number };
  coach: { name: string | null } | null;
  formation: string | null;
  startXI: RawLineupPlayer[];
  substitutes: RawLineupPlayer[];
}

interface RawFixtureDetail {
  fixture: {
    id: number;
    referee: string | null;
    venue: { name: string | null; city: string | null };
    status: { short: string; elapsed: number | null; extra?: number | null };
  };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
  score: { halftime: { home: number | null; away: number | null } };
  events?: RawEvent[];
  lineups?: RawLineup[];
  statistics?: { team: { id: number }; statistics: { type: string; value: number | string | null }[] }[];
}

export type Side = "home" | "away";

export type MatchEventKind = "goal" | "penalty" | "own-goal" | "missed-penalty" | "yellow" | "second-yellow" | "red" | "sub" | "var";

export interface MatchEvent {
  minute: number;
  extra: number | null;
  side: Side;
  kind: MatchEventKind;
  /** Scorer, booked player, or the player coming on. */
  player: string;
  /** Assist provider, or the player going off. */
  secondary?: string;
  /** For substitutions: whether we know which player came on. */
  subKnown?: boolean;
  /** VAR decision or other note from the feed. */
  note?: string;
}

export interface LineupPlayer {
  name: string;
  number: number | null;
  pos: string | null;
  /** "row:col" from the goalkeeper outwards, when the feed has it. */
  grid: string | null;
}

export interface Lineup {
  formation: string | null;
  coach: string | null;
  startXI: LineupPlayer[];
  subs: LineupPlayer[];
}

export interface MatchStat {
  label: string;
  home: number;
  away: number;
  /** Shown as a percentage (possession, pass accuracy). */
  percent?: boolean;
  /** Shown with two decimals (expected goals). */
  decimal?: boolean;
}

export interface MatchDetails {
  status: string;
  elapsed: number | null;
  extra: number | null;
  halftime: { home: number; away: number } | null;
  referee: string | null;
  venue: string | null;
  events: MatchEvent[];
  stats: MatchStat[];
  lineups: { home: Lineup | null; away: Lineup | null };
}

const STAT_ORDER: { type: string; label: string; percent?: boolean; decimal?: boolean }[] = [
  { type: "Ball Possession", label: "Possession", percent: true },
  { type: "expected_goals", label: "Expected goals (xG)", decimal: true },
  { type: "Total Shots", label: "Shots" },
  { type: "Shots on Goal", label: "Shots on target" },
  { type: "Shots off Goal", label: "Shots off target" },
  { type: "Blocked Shots", label: "Blocked shots" },
  { type: "Shots insidebox", label: "Shots inside the box" },
  { type: "Corner Kicks", label: "Corners" },
  { type: "Offsides", label: "Offsides" },
  { type: "Fouls", label: "Fouls" },
  { type: "Yellow Cards", label: "Yellow cards" },
  { type: "Red Cards", label: "Red cards" },
  { type: "Goalkeeper Saves", label: "Saves" },
  { type: "Total passes", label: "Passes" },
  { type: "Passes %", label: "Pass accuracy", percent: true },
];

function statNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function toLineup(raw: RawLineup | undefined): Lineup | null {
  if (!raw || !raw.startXI?.length) return null;
  const player = (p: RawLineupPlayer): LineupPlayer => ({ name: p.player.name, number: p.player.number, pos: p.player.pos, grid: p.player.grid });
  return { formation: raw.formation, coach: raw.coach?.name ?? null, startXI: raw.startXI.map(player), subs: (raw.substitutes ?? []).map(player) };
}

function eventKind(e: RawEvent): MatchEventKind | null {
  const type = e.type.toLowerCase();
  const detail = e.detail.toLowerCase();
  if (type === "goal") {
    if (detail.includes("own")) return "own-goal";
    if (detail.includes("missed")) return "missed-penalty";
    if (detail.includes("penalty")) return "penalty";
    return "goal";
  }
  if (type === "card") {
    if (detail.includes("second")) return "second-yellow";
    if (detail.includes("red")) return "red";
    return "yellow";
  }
  if (type === "subst") return "sub";
  if (type === "var") return "var";
  return null;
}

/** Exported for tests. */
export function toDetails(raw: RawFixtureDetail): MatchDetails {
  const homeId = raw.teams.home.id;
  const sideOf = (teamId: number): Side => (teamId === homeId ? "home" : "away");
  const lineupFor = (side: Side) => raw.lineups?.find((l) => sideOf(l.team.id) === side);
  const lineups = { home: toLineup(lineupFor("home")), away: toLineup(lineupFor("away")) };

  // Players on the pitch, to tell which side of a substitution came on.
  const onPitch: Record<Side, Set<number>> = {
    home: new Set((lineupFor("home")?.startXI ?? []).map((p) => p.player.id ?? -1)),
    away: new Set((lineupFor("away")?.startXI ?? []).map((p) => p.player.id ?? -1)),
  };

  const events: MatchEvent[] = [];
  for (const e of raw.events ?? []) {
    const kind = eventKind(e);
    if (!kind || e.time.elapsed == null) continue;
    const side = sideOf(e.team.id);
    const base = { minute: e.time.elapsed, extra: e.time.extra || null, side, kind };
    if (kind === "sub") {
      const a = e.player;
      const b = e.assist;
      const pitch = onPitch[side];
      let on: RawPlayer = a;
      let off: RawPlayer = b;
      let known = false;
      if (a.id != null && pitch.has(a.id)) {
        on = b;
        off = a;
        known = true;
      } else if (b.id != null && pitch.has(b.id)) {
        known = true;
      }
      if (off.id != null) pitch.delete(off.id);
      if (on.id != null) pitch.add(on.id);
      events.push({ ...base, player: on.name ?? "Unknown", secondary: off.name ?? undefined, subKnown: known });
    } else {
      events.push({
        ...base,
        player: e.player.name ?? "Unknown",
        secondary: kind === "goal" || kind === "penalty" ? (e.assist.name ?? undefined) : undefined,
        note: kind === "var" ? e.detail : undefined,
      });
    }
  }

  // Own goals: the feed may file them under either team. Credit them to the
  // side that benefited, whichever reading makes the goals add up.
  const goals = raw.goals;
  if (goals.home != null && goals.away != null) {
    const count = (flip: boolean) => {
      const total = { home: 0, away: 0 };
      for (const e of events) {
        if (e.kind === "goal" || e.kind === "penalty") total[e.side]++;
        if (e.kind === "own-goal") total[flip ? (e.side === "home" ? "away" : "home") : e.side]++;
      }
      return total;
    };
    const asFiled = count(false);
    if (asFiled.home !== goals.home || asFiled.away !== goals.away) {
      const flipped = count(true);
      if (flipped.home === goals.home && flipped.away === goals.away) {
        for (const e of events) if (e.kind === "own-goal") e.side = e.side === "home" ? "away" : "home";
      }
    }
  }

  events.sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0));

  const statsFor = (side: Side) => raw.statistics?.find((s) => sideOf(s.team.id) === side)?.statistics ?? [];
  const homeStats = statsFor("home");
  const awayStats = statsFor("away");
  const stats: MatchStat[] = [];
  for (const def of STAT_ORDER) {
    const h = statNumber(homeStats.find((s) => s.type === def.type)?.value);
    const a = statNumber(awayStats.find((s) => s.type === def.type)?.value);
    if (h == null && a == null) continue;
    stats.push({ label: def.label, home: h ?? 0, away: a ?? 0, percent: def.percent, decimal: def.decimal });
  }

  const ht = raw.score?.halftime;
  return {
    status: raw.fixture.status.short,
    elapsed: raw.fixture.status.elapsed,
    extra: raw.fixture.status.extra ?? null,
    halftime: ht && ht.home != null && ht.away != null ? { home: ht.home, away: ht.away } : null,
    referee: raw.fixture.referee,
    venue: [raw.fixture.venue?.name, raw.fixture.venue?.city].filter(Boolean).join(", ") || null,
    events,
    stats,
    lineups,
  };
}

async function fetchDetails(fixtureId: number): Promise<MatchDetails | null> {
  const rows = await apiGet<RawFixtureDetail>(`/fixtures?id=${fixtureId}`);
  return rows?.[0] ? toDetails(rows[0]) : null;
}

// One cache per refresh rate; the match's state picks which one is used.
const detailCaches = {
  live: unstable_cache(fetchDetails, ["api-football-fixture", "live"], { revalidate: 15 * 60 }),
  soon: unstable_cache(fetchDetails, ["api-football-fixture", "soon"], { revalidate: 60 * 60 }),
  later: unstable_cache(fetchDetails, ["api-football-fixture", "later"], { revalidate: 12 * 3600 }),
  settled: unstable_cache(fetchDetails, ["api-football-fixture", "settled"], { revalidate: 7 * 24 * 3600 }),
};

/**
 * Details for one match, or null when they are not available (no key, league
 * not covered, plan limit, or the match could not be found). Never throws.
 */
export async function getMatchDetails(ref: MatchRef, state: "live" | "finished" | "upcoming"): Promise<MatchDetails | null> {
  if (!process.env.API_FOOTBALL_KEY || !LEAGUE_IDS[ref.league]) return null;
  try {
    const id = await findFixtureId(ref);
    if (!id) return null;
    const kickoff = new Date(ref.kickoff).getTime();
    const sinceKickoff = Date.now() - kickoff;
    let cache = detailCaches.later;
    if (state === "live") cache = detailCaches.live;
    // Final stats settle within a few hours of the whistle.
    else if (state === "finished") cache = sinceKickoff > 5 * 3600_000 ? detailCaches.settled : detailCaches.live;
    // Line-ups are published about an hour before kick-off.
    else if (-sinceKickoff < 3 * 3600_000) cache = detailCaches.soon;
    return await cache(id);
  } catch (error) {
    console.warn("Match details unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}
