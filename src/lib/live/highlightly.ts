import { unstable_cache } from "next/cache";
import { CategorySlug } from "@/lib/types";

/**
 * Match details (scorers, cards, substitutions, line-ups and team stats) from
 * Highlightly (highlightly.net). Set HIGHLIGHTLY_API_KEY to enable; without
 * it, match pages show the score, venue and referee only.
 *
 * The free plan allows 100 requests a day, so every answer is cached and
 * shared by all visitors: a finished match costs about two requests in total
 * (details with events and stats, then line-ups), a live one at most one
 * request every 15 minutes, and finding a match's Highlightly id costs one
 * request per league per day. Failed requests are never cached; the last good
 * copy keeps showing instead.
 */

const BASE = "https://soccer.highlightly.net";

const LEAGUE_IDS: Partial<Record<CategorySlug, number>> = {
  "premier-league": 33973,
  "la-liga": 119924,
  "serie-a": 115669,
  bundesliga: 67162,
  "champions-league": 2486,
};

/** Requests left today, from the last response this server saw. */
let remainingToday: number | null = null;

class QuotaError extends Error {}

/**
 * One Highlightly GET. Returns null when the request is refused for good
 * (bad key, not found), which is safe to cache. Throws on the daily limit or
 * a server problem, so nothing is cached.
 */
async function hlGet<T>(path: string): Promise<T | null> {
  const key = process.env.HIGHLIGHTLY_API_KEY;
  if (!key) return null;
  if (remainingToday != null && remainingToday <= 3) throw new QuotaError("Highlightly daily limit nearly used");

  const res = await fetch(`${BASE}${path}`, { headers: { "x-rapidapi-key": key }, cache: "no-store" });
  const left = Number(res.headers.get("x-ratelimit-requests-remaining"));
  if (res.headers.has("x-ratelimit-requests-remaining") && Number.isFinite(left)) remainingToday = left;
  if (res.status === 429) throw new QuotaError("Highlightly rate limit");
  if (res.status >= 500) throw new Error(`Highlightly ${res.status}`);
  if (!res.ok) {
    console.warn("Highlightly refused", path, res.status, (await res.text().catch(() => "")).slice(0, 300));
    return null;
  }
  return (await res.json()) as T;
}

/* ---------- Finding the Highlightly match for a scores-feed match ---------- */

interface RawTeam {
  id: number;
  name: string;
}

interface RawMatchSummary {
  id: number;
  date: string;
  homeTeam: RawTeam;
  awayTeam: RawTeam;
}

interface DayMatch {
  id: number;
  ts: number;
  home: string;
  away: string;
}

const getLeagueDay = unstable_cache(
  async (leagueId: number, date: string): Promise<DayMatch[] | null> => {
    const body = await hlGet<{ data?: RawMatchSummary[] }>(`/matches?leagueId=${leagueId}&date=${date}&timezone=UTC&limit=100`);
    return body?.data?.map((m) => ({ id: m.id, ts: Date.parse(m.date), home: m.homeTeam.name, away: m.awayTeam.name })) ?? null;
  },
  ["highlightly-league-day"],
  { revalidate: 12 * 3600 }
);

const STOP_WORDS = new Set(["fc", "cf", "afc", "sc", "ac", "as", "ss", "ssc", "sv", "fk", "kv", "club", "de", "calcio", "1907", "1909", "1899", "cp", "rc", "vfb", "vfl", "tsg"]);

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
  kickoff: string;
  /** Every name the scores feed has for each team. */
  homeNames: string[];
  awayNames: string[];
}

async function findMatchId(ref: MatchRef): Promise<number | null> {
  const leagueId = LEAGUE_IDS[ref.league];
  if (!leagueId) return null;
  const day = await getLeagueDay(leagueId, ref.kickoff.slice(0, 10));
  if (!day?.length) return null;

  const kickoff = Date.parse(ref.kickoff);
  const best = (names: string[], candidate: string) => Math.max(...names.map((n) => nameScore(n, candidate)));
  const scored = day
    .map((m) => ({ m, score: best(ref.homeNames, m.home) + best(ref.awayNames, m.away) + (m.ts === kickoff ? 0.5 : 0) }))
    .sort((a, b) => b.score - a.score);
  // Both teams must match at least partly; kick-off time alone is not enough.
  return scored[0] && scored[0].score >= 1.2 ? scored[0].m.id : null;
}

/* ---------- Match details ---------- */

interface RawEvent {
  team: { id: number };
  time: string | number;
  type: string;
  player: string | null;
  playerId: number | null;
  assist: string | null;
  assistingPlayerId: number | null;
  /** For substitutions: the player coming on (player is the one going off). */
  substituted: string | null;
}

interface RawMatchDetail {
  id: number;
  homeTeam: RawTeam;
  awayTeam: RawTeam;
  venue?: { name?: string | null; city?: string | null } | null;
  referee?: { name?: string | null } | null;
  state?: { clock?: number | null; description?: string | null; score?: { current?: string | null } | null } | null;
  events?: RawEvent[];
  statistics?: { team: { id: number }; statistics: { displayName: string; value: number | null }[] }[];
}

interface RawLineupPlayer {
  id?: number | null;
  name: string;
  number?: number | null;
  position?: string | null;
}

interface RawLineupTeam {
  id: number;
  formation?: string | null;
  initialLineup?: RawLineupPlayer[][];
  substitutes?: RawLineupPlayer[];
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
  playerId?: number | null;
  /** Assist provider, or the player going off. */
  secondary?: string;
  secondaryId?: number | null;
  /** For substitutions: whether we know which player came on. */
  subKnown?: boolean;
  /** VAR decision or other note from the feed. */
  note?: string;
}

export interface LineupPlayer {
  id?: number | null;
  name: string;
  number: number | null;
  pos: string | null;
  /** "row:col" from the goalkeeper outwards, column 1 on the team's left. */
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
  /** Real match clock when the details were fetched, for live games. */
  elapsed: number | null;
  extra: number | null;
  /** When `elapsed` was read, so the clock can keep running from it. */
  fetchedAt: string;
  halftime: { home: number; away: number } | null;
  referee: string | null;
  venue: string | null;
  events: MatchEvent[];
  stats: MatchStat[];
  lineups: { home: Lineup | null; away: Lineup | null };
}

type StatSource = (get: (name: string) => number | null) => number | null;

const STAT_ORDER: { label: string; value: StatSource; percent?: boolean; decimal?: boolean }[] = [
  { label: "Possession", value: (g) => (g("Possession") == null ? null : g("Possession")! * 100), percent: true },
  { label: "Expected goals (xG)", value: (g) => g("Expected Goals"), decimal: true },
  {
    label: "Shots",
    value: (g) => {
      const parts = [g("Shots on target"), g("Shots off target"), g("Blocked shots")];
      return parts.every((p) => p == null) ? null : parts.reduce<number>((sum, p) => sum + (p ?? 0), 0);
    },
  },
  { label: "Shots on target", value: (g) => g("Shots on target") },
  { label: "Shots off target", value: (g) => g("Shots off target") },
  { label: "Blocked shots", value: (g) => g("Blocked shots") },
  { label: "Shots inside the box", value: (g) => g("Shots within penalty area") },
  { label: "Big chances", value: (g) => g("Big Chances Created") },
  { label: "Corners", value: (g) => g("Corners") },
  { label: "Offsides", value: (g) => g("Offsides") },
  { label: "Fouls", value: (g) => g("Fouls") },
  { label: "Yellow cards", value: (g) => g("Yellow cards") },
  { label: "Red cards", value: (g) => g("Red cards") },
  { label: "Saves", value: (g) => g("Goalkeeper saves") },
  { label: "Passes", value: (g) => g("Total passes") },
  {
    label: "Pass accuracy",
    value: (g) => {
      const ok = g("Successful passes");
      const total = g("Total passes");
      return ok != null && total ? (ok / total) * 100 : null;
    },
    percent: true,
  },
  { label: "Tackles", value: (g) => g("Tackles") },
  { label: "Interceptions", value: (g) => g("Interceptions") },
];

const POSITION_CODES: Record<string, string> = { goalkeeper: "G", defender: "D", midfielder: "M", forward: "F", attacker: "F" };

function positionCode(position: string | null | undefined): string | null {
  if (!position) return null;
  return POSITION_CODES[position.toLowerCase()] ?? position.slice(0, 1).toUpperCase();
}

function toLineup(raw: RawLineupTeam | undefined): Lineup | null {
  const rows = raw?.initialLineup?.filter((r) => r.length) ?? [];
  if (!raw || !rows.length) return null;
  const player = (p: RawLineupPlayer, grid: string | null): LineupPlayer => ({ id: p.id ?? null, name: p.name, number: p.number ?? null, pos: positionCode(p.position), grid });
  return {
    formation: raw.formation ?? null,
    coach: null,
    startXI: rows.flatMap((row, r) => row.map((p, c) => player(p, `${r + 1}:${c + 1}`))),
    subs: (raw.substitutes ?? []).map((p) => player(p, null)),
  };
}

function eventKind(type: string): MatchEventKind | null {
  const t = type.toLowerCase();
  if (t.includes("substitution")) return "sub";
  if (t.includes("var")) return "var";
  if (t.includes("own goal")) return "own-goal";
  if (t.includes("missed penalty") || t.includes("penalty missed")) return "missed-penalty";
  if (t.includes("penalty")) return "penalty";
  if (t.includes("goal")) return "goal";
  if (t.includes("second yellow") || t.includes("yellow red") || t.includes("yellow-red")) return "second-yellow";
  if (t.includes("red")) return "red";
  if (t.includes("yellow")) return "yellow";
  return null;
}

function parseMinute(time: string | number): { minute: number; extra: number | null } | null {
  const match = String(time).match(/(\d+)(?:\s*\+\s*(\d+))?/);
  if (!match) return null;
  return { minute: Number(match[1]), extra: match[2] ? Number(match[2]) : null };
}

/** "Kovacs, Istvan" → "Istvan Kovacs". */
function personName(name: string | null | undefined): string | null {
  if (!name) return null;
  const [last, first] = name.split(",").map((s) => s.trim());
  return first ? `${first} ${last}` : name;
}

/** Exported for tests. */
export function toDetails(raw: RawMatchDetail, rawLineups: { homeTeam?: RawLineupTeam; awayTeam?: RawLineupTeam } | null): MatchDetails {
  const homeId = raw.homeTeam.id;
  const sideOf = (teamId: number): Side => (teamId === homeId ? "home" : "away");
  const lineups = { home: toLineup(rawLineups?.homeTeam), away: toLineup(rawLineups?.awayTeam) };

  // Players on the pitch, to check which side of a substitution came on.
  const onPitch: Record<Side, Set<number>> = {
    home: new Set((lineups.home?.startXI ?? []).map((p) => p.id ?? -1)),
    away: new Set((lineups.away?.startXI ?? []).map((p) => p.id ?? -1)),
  };

  const events: MatchEvent[] = [];
  for (const e of raw.events ?? []) {
    const kind = eventKind(e.type);
    const time = parseMinute(e.time);
    if (!kind || !time) continue;
    const side = sideOf(e.team.id);
    const base = { ...time, side, kind };
    if (kind === "sub") {
      // The feed lists the player going off first and the one coming on as `substituted`.
      let on = { name: e.substituted, id: e.assistingPlayerId };
      let off = { name: e.player, id: e.playerId };
      const pitch = onPitch[side];
      if (pitch.size && on.id != null && pitch.has(on.id) && !(off.id != null && pitch.has(off.id))) [on, off] = [off, on];
      if (off.id != null) pitch.delete(off.id);
      if (on.id != null) pitch.add(on.id);
      events.push({ ...base, player: on.name ?? "Unknown", playerId: on.id, secondary: off.name ?? undefined, secondaryId: off.id, subKnown: true });
    } else {
      events.push({
        ...base,
        player: e.player ?? "Unknown",
        playerId: e.playerId,
        secondary: kind === "goal" || kind === "penalty" ? (e.assist ?? undefined) : undefined,
        secondaryId: kind === "goal" || kind === "penalty" ? e.assistingPlayerId : null,
        note: kind === "var" ? e.type : undefined,
      });
    }
  }

  // Own goals: the feed may file them under either team. Credit them to the
  // side that benefited, whichever reading makes the goals add up.
  const [homeGoals, awayGoals] = (raw.state?.score?.current ?? "").split("-").map((s) => Number(s.trim()));
  if (Number.isFinite(homeGoals) && Number.isFinite(awayGoals)) {
    const count = (flip: boolean) => {
      const total = { home: 0, away: 0 };
      for (const e of events) {
        if (e.kind === "goal" || e.kind === "penalty") total[e.side]++;
        if (e.kind === "own-goal") total[flip ? (e.side === "home" ? "away" : "home") : e.side]++;
      }
      return total;
    };
    const asFiled = count(false);
    if (asFiled.home !== homeGoals || asFiled.away !== awayGoals) {
      const flipped = count(true);
      if (flipped.home === homeGoals && flipped.away === awayGoals) {
        for (const e of events) if (e.kind === "own-goal") e.side = e.side === "home" ? "away" : "home";
      }
    }
  }

  events.sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0));

  const statGetter = (side: Side) => {
    const list = raw.statistics?.find((s) => sideOf(s.team.id) === side)?.statistics ?? [];
    return (name: string) => {
      const v = list.find((s) => s.displayName.toLowerCase() === name.toLowerCase())?.value;
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    };
  };
  const homeStat = statGetter("home");
  const awayStat = statGetter("away");
  const stats: MatchStat[] = [];
  for (const def of STAT_ORDER) {
    const h = def.value(homeStat);
    const a = def.value(awayStat);
    if (h == null && a == null) continue;
    stats.push({ label: def.label, home: h ?? 0, away: a ?? 0, percent: def.percent, decimal: def.decimal });
  }

  const description = raw.state?.description ?? "";
  const isBreak = /half.?time|break/i.test(description);
  return {
    status: isBreak ? "HT" : description,
    elapsed: raw.state?.clock ?? null,
    extra: null,
    fetchedAt: new Date().toISOString(),
    halftime: null,
    referee: personName(raw.referee?.name),
    venue: [raw.venue?.name, raw.venue?.city].filter(Boolean).join(", ") || null,
    events,
    stats,
    lineups,
  };
}

async function fetchMatch(id: number): Promise<RawMatchDetail | null> {
  const body = await hlGet<RawMatchDetail[] | RawMatchDetail>(`/matches/${id}`);
  return Array.isArray(body) ? (body[0] ?? null) : body;
}

async function fetchLineups(id: number) {
  return hlGet<{ homeTeam?: RawLineupTeam; awayTeam?: RawLineupTeam }>(`/lineups/${id}`);
}

// One cache per refresh rate; the match's state picks which one is used.
const HOUR = 3600;
const matchCaches = {
  live: unstable_cache(fetchMatch, ["highlightly-match", "live"], { revalidate: 15 * 60 }),
  soon: unstable_cache(fetchMatch, ["highlightly-match", "soon"], { revalidate: HOUR }),
  later: unstable_cache(fetchMatch, ["highlightly-match", "later"], { revalidate: 12 * HOUR }),
  settled: unstable_cache(fetchMatch, ["highlightly-match", "settled"], { revalidate: 7 * 24 * HOUR }),
};
// Line-ups don't change during a match, so they refresh far less often.
const lineupCaches = {
  soon: unstable_cache(fetchLineups, ["highlightly-lineups", "soon"], { revalidate: HOUR }),
  later: unstable_cache(fetchLineups, ["highlightly-lineups", "later"], { revalidate: 12 * HOUR }),
  settled: unstable_cache(fetchLineups, ["highlightly-lineups", "settled"], { revalidate: 7 * 24 * HOUR }),
};

/**
 * Details for one match, or null when they are not available (no key, league
 * not covered, daily limit, or the match could not be found). Never throws.
 */
export async function getMatchDetails(ref: MatchRef, state: "live" | "finished" | "upcoming"): Promise<MatchDetails | null> {
  if (!process.env.HIGHLIGHTLY_API_KEY || !LEAGUE_IDS[ref.league]) return null;
  try {
    const id = await findMatchId(ref);
    if (!id) return null;
    const sinceKickoff = Date.now() - Date.parse(ref.kickoff);
    const settled = state === "finished" && sinceKickoff > 5 * HOUR * 1000;

    let matchCache = matchCaches.later;
    if (state === "live" || (state === "finished" && !settled)) matchCache = matchCaches.live;
    else if (settled) matchCache = matchCaches.settled;
    // Line-ups are published about an hour before kick-off.
    else if (-sinceKickoff < 3 * HOUR * 1000) matchCache = matchCaches.soon;

    const lineupCache = settled ? lineupCaches.settled : state === "upcoming" && -sinceKickoff >= 3 * HOUR * 1000 ? lineupCaches.later : lineupCaches.soon;

    const [match, lineups] = await Promise.all([matchCache(id), lineupCache(id).catch(() => null)]);
    return match ? toDetails(match, lineups) : null;
  } catch (error) {
    console.warn("Match details unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}
