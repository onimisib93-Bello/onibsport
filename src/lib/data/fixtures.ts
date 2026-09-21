import { Fixture } from "@/lib/types";

export const fixtures: Fixture[] = [
  { id: "f1", league: "premier-league", home: "Arsenal", away: "Chelsea", homeScore: 2, awayScore: 2, minute: 90, status: "live", kickoff: "2026-09-21T15:00:00Z" },
  { id: "f2", league: "premier-league", home: "Man City", away: "Liverpool", homeScore: 1, awayScore: 0, minute: 63, status: "live", kickoff: "2026-09-21T15:00:00Z" },
  { id: "f3", league: "premier-league", home: "Aston Villa", away: "Newcastle", homeScore: null, awayScore: null, minute: null, status: "upcoming", kickoff: "2026-09-21T17:30:00Z" },
  { id: "f4", league: "la-liga", home: "Real Madrid", away: "Atletico Madrid", homeScore: 3, awayScore: 1, minute: null, status: "finished", kickoff: "2026-09-20T20:00:00Z" },
  { id: "f5", league: "la-liga", home: "Barcelona", away: "Sevilla", homeScore: 2, awayScore: 0, minute: 71, status: "live", kickoff: "2026-09-21T14:00:00Z" },
  { id: "f6", league: "serie-a", home: "Juventus", away: "AC Milan", homeScore: 1, awayScore: 1, minute: null, status: "finished", kickoff: "2026-09-20T18:45:00Z" },
  { id: "f7", league: "bundesliga", home: "Bayern Munich", away: "Dortmund", homeScore: null, awayScore: null, minute: null, status: "upcoming", kickoff: "2026-09-21T18:30:00Z" },
  { id: "f8", league: "champions-league", home: "Inter", away: "PSG", homeScore: 2, awayScore: 2, minute: null, status: "finished", kickoff: "2026-09-17T19:00:00Z" },
  { id: "f9", league: "npfl", home: "Enyimba", away: "Rivers United", homeScore: 1, awayScore: 1, minute: 55, status: "live", kickoff: "2026-09-21T14:00:00Z" },
  { id: "f10", league: "npfl", home: "Kano Pillars", away: "Remo Stars", homeScore: 0, awayScore: 2, minute: null, status: "finished", kickoff: "2026-09-20T15:00:00Z" },
  { id: "f11", league: "npfl", home: "Plateau United", away: "Shooting Stars", homeScore: null, awayScore: null, minute: null, status: "upcoming", kickoff: "2026-09-22T15:00:00Z" },
  { id: "f12", league: "nigeria-football", home: "Nigeria", away: "Benin Republic", homeScore: null, awayScore: null, minute: null, status: "upcoming", kickoff: "2026-09-25T18:00:00Z" },
];
