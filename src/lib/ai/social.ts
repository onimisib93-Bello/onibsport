/**
 * Social posts for a story: the copywriting brief Claude follows, the reply
 * format the editor reads back, tracked links, and the share links that open
 * each network's composer. Safe to import on the server and in the browser.
 */

export type SocialPlatform = "facebook" | "x" | "instagram" | "tiktok" | "whatsapp" | "threads";
export type SocialKit = Partial<Record<SocialPlatform, string>>;

export interface PlatformInfo {
  id: SocialPlatform;
  name: string;
  /** Label Claude uses for this platform in the reply. */
  label: string;
  /** Soft length limit shown in the editor. X counts every link as 23 characters. */
  limit?: number;
  /** False where captions can't hold a clickable link (the link goes in the bio). */
  linkInPost: boolean;
  /** Opens the network's composer. Facebook only accepts the link, so the text is copied first. */
  shareUrl?: (text: string, link: string) => string;
  shareLabel?: string;
  tip?: string;
}

const enc = encodeURIComponent;

export const SOCIAL_PLATFORMS: PlatformInfo[] = [
  {
    id: "facebook",
    name: "Facebook",
    label: "FACEBOOK",
    linkInPost: true,
    shareUrl: (_text, link) => `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}`,
    shareLabel: "Copy & open Facebook",
    tip: "Facebook doesn't let sites pre-fill your post, so the text is copied for you: paste it into the box that opens.",
  },
  {
    id: "x",
    name: "X",
    label: "X",
    limit: 280,
    linkInPost: true,
    shareUrl: (text) => `https://twitter.com/intent/tweet?text=${enc(text)}`,
    shareLabel: "Post on X",
  },
  {
    id: "instagram",
    name: "Instagram",
    label: "INSTAGRAM",
    limit: 2200,
    linkInPost: false,
    tip: "Instagram captions can't hold a clickable link. Copy the tracked link into your bio (or link-in-bio page), then post the caption with the story photo.",
  },
  {
    id: "tiktok",
    name: "TikTok / Reels",
    label: "TIKTOK",
    linkInPost: false,
    tip: "A short video script that also works for Instagram Reels and YouTube Shorts. Put the tracked link in your bio.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    label: "WHATSAPP",
    linkInPost: true,
    shareUrl: (text) => `https://wa.me/?text=${enc(text)}`,
    shareLabel: "Share on WhatsApp",
  },
  {
    id: "threads",
    name: "Threads",
    label: "THREADS",
    limit: 500,
    linkInPost: true,
    shareUrl: (text) => `https://www.threads.net/intent/post?text=${enc(text)}`,
    shareLabel: "Post on Threads",
  },
];

/** The copywriting brief, shared by the chat prompt and the API. */
export const SOCIAL_RULES = `Social posts
Write as Onibsport's head of social media. The job of every post is the click: tease the story so fans have to open the link to find out what happened. Posts feel native to each network, are never the headline pasted again, and are written for football fans in Nigeria and across Africa first and fans everywhere second. Write {{LINK}} exactly where the article link belongs; it is replaced with the real link, so never write a URL yourself.

The curiosity gap (applies to every post)
- Find the one thing a fan most wants to know (who it is, the score, the fee, the club he's joining, what the manager said, how long he's out) and hold it back. The answer lives in the article, never in the post.
- Give enough to make it impossible to scroll past: the club or the stakes, a striking detail, an emotion, a contrast ("Nobody at Barcelona saw this coming", "One name. One club record. And it isn't the one you think.", "Chelsea have an update on their keeper, and it changes their weekend").
- Name the who but hide the what, or show the what but hide the who. Never both.
- Leave hashtags out if they would give the answer away (no #Raphinha when the mystery is which player).
- Honest teasing only: everything said must be true, and the article must deliver what the post promises. No made-up claims, fake quotes, invented numbers, "SHOCKING", fake urgency, or "you won't believe". No engagement bait such as "comment YES" or "tag a friend": Facebook and Instagram push those posts down.

FACEBOOK: 3-5 short lines. Line 1 is a scroll-stopping hook that opens the gap. Then one or two lines that raise the stakes without answering, then a question fans will want to argue about in the comments. End with "Find out here 👉 {{LINK}}" (or a close variation). At most 2 emojis; 1-3 hashtags on the last line that don't spoil it.
X: one post under 250 characters including {{LINK}} (it counts as 23). A single punchy teaser line or two, {{LINK}} at the end, at most one non-spoiling hashtag. No thread, and no "BREAKING" unless the article is breaking news.
INSTAGRAM: a caption for a photo or carousel post. The first line is the teaser hook, under 125 characters (it's all people see before "more"). Then 2-4 short lines that build the suspense, then "The full story is on onibsport.com, link in bio 🔗". Do not use {{LINK}} (caption links aren't clickable). Finish with 8-12 hashtags, big ones (#football, the league) plus specific ones that don't give the answer away. After the hashtags add a line "IMAGE TEXT: " with a 3-7 word teaser to overlay on the photo (a question or an unfinished thought, not the answer).
TIKTOK: a 20-35 second vertical video that also works for Reels and Shorts, laid out as:
HOOK: the first 2 seconds, a question or a striking claim that stops the scroll
SCRIPT: 3-5 short, conversational voiceover lines that build up to the moment, then cut before the reveal ("...and what happened next is on Onibsport")
ON-SCREEN TEXT: 2-4 short captions that tease, never the answer
CAPTION: under 150 characters, 3-5 non-spoiling hashtags, ending "Full story on onibsport.com (link in bio)"
Do not use {{LINK}}.
WHATSAPP: for the Onibsport WhatsApp channel and status. A *bold teaser line* (single asterisks), 1-2 short plain lines that keep the answer back, then "Find out: {{LINK}}". 1-2 emojis, no hashtags.
THREADS: a conversational teaser in 2-3 sentences, under 450 characters, that sets up the question fans will want answered, then {{LINK}}. 0-2 non-spoiling hashtags.`;

/** How the social section must be laid out in a chat reply. */
export const SOCIAL_REPLY_FORMAT = [
  "=== SOCIAL ===",
  ...SOCIAL_PLATFORMS.flatMap((p) => [`${p.label}:`, `the ${p.name} post`]),
].join("\n");

const LABELS: Record<string, SocialPlatform> = {
  FACEBOOK: "facebook",
  X: "x",
  TWITTER: "x",
  "X/TWITTER": "x",
  INSTAGRAM: "instagram",
  TIKTOK: "tiktok",
  "TIKTOK/REELS": "tiktok",
  REELS: "tiktok",
  WHATSAPP: "whatsapp",
  THREADS: "threads",
};

/** Matches "FACEBOOK:", "**Instagram:**", "X / Twitter -" at the start of a line. */
const LABEL_LINE = /^\s*[*_#]*\s*(FACEBOOK|X\s*\/\s*TWITTER|TWITTER|X|INSTAGRAM|TIKTOK(?:\s*\/\s*REELS)?|REELS|WHATSAPP|THREADS)\s*[*_]*\s*[:\-–]\s*[*_]*\s?(.*)$/i;

/** Splits text at the "=== SOCIAL ===" marker: [before, social section or null]. */
export function splitSocialSection(text: string): [string, string | null] {
  const match = text.match(/^\s*[=#*_-]{2,}\s*SOCIAL(?: POSTS| MEDIA)?\s*[=#*_-]*\s*$/im);
  if (!match || match.index === undefined) return [text, null];
  return [text.slice(0, match.index), text.slice(match.index + match[0].length)];
}

/** Reads FACEBOOK: / X: / INSTAGRAM: ... blocks; each runs until the next platform label. */
export function parseSocialSection(text: string): SocialKit {
  const kit: SocialKit = {};
  let current: SocialPlatform | null = null;
  let lines: string[] = [];
  const flush = () => {
    if (current) {
      const value = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
      if (value) kit[current] = value;
    }
  };
  for (const line of text.replace(/\r\n/g, "\n").replace(/```[a-z]*\n?/gi, "").split("\n")) {
    const m = line.match(LABEL_LINE);
    const platform = m ? LABELS[m[1].toUpperCase().replace(/\s+/g, "")] : undefined;
    if (m && platform) {
      flush();
      current = platform;
      lines = m[2] ? [m[2]] : [];
    } else if (current) {
      lines.push(line);
    }
  }
  flush();
  return kit;
}

/** The article link with tracking tags, so analytics show which network sent each reader. */
export function trackedLink(articleUrl: string, platform: SocialPlatform): string {
  const url = new URL(articleUrl);
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "onibsport_social");
  return url.toString();
}

/** Puts the tracked link wherever the post says {{LINK}}. */
export function fillLink(text: string, link: string): string {
  return text.replace(/\{\{\s*LINK\s*\}\}/gi, link);
}

/** Reverses fillLink so an edited post keeps working if the link changes. */
export function unfillLink(text: string, link: string): string {
  return text.split(link).join("{{LINK}}");
}

/** Length as the network counts it (X counts any link as 23 characters). */
export function postLength(text: string, platform: SocialPlatform): number {
  return platform === "x" ? text.replace(/https?:\/\/\S+/g, "x".repeat(23)).length : [...text].length;
}

/** A prompt for an article that already exists: just the social posts. */
export function buildSocialPrompt(article: { title: string; dek: string; body: string; hub?: string }): string {
  return [
    SOCIAL_RULES,
    "",
    "How to reply",
    "Reply with one plain-text code block (```text ... ```) and nothing outside it, laid out exactly like this:",
    "",
    SOCIAL_REPLY_FORMAT,
    "",
    "Here is the published Onibsport article to promote.",
    "",
    `Headline: ${article.title}`,
    `Standfirst: ${article.dek}`,
    article.hub ? `Hub: ${article.hub}` : "",
    "",
    article.body,
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
}

const KIT_KEY = (slug: string) => `onibsport-social:${slug}`;

/** Social posts are kept in this browser, per story, so they're there when the story is reopened. */
export function saveSocialKit(slug: string, kit: SocialKit) {
  if (!slug) return;
  try {
    localStorage.setItem(KIT_KEY(slug), JSON.stringify(kit));
  } catch {
    // Storage unavailable: the posts still show for this session.
  }
}

export function readSocialKit(slug: string): SocialKit | null {
  if (!slug) return null;
  try {
    const raw = localStorage.getItem(KIT_KEY(slug));
    return raw ? (JSON.parse(raw) as SocialKit) : null;
  } catch {
    return null;
  }
}
