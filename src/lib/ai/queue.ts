export interface SourceItem {
  id: string;
  headline: string;
  sourceName: string;
  sourceUrl?: string;
  rawSummary: string;
  categorySlug: string;
}

/**
 * Placeholder "incoming feed" — stands in for a real news API or RSS
 * ingestion job. Swap this for a live source (licensed news API, NPFL/NFF
 * feeds, etc.) and keep the shape of SourceItem the same.
 */
export const SOURCE_QUEUE: SourceItem[] = [
  {
    id: "src-1",
    headline: "Managers trade barbs ahead of Saturday's top-of-the-table clash",
    sourceName: "Sample Feed (replace with a licensed news API)",
    rawSummary:
      "Ahead of this weekend's fixture between the two clubs level on points at the top of the table, both managers used their pre-match press conferences to needle each other over recent refereeing decisions. Team news suggests both sides will be close to full strength.",
    categorySlug: "premier-league",
  },
  {
    id: "src-2",
    headline: "NPFL club confirms marquee signing ahead of second half of season",
    sourceName: "Sample Feed (replace with a licensed news API)",
    rawSummary:
      "An NPFL club has confirmed the signing of an experienced forward on a two-year deal, a move seen as a statement of intent ahead of the second half of the season. The player has previous top-flight experience and is expected to go straight into the squad.",
    categorySlug: "npfl",
  },
  {
    id: "src-3",
    headline: "Super Eagles technical crew to hold scouting camp in Lagos",
    sourceName: "Sample Feed (replace with a licensed news API)",
    rawSummary:
      "The Nigeria Football Federation's technical committee has announced a scouting camp in Lagos aimed at identifying home-based talent for future Super Eagles call-ups, continuing a push to widen the pool of domestic-league players under consideration.",
    categorySlug: "nigeria-football",
  },
];
