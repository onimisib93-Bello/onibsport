import { Article } from "@/lib/types";

function img(seed: string) {
  return `/placeholders/${seed}.jpg`;
}

export const articles: Article[] = [
  {
    slug: "late-drama-title-race-blown-open",
    title: "Title race blown wide open after stoppage-time twist",
    dek: "A 94th-minute equalizer at the top of the table means the destiny of the Premier League trophy is no longer in one club's hands.",
    category: "premier-league",
    author: "Tunde Bakare",
    publishedAt: "2026-09-20T19:45:00Z",
    image: img("pl-title-race"),
    imageAlt: "Players celebrating a last-minute goal under floodlights",
    tags: ["Premier League", "Title Race"],
    isBreaking: true,
    status: "published",
    body: [
      "Three points looked certain until a corner in the fifth minute of stoppage time swung the destiny of this season's title race back into the balance.",
      "The leaders had controlled long stretches of the match without finding a second goal to settle the contest, and were made to pay when a header from close range squeezed past the goalkeeper.",
      "With six games left to play, the gap at the top is now level on points, separated only by goal difference — setting up a run-in that could go to the final weekend.",
      "Managers on both sides played down the significance in post-match remarks, but neither could hide how much the result had shifted the mood in their respective camps.",
    ],
  },
  {
    slug: "la-liga-derby-tactical-masterclass",
    title: "A derby won in midfield before it was won on the scoreboard",
    dek: "Tactical tweaks at the break turned a stalemate into a statement victory in Sunday's capital derby.",
    category: "la-liga",
    author: "Marta Delgado",
    publishedAt: "2026-09-20T21:10:00Z",
    image: img("laliga-derby"),
    imageAlt: "Two La Liga players challenging for the ball at midfield",
    tags: ["La Liga", "Derby"],
    status: "published",
    body: [
      "For 45 minutes, the derby was a stalemate decided by fine margins and nervous energy rather than quality.",
      "A change in midfield shape after the interval gave the eventual winners control of the ball in areas they had barely touched in the first half.",
      "Two goals in a seven-minute spell after the hour mark turned a cagey afternoon into a result that will sting for weeks.",
    ],
  },
  {
    slug: "serie-a-veteran-keeper-record-clean-sheet",
    title: "Veteran keeper breaks decade-old clean sheet record",
    dek: "A commanding display between the posts wrote his name into the Serie A history books.",
    category: "serie-a",
    author: "Luca Moretti",
    publishedAt: "2026-09-19T18:30:00Z",
    image: img("seriea-keeper"),
    imageAlt: "A goalkeeper making a diving save",
    tags: ["Serie A", "Records"],
    status: "published",
    body: [
      "It took a fingertip save in the final minute to confirm what statisticians had been tracking for weeks: a new record for consecutive clean sheets in a single Serie A campaign.",
      "The 36-year-old has been the platform for his side's surprise push toward European qualification, conceding just four goals all season.",
      "Teammates lifted him onto their shoulders at full time in a rare scene of celebration reserved usually for goalscorers.",
    ],
  },
  {
    slug: "bundesliga-wonderkid-hat-trick",
    title: "18-year-old's hat-trick announces a new Bundesliga star",
    dek: "Three goals in twenty second-half minutes turned a routine fixture into a coronation.",
    category: "bundesliga",
    author: "Hans Weber",
    publishedAt: "2026-09-18T17:00:00Z",
    image: img("bundesliga-wonderkid"),
    imageAlt: "A young footballer celebrating a goal with arms outstretched",
    tags: ["Bundesliga", "Rising Star"],
    status: "published",
    body: [
      "Scouts already knew the name. After Saturday, so does everyone else.",
      "An 18-year-old forward scored three times in the space of twenty second-half minutes, turning a tight game into a rout and setting off transfer speculation that his club will now have to manage carefully.",
      "The teenager has featured in the senior side for barely two months, but is already being talked about as a candidate for the next international squad.",
    ],
  },
  {
    slug: "ucl-group-stage-comeback",
    title: "Down by two at the break, the comeback nobody saw coming",
    dek: "A Champions League group-stage tie swung from procession to classic in the space of a second half.",
    category: "champions-league",
    author: "Ines Moreau",
    publishedAt: "2026-09-17T20:00:00Z",
    image: img("ucl-comeback"),
    imageAlt: "Fans celebrating in a packed stadium under the Champions League lights",
    tags: ["Champions League", "Comeback"],
    status: "published",
    body: [
      "At half-time, the away end had gone quiet and the home fans were already planning their celebrations. Nobody told the visitors.",
      "Three second-half substitutions changed the tempo of the game entirely, and three goals in eighteen minutes completed one of the more improbable comebacks the competition has seen this season.",
      "It leaves the group standings wide open heading into the final matchday.",
    ],
  },
  {
    slug: "super-eagles-squad-announcement",
    title: "Super Eagles name provisional squad ahead of double-header",
    dek: "Two uncapped players earn first call-ups as the head coach reshapes his options ahead of a crucial pair of fixtures.",
    category: "nigeria-football",
    author: "Chiamaka Nwosu",
    publishedAt: "2026-09-20T12:00:00Z",
    image: img("super-eagles-squad"),
    imageAlt: "Nigeria national football team players training together",
    tags: ["Super Eagles", "Nigeria"],
    isBreaking: true,
    status: "published",
    body: [
      "The Super Eagles technical crew has named a 27-man provisional squad for the upcoming double-header, with two uncapped domestic-league players included for the first time.",
      "The call-ups reward strong starts to the NPFL season and continue the federation's stated push to scout more heavily from the local league.",
      "The squad will be trimmed further before camp opens next week, with the head coach expected to explain his selection at a press conference on Monday.",
    ],
  },
  {
    slug: "nigeria-womens-team-qualifier-win",
    title: "Nigeria's women close in on qualification with commanding win",
    dek: "A dominant second-half display puts the team firmly in control of their qualifying group.",
    category: "nigeria-football",
    author: "Chiamaka Nwosu",
    publishedAt: "2026-09-16T19:00:00Z",
    image: img("nigeria-women-team"),
    imageAlt: "Nigerian women's national football team celebrating",
    tags: ["Nigeria", "Women's Football"],
    status: "published",
    body: [
      "A goal in each half was enough to secure a result that leaves Nigeria needing just a point from their final group game to confirm qualification.",
      "The head coach praised her side's control of midfield as the difference-maker, having identified it as an area for improvement after a narrow win in the previous round.",
    ],
  },
  {
    slug: "npfl-matchday-review",
    title: "NPFL matchday review: title chasers held, relegation fight tightens",
    dek: "A weekend of surprises across the league table, from the top four to the bottom three.",
    category: "npfl",
    author: "Emeka Obi",
    publishedAt: "2026-09-21T08:00:00Z",
    image: img("npfl-matchday"),
    imageAlt: "NPFL match action on a Nigerian football pitch",
    tags: ["NPFL", "Matchday Review"],
    status: "published",
    body: [
      "The two clubs level on points at the top of the NPFL table both dropped points this weekend, keeping the title race congested with two-thirds of the season gone.",
      "At the other end of the table, a crucial win pulled one side out of the relegation zone for the first time since matchday three, while a last-minute penalty miss will sting for the side who stay bottom.",
      "Attendances continue to climb across the division, with several clubs reporting their highest gates in three seasons.",
    ],
  },
  {
    slug: "npfl-rivers-united-continental-run",
    title: "Rivers United's continental run has NPFL clubs believing again",
    dek: "A run to the quarter-finals of the CAF Confederation Cup is reviving hopes that Nigerian clubs can compete continentally.",
    category: "npfl",
    author: "Emeka Obi",
    publishedAt: "2026-09-14T15:30:00Z",
    image: img("rivers-united-caf"),
    imageAlt: "Rivers United players in continental competition action",
    tags: ["NPFL", "CAF Confederation Cup"],
    status: "published",
    body: [
      "It has been a decade since an NPFL side went this far in continental competition, and the club's run has reignited a debate about investment in the domestic league.",
      "Squad depth and a settled coaching staff have been cited as the biggest factors behind the turnaround, after a difficult start to the campaign domestically.",
    ],
  },
  {
    slug: "transfer-window-striker-domino-effect",
    title: "One striker signing could set off a domino effect across Europe",
    dek: "Sources close to the negotiations say a deal is closer than either club has publicly admitted.",
    category: "transfers",
    author: "Onibsport Transfers Desk",
    publishedAt: "2026-09-20T10:15:00Z",
    image: img("transfer-domino"),
    imageAlt: "A footballer holding a new club's shirt at a press unveiling",
    tags: ["Transfers", "Rumour Mill"],
    status: "published",
    body: [
      "Talks over a marquee striker move have advanced further than either club has let on publicly, according to sources close to the negotiations.",
      "Should the deal go through, it is expected to trigger at least two further moves as the selling club looks to reinvest immediately in the winter window.",
      "Nothing is signed yet, and both parties have downplayed the story when approached — but the shape of a deal is reportedly already on the table.",
    ],
  },
  {
    slug: "transfer-nigerian-teenager-europe-move",
    title: "NPFL breakout star attracting scouts from three European leagues",
    dek: "A teenage midfielder's rapid rise through the Nigerian league has scouts from England, Portugal and Belgium taking notice.",
    category: "transfers",
    author: "Onibsport Transfers Desk",
    publishedAt: "2026-09-19T09:00:00Z",
    image: img("npfl-teen-scout"),
    imageAlt: "A young NPFL midfielder controlling the ball during a match",
    tags: ["Transfers", "NPFL", "Nigeria"],
    status: "published",
    body: [
      "Scouts from at least three European leagues have watched the 19-year-old midfielder in person over the past month, according to people familiar with the visits.",
      "His club has publicly stated it will not sell below a set valuation, a sign of how highly the player's development is now regarded domestically.",
    ],
  },
  {
    slug: "video-matchday-highlights-roundup",
    title: "Every goal from a weekend that had everything",
    dek: "Watch the goals, the saves, and the moment that will be replayed all week.",
    category: "premier-league",
    author: "Onibsport Video Desk",
    publishedAt: "2026-09-20T22:00:00Z",
    image: img("video-highlights"),
    imageAlt: "Stadium floodlights over a packed football ground at night",
    tags: ["Highlights", "Video"],
    featuredVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    status: "published",
    body: [
      "From a stoppage-time title-race twist to a teenager's hat-trick in Germany, this was a weekend that delivered from the first whistle to the last.",
      "Watch the full round-up above, and catch up on the written match reports below.",
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(slug: string): Article[] {
  return articles
    .filter((a) => a.category === slug && a.status === "published")
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export function getLatestArticles(limit = 8): Article[] {
  return [...articles]
    .filter((a) => a.status === "published")
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
}

export function getBreakingArticles(): Article[] {
  return articles.filter((a) => a.isBreaking && a.status === "published");
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return articles
    .filter((a) => a.slug !== article.slug && a.category === article.category && a.status === "published")
    .slice(0, limit);
}
