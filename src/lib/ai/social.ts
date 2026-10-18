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
Write as Onibsport's head of social media: posts that feel native to each network, never the headline pasted again, written for football fans in Nigeria and across Africa first and fans everywhere second. Every post must stay true to the article (no claims it doesn't support, no fake quotes, no invented numbers) and give people a reason to read the full story on onibsport.com. Write {{LINK}} exactly where the article link belongs; it is replaced with the real link, so never write a URL yourself.

FACEBOOK: 3-5 short lines. Line 1 is a scroll-stopping hook, not the headline. Then the key detail and why it matters, then a question that invites comments. End with "Full story 👉 {{LINK}}". At most 2 emojis; 2-3 hashtags on the last line.
X: one post under 250 characters including {{LINK}} (it counts as 23). Lead with the news in plain, punchy words; one hashtag for the club or competition; {{LINK}} at the end. No thread, no "BREAKING" unless the article is breaking news.
INSTAGRAM: a caption for a photo or carousel post. The first line is a hook under 125 characters (it's all people see before "more"). Then 3-6 short lines with line breaks and a few emojis, then "Full story: link in bio 🔗 onibsport.com". Do not use {{LINK}} (caption links aren't clickable). Finish with 8-12 hashtags mixing big ones (#football, the league) and specific ones (club, player). After the hashtags add a line "IMAGE TEXT: " with a 3-7 word headline to overlay on the photo.
TIKTOK: a 20-35 second vertical video that also works for Reels and Shorts, laid out as:
HOOK: what to say and show in the first 2 seconds
SCRIPT: 3-5 short, conversational voiceover lines
ON-SCREEN TEXT: 2-4 short captions
CAPTION: under 150 characters, 3-5 hashtags, ending "Full story on onibsport.com (link in bio)"
Do not use {{LINK}}.
WHATSAPP: for the Onibsport WhatsApp channel and status. A *bold headline* (single asterisks), 2-3 short plain lines, then "Read more: {{LINK}}". 1-2 emojis, no hashtags.
THREADS: a conversational take in 2-4 sentences, under 450 characters, ending with an opinion or a question, then {{LINK}}. 0-2 hashtags.`;

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
