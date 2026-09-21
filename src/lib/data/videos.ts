export interface VideoItem {
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  /** Real YouTube video ID (the part after watch?v=). Leave unset to link straight to the channel until you have one. */
  videoId?: string;
}

// Replace these with real uploads — set `videoId` on each once you have it,
// and the card will link straight to that video on YouTube instead of the channel homepage.
export const videos: VideoItem[] = [
  {
    slug: "weekend-highlights-reel",
    title: "Every goal from a weekend that had everything",
    description: "All the goals, saves and talking points from across the Premier League and beyond.",
    thumbnail: "/covers/video-highlights-cover.jpg",
  },
  {
    slug: "npfl-matchday-highlights",
    title: "NPFL Matchday Highlights",
    description: "The best moments from this week's Nigeria Professional Football League fixtures.",
    thumbnail: "/covers/npfl-matchday-cover.jpg",
  },
  {
    slug: "super-eagles-preview",
    title: "Super Eagles squad preview",
    description: "Breaking down the provisional squad ahead of the upcoming double-header.",
    thumbnail: "/covers/super-eagles-squad-cover.jpg",
  },
];
