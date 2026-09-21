export type CategorySlug =
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "champions-league"
  | "nigeria-football"
  | "npfl"
  | "transfers";

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
  image: string;
  imageAlt: string;
  coverImage: string;
  body: string[];
  tags: string[];
  isBreaking?: boolean;
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
  status: FixtureStatus;
  kickoff: string;
}
