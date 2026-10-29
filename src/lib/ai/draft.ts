import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { SourceItem } from "@/lib/ai/queue";
import { fetchSourceArticle } from "@/lib/ai/sourceText";
import { CategorySlug } from "@/lib/types";
import { SOCIAL_REPLY_FORMAT, SOCIAL_RULES, type SocialKit } from "@/lib/ai/social";

/** Model the AI Desk writes with. */
const MODEL = "claude-sonnet-5";

const CATEGORY_SLUGS = [
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "champions-league",
  "nigeria-football",
  "npfl",
  "transfers",
  "world-football",
] as const satisfies readonly CategorySlug[];

/** What the model must return — validated by the API against this schema. */
const DraftSchema = z.object({
  title: z.string().describe("Headline, ideally 50-70 characters, main keyword near the start."),
  dek: z.string().describe("One-sentence standfirst that doubles as the meta description, under 160 characters."),
  body: z.string().describe("The full article in the Onibsport markdown subset, blocks separated by a blank line."),
  tags: z.array(z.string()).describe("4-6 specific tags: clubs, players, competition, topic."),
  category: z.enum(CATEGORY_SLUGS).describe("The Onibsport hub this story belongs in."),
  imageAlt: z.string().describe("Alt text for the lead photo: who/what is shown and where, under 125 characters."),
  social: SocialSchema(),
});

/** One field per network, written to the social rules (see social.ts). */
export function SocialSchema() {
  return z.object({
    facebook: z
      .string()
      .describe("One Facebook + Instagram teaser post (cross-posted): hook under 125 characters, {{LINK}}, the Instagram link-in-bio line, 5-8 non-spoiling hashtags, then an IMAGE TEXT line."),
    x: z.string().describe("X teaser under 250 characters including {{LINK}}; does not give the answer away."),
    tiktok: z.string().describe("TikTok photo post: a TITLE line under 90 characters, a short teaser description ending with the link-in-bio line, then 3-5 non-spoiling hashtags; no {{LINK}}."),
    whatsapp: z.string().describe("WhatsApp channel teaser ending with Find out: {{LINK}}."),
    threads: z.string().describe("Threads teaser under 450 characters ending with {{LINK}}."),
  });
}

export interface GeneratedDraft {
  title: string;
  dek: string;
  body: string;
  tags: string;
  category: CategorySlug;
  imageAlt: string;
  /** Share image found on the source page, if any. Needs rights clearance before publishing. */
  sourceImage?: string;
  /** Publisher of the source story, e.g. "BBC Sport". */
  sourceOutlet: string;
  sourceUrl?: string;
  /** Ready-to-post copy per network ({{LINK}} marks the article link). */
  social?: SocialKit;
  isStub: boolean;
}

export interface InternalLink {
  title: string;
  url: string;
}

const SYSTEM_PROMPT = `You are the Onibsport AI Desk — a veteran football chief editor with 15+ years running desks at major sports outlets, and an expert SEO writer. You are given source material about a football story (usually the full text of another outlet's article, sometimes only an alert snippet) and you produce a complete, original, publication-ready Onibsport article. Read the source for facts, then write it fresh in your own words. Never copy the source's sentences.

Headline
- Punchy and high click-through, but it must accurately reflect the article. No false or overpromising claims.
- Put the main keyword (club, player or competition) near the start. Aim for 50-70 characters.

Article body
- A full article, not a summary: roughly 700-1,100 words when the source is substantial; shorter only when the source is thin.
- Open with the most compelling angle in the first paragraph, then build context, stakes and consequences, and close with what happens next or why it matters.
- Break it up with 2-4 subheadings that a reader scanning the page (and a search engine) would find useful.
- Stay strictly factual to the source. Never invent quotes, statistics, fees, dates, injuries or any other specifics. If the source quotes someone, you may quote those exact words with attribution; otherwise paraphrase.
- If the source is thin, still write an honest, complete piece: lean on context you can reasonably state (competition, rivalry, the stakes of the fixture) without presenting guesses as facts.
- Use the key entities (club names, player names, competition) naturally several times, the way a well-optimised sports article does, without keyword stuffing.

Links
- Credit the source once, early in the body, as an inline link to the source URL you are given, e.g. "as [BBC Sport reported](https://...)". Do not link to the source if no URL is given.
- Add 2-3 internal links, only to URLs from the Onibsport link list you are given, where they genuinely help the reader (the relevant league hub, a related story). Never make up an Onibsport URL.

Formatting — use only this markdown subset, with a blank line between blocks:
- "## Subheading" for subheadings (no H1; the headline is separate)
- "> quote" for a pull quote, only for a real quote from the source
- "- item" lines for a short list, when a list genuinely reads better
- inline [link text](url) and **bold** for emphasis, sparingly
Do not use tables, images, HTML, or code blocks.

Also return
- dek: one sentence under 160 characters that works as the meta description.
- tags: 4-6 specific tags (club names, players, competition, and a topic such as "Transfers").
- category: the single best Onibsport hub for the story. Use a league hub when the story is mainly about that competition or one of its clubs, transfers for transfer news (signings, bids, contracts, exits), nigeria-football for the Super Eagles, Super Falcons and Nigerian players, and world-football for everything else: general football news, other leagues, global stars and stories that fit no other hub.
- imageAlt: alt text describing a likely lead photo for this story, under 125 characters, without "image of".`;

function buildStubDraft(source: SourceItem): GeneratedDraft {
  return {
    title: `[STUB] ${source.headline}`,
    dek: "AI drafting is running in stub mode — set ANTHROPIC_API_KEY to generate real rewrites.",
    body: [
      `[This is a placeholder draft. Set ANTHROPIC_API_KEY to have the Onibsport AI Desk rewrite this story properly.]`,
      source.rawSummary,
    ].join("\n\n"),
    tags: "AI Desk, Stub",
    category: (CATEGORY_SLUGS as readonly string[]).includes(source.categorySlug) ? (source.categorySlug as CategorySlug) : "world-football",
    imageAlt: source.headline,
    sourceOutlet: source.sourceName,
    sourceUrl: source.sourceUrl,
    isStub: true,
  };
}

/** Everything the writer needs about one source story, ready to send to Claude. */
export interface SourceBrief {
  /** The user-turn text: source details, link list and the source material. */
  text: string;
  outlet: string;
  sourceUrl?: string;
  /** Share image found on the source page, if any. */
  image?: string;
}

/** Reads the source page (full text, outlet, photo) and lays out the brief for the writer. */
export async function prepareSourceBrief(source: SourceItem, internalLinks: InternalLink[] = []): Promise<SourceBrief> {
  const page = source.sourceUrl ? await fetchSourceArticle(source.sourceUrl) : null;
  const outlet = page?.outlet ?? source.sourceName;
  const sourceUrl = page?.url ?? source.sourceUrl;
  const sourceMaterial = page?.text
    ? `Full source article text:\n${page.text}`
    : `Source summary (the full article wasn't available — work from this):\n${source.rawSummary}`;

  const linkList = internalLinks.length
    ? internalLinks.map((l) => `- ${l.title}: ${l.url}`).join("\n")
    : "(none available — skip internal links)";

  const text = [
    `Source outlet: ${outlet}`,
    `Source URL: ${sourceUrl ?? "(not available)"}`,
    `Original headline: ${source.headline}`,
    `Suggested hub (override it if the story clearly belongs elsewhere): ${source.categorySlug}`,
    "",
    "Onibsport pages you may link to:",
    linkList,
    "",
    sourceMaterial,
  ].join("\n");

  return { text, outlet, sourceUrl, image: page?.image };
}

/**
 * The same brief and rules as the API path, written as one message to paste
 * into a Claude chat. The reply comes back as labelled fields that the
 * editor's "Paste a draft from Claude" box reads (see chatDraft.ts).
 */
export function buildChatPrompt(brief: SourceBrief): string {
  return [
    SYSTEM_PROMPT,
    "",
    SOCIAL_RULES,
    "",
    "How to reply",
    "Reply with one plain-text code block (```text ... ```) and nothing outside it, laid out exactly like this:",
    "",
    "TITLE: the headline",
    "STANDFIRST: the one-sentence standfirst / meta description",
    `CATEGORY: one of ${CATEGORY_SLUGS.join(", ")}`,
    "TAGS: tag one, tag two, tag three, tag four",
    "IMAGE ALT: the alt text",
    "BODY:",
    "the full article in the markdown subset above, blocks separated by a blank line",
    SOCIAL_REPLY_FORMAT,
    "",
    "Here is the story to rewrite.",
    "",
    brief.text,
  ].join("\n");
}

export async function generateDraft(source: SourceItem, internalLinks: InternalLink[] = []): Promise<GeneratedDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return buildStubDraft(source);
  }

  const brief = await prepareSourceBrief(source, internalLinks);
  const client = new Anthropic({ apiKey });
  let response;
  try {
    response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: [SYSTEM_PROMPT, SOCIAL_RULES].join("\n\n"),
      messages: [
        {
          role: "user",
          content: brief.text,
        },
      ],
      output_config: { format: zodOutputFormat(DraftSchema) },
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) throw new Error("AI Desk is rate-limited right now. Try again in a minute.");
    if (err instanceof Anthropic.AuthenticationError) throw new Error("ANTHROPIC_API_KEY was rejected. Check the key in your environment variables.");
    if (err instanceof Anthropic.APIError) throw new Error(`AI Desk request failed (${err.status ?? "network"}): ${err.message}`);
    throw err;
  }

  if (response.stop_reason === "refusal") {
    throw new Error("The AI Desk declined to rewrite this story. Write it by hand or pick another item.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The draft ran past the length limit and was cut off. Try drafting it again.");
  }
  const draft = response.parsed_output;
  if (!draft) {
    throw new Error("AI Desk returned a draft that didn't match the expected format. Try again.");
  }

  return {
    title: draft.title.trim(),
    dek: draft.dek.trim(),
    body: draft.body.trim(),
    tags: draft.tags.map((t) => t.trim()).filter(Boolean).join(", "),
    category: draft.category,
    imageAlt: draft.imageAlt.trim(),
    sourceImage: brief.image,
    sourceOutlet: brief.outlet,
    sourceUrl: brief.sourceUrl,
    social: draft.social,
    isStub: false,
  };
}

/** Social posts for a story that already exists (the editor's "Write social posts"). */
export async function generateSocialKit(article: { title: string; dek: string; body: string; hub?: string }): Promise<SocialKit> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No ANTHROPIC_API_KEY is set. Use Copy social prompt instead.");

  const client = new Anthropic({ apiKey });
  let response;
  try {
    response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      system: SOCIAL_RULES,
      messages: [
        {
          role: "user",
          content: [
            "Write the social posts for this published Onibsport article.",
            "",
            `Headline: ${article.title}`,
            `Standfirst: ${article.dek}`,
            article.hub ? `Hub: ${article.hub}` : "",
            "",
            article.body,
          ].join("\n"),
        },
      ],
      output_config: { format: zodOutputFormat(SocialSchema()) },
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) throw new Error("The AI is rate-limited right now. Try again in a minute.");
    if (err instanceof Anthropic.APIError) throw new Error(`The AI request failed (${err.status ?? "network"}): ${err.message}`);
    throw err;
  }
  if (response.stop_reason === "refusal") throw new Error("The AI declined to write posts for this story.");
  if (!response.parsed_output) throw new Error("The AI returned posts in the wrong format. Try again.");
  return response.parsed_output;
}
