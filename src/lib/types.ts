export type CategorySlug =
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "champions-league"
  | "nigeria-football"
  | "npfl"
  | "transfers"
  | "world-football";

export type Accent = "indigo" | "sky" | "orange" | "gold";

export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  accent: Accent;
}

export type ArticleStatus = "draft" | "pending_review" | "published";

export interface Article {
  slug: string;
  title: string;
  dek: string;
  category: CategorySlug;
  author: string;
  publishedAt: string;
  /** Last edit, for search engines. */
  updatedAt?: string;
  image: string;
  imageAlt: string;
  /** Where the lead photo is anchored when cropped, as "x,y" percentages. */
  imageFocus?: string;
  coverImage: string;
  /** The social headline on the share card. */
  shareText?: string;
  /** The "Key points" box at the top of the story. */
  keyPoints?: string[];
  body: string[];
  tags: string[];
  isBreaking?: boolean;
  featured?: boolean;
  featuredVideoUrl?: string;
  source?: string;
  status: ArticleStatus;
}

export type FixtureStatus = "live" | "finished" | "upcoming";

export interface Fixture {
  id: string;
  league: CategorySlug;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  /** Half-time break in a live match. */
  paused?: boolean;
  /** Kick-off has passed but the scores feed hasn't reported the match as started yet. */
  pending?: boolean;
  status: FixtureStatus;
  kickoff: string;
  homeCrest?: string;
  awayCrest?: string;
  matchday?: number;
}

export interface StandingRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  crest?: string;
  /** Recent results, oldest first, e.g. "W,D,L,W,W". */
  form?: string;
}
