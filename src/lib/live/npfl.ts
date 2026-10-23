import { unstable_cache } from "next/cache";
import type { Fixture, StandingRow } from "@/lib/types";
import { fixtures as mockFixtures } from "@/lib/data/fixtures";
import { standings as mockStandings } from "@/lib/data/standings";
import { hlGet } from "@/lib/live/highlightly";

/**
 * Real NPFL results, fixtures and table from Highlightly (the free scores
 * feed doesn't cover Nigeria). The whole season's fixture list and the table
 * are each fetched every 12 hours, about 10 of the free plan's 100 daily
 * requests (the rest is kept for match pages), so NPFL results can be up to
 * 12 hours behind. After a failure it waits 15 minutes before trying again,
 * so a busy day can't drain the allowance.
 */

const NPFL_LEAGUE_ID = 340333;
const REFRESH_SECONDS = 12 * 3600;
const RETRY_AFTER_MS = 15 * 60_000;
/** When the last attempt failed; until RETRY_AFTER_MS later, NPFL data is skipped instead of retried. */
let failedAt = 0;
const coolingDown = () => Date.now() - failedAt < RETRY_AFTER_MS;

/** Highlightly names a season by the year it ends: 2026/27 is "2027". */
export function currentNpflSeason(now = new Date()) {
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
}

interface RawNpflMatch {
  id: number;
  round?: string | null;
  date: string;
  homeTeam: { name: string; logo?: string | null };
  awayTeam: { name: string; logo?: string | null };
  state?: { clock?: number | null; description?: string | null; score?: { current?: string | null } | null } | null;
}

interface RawStandingRow {
  position: number;
  points: number;
  team: { name: string; logo?: string | null };
  total: { wins: number; draws: number; loses: number; games: number; scoredGoals: number; receivedGoals: number };
}

/** Throws when Highlightly can't be reached, so the cache keeps the last good copy. */
async function required<T>(path: string): Promise<T> {
  const body = await hlGet<T>(path);
  if (body == null) throw new Error(`Highlightly returned nothing for ${path}`);
  return body;
}

const getSeasonMatches = unstable_cache(
  async (season: number): Promise<RawNpflMatch[]> => {
    const first = await required<{ data?: RawNpflMatch[]; pagination?: { totalCount?: number } }>(`/matches?leagueId=${NPFL_LEAGUE_ID}&season=${season}&limit=100&offset=0`);
    const total = Math.min(first.pagination?.totalCount ?? 0, 500);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, Math.ceil(total / 100) - 1) }, (_, i) =>
        required<{ data?: RawNpflMatch[] }>(`/matches?leagueId=${NPFL_LEAGUE_ID}&season=${season}&limit=100&offset=${(i + 1) * 100}`)
      )
    );
    return [first, ...rest].flatMap((page) => page.data ?? []);
  },
  ["npfl-season-matches"],
  { revalidate: REFRESH_SECONDS }
);

const getSeasonTable = unstable_cache(
  async (season: number): Promise<RawStandingRow[]> => {
    const body = await required<{ groups?: { standings?: RawStandingRow[] }[] }>(`/standings?leagueId=${NPFL_LEAGUE_ID}&season=${season}`);
    return body.groups?.[0]?.standings ?? [];
  },
  ["npfl-season-table"],
  { revalidate: REFRESH_SECONDS }
);

function status(description: string | null | undefined): Fixture["status"] {
  const d = (description ?? "").toLowerCase();
  if (d.startsWith("finished") || d.includes("after extra") || d.includes("after penalties")) return "finished";
  if (/half|extra time|penalties|break|in progress|live/.test(d)) return "live";
  return "upcoming";
}

function toFixture(m: RawNpflMatch): Fixture {
  const [home, away] = (m.state?.score?.current ?? "").split("-").map((s) => Number(s.trim()));
  const st = status(m.state?.description);
  const hasScore = st !== "upcoming" && Number.isFinite(home) && Number.isFinite(away);
  return {
    id: `hl-${m.id}`,
    league: "npfl",
    home: m.homeTeam.name,
    away: m.awayTeam.name,
    homeCrest: m.homeTeam.logo ?? undefined,
    awayCrest: m.awayTeam.logo ?? undefined,
    homeScore: hasScore ? home : null,
    awayScore: hasScore ? away : null,
    minute: st === "live" ? (m.state?.clock ?? null) : null,
    paused: /half time|break/i.test(m.state?.description ?? ""),
    matchday: Number(m.round?.match(/(\d+)\s*$/)?.[1]) || undefined,
    status: st,
    kickoff: m.date,
  };
}

const keyMissing = () => !process.env.HIGHLIGHTLY_API_KEY;
/** Sample NPFL data only in local development with no keys at all. */
const devSamples = () => !process.env.HIGHLIGHTLY_API_KEY && !process.env.FOOTBALL_DATA_API_KEY;

/** NPFL results from two weeks back and fixtures three weeks ahead. Empty when unavailable. */
export async function getNpflFixtures(): Promise<Fixture[]> {
  if (keyMissing()) return devSamples() ? mockFixtures.filter((f) => f.league === "npfl") : [];
  if (coolingDown()) return [];
  try {
    const from = Date.now() - 14 * 86_400_000;
    const to = Date.now() + 21 * 86_400_000;
    return (await getSeasonMatches(currentNpflSeason()))
      .filter((m) => {
        const t = Date.parse(m.date);
        return t >= from && t <= to;
      })
      .map(toFixture)
      .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
  } catch (error) {
    failedAt = Date.now();
    console.warn("NPFL fixtures unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}

/** One NPFL match by its "hl-…" id, from the cached season list. */
export async function getNpflMatch(id: string): Promise<Fixture | null> {
  if (keyMissing() || coolingDown()) return null;
  const raw = id.replace(/^hl-/, "");
  try {
    const match = (await getSeasonMatches(currentNpflSeason())).find((m) => String(m.id) === raw);
    return match ? toFixture(match) : null;
  } catch {
    failedAt = Date.now();
    return null;
  }
}

/** The current NPFL table. Undefined when unavailable. */
export async function getNpflStandings(): Promise<StandingRow[] | undefined> {
  if (keyMissing()) return devSamples() ? mockStandings.npfl : undefined;
  if (coolingDown()) return undefined;
  try {
    const rows = await getSeasonTable(currentNpflSeason());
    if (!rows.length) return undefined;
    return rows
      .sort((a, b) => a.position - b.position)
      .map((r) => ({
        team: r.team.name,
        crest: r.team.logo ?? undefined,
        played: r.total.games,
        won: r.total.wins,
        drawn: r.total.draws,
        lost: r.total.loses,
        goalsFor: r.total.scoredGoals,
        goalsAgainst: r.total.receivedGoals,
      }));
  } catch (error) {
    failedAt = Date.now();
    console.warn("NPFL table unavailable:", error instanceof Error ? error.message : error);
    return undefined;
  }
}
