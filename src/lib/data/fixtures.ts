import { Fixture } from "@/lib/types";

/**
 * Placeholder fixtures for leagues with no live data source (NPFL, Nigeria)
 * and for local development without FOOTBALL_DATA_API_KEY. Kick-offs are
 * placed relative to today so the date-search and "today" views always have
 * something to show; replace with a real feed when one is wired in.
 */
function at(daysFromToday: number, hourUtc: number, minute = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  d.setUTCHours(hourUtc, minute, 0, 0);
  return d.toISOString();
}

export const fixtures: Fixture[] = [
  { id: "f1", league: "premier-league", home: "Arsenal", away: "Chelsea", homeScore: 2, awayScore: 2, minute: 90, status: "live", kickoff: at(0, 15) },
  { id: "f2", league: "premier-league", home: "Man City", away: "Liverpool", homeScore: 1, awayScore: 0, minute: 63, status: "live", kickoff: at(0, 15) },
  { id: "f3", league: "premier-league", home: "Aston Villa", away: "Newcastle", homeScore: null, awayScore: null, minute: null, status: "upcoming", kickoff: at(0, 17, 30) },
  { id: "f4", league: "la-liga", home: "Real Madrid", away: "Atletico Madrid", homeScore: 3, awayScore: 1, minute: null, status: "finished", kickoff: at(-1, 20) },
  { id: "f5", league: "la-liga", home: "Barcelona", away: "Sevilla", homeScore: 2, awayScore: 0, minute: 71, status: "live", kickoff: at(0, 14) },
  { id: "f6", league: "serie-a", home: "Juventus", away: "AC Milan", homeScore: 1, awayScore: 1, minute: null, status: "finished", kickoff: at(-1, 18, 45) },
  { id: "f7", league: "bundesliga", home: "Bayern Munich", away: "Dortmund", homeScore: null, awayScore: null, minute: null, status: "upcoming", kickoff: at(0, 18, 30) },
  { id: "f8", league: "champions-league", home: "Inter", away: "PSG", homeScore: 2, awayScore: 2, minute: null, status: "finished", kickoff: at(-4, 19) },
  { id: "f9", league: "npfl", home: "Enyimba", away: "Rivers United", homeScore: 1, awayScore: 1, minute: 55, status: "live", kickoff: at(0, 14) },
  { id: "f10", league: "npfl", home: "Kano Pillars", away: "Remo Stars", homeScore: 0, awayScore: 2, minute: null, status: "finished", kickoff: at(-1, 15) },
  { id: "f11", league: "npfl", home: "Plateau United", away: "Shooting Stars", homeScore: null, awayScore: null, minute: null, status: "upcoming", kickoff: at(1, 15) },
  { id: "f13", league: "npfl", home: "Bendel Insurance", away: "Sunshine Stars", homeScore: 2, awayScore: 1, minute: null, status: "finished", kickoff: at(-3, 16) },
  { id: "f14", league: "npfl", home: "Remo Stars", away: "Enyimba", homeScore: null, awayScore: null, minute: null, status: "upcoming", kickoff: at(4, 16) },
  { id: "f12", league: "nigeria-football", home: "Nigeria", away: "Benin Republic", homeScore: null, awayScore: null, minute: null, status: "upcoming", kickoff: at(4, 18) },
];
