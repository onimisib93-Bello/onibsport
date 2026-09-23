import Anthropic from "@anthropic-ai/sdk";
import { SourceItem } from "@/lib/ai/queue";
import { fetchSourceArticleText } from "@/lib/ai/sourceText";

export interface GeneratedDraft {
  title: string;
  dek: string;
  body: string;
  tags: string;
  isStub: boolean;
}

const SYSTEM_PROMPT = `You are the Onibsport AI Desk — acting as a veteran football chief editor with 15+ years running desks at major sports outlets, and as an expert SEO copywriter. You are handed raw source material (often the full text of another outlet's article, sometimes just a short alert snippet) about a football news item, and you produce an ORIGINAL, publication-ready Onibsport article from it. Never copy the source's sentences — read it for the facts, then write it fresh in your own voice.

Rules:
- Headline: punchy, attention-grabbing, high click-through — but it must accurately reflect the article body. No misleading or false claims, no clickbait that overpromises. Naturally include the main keyword (team/player/competition name) near the start.
- Body: 6-9 paragraphs, written entirely in your own words, in an engaging narrative style that gives readers a reason to keep scrolling — open with the most compelling angle, build context and stakes through the middle, and close with what happens next or why it matters. Factual and grounded in what the source material actually says — never invent quotes, statistics, transfer fees, or specifics that aren't supported by the source.
- Naturally repeat the key entities (team names, player names, competition) a few times through the body the way a well-optimized sports article would, without keyword-stuffing.
- If the source material is thin (just a short snippet), still write a complete, honest article — don't pad it with invented facts; instead lean on context and stakes you can reasonably infer (e.g. league position, rivalry context) without stating anything as fact that isn't given.
- Respond with strict JSON only, matching this shape: {"title": string, "dek": string, "body": string, "tags": string}
  - "dek" is a one-sentence subheading that also works as a meta description (under 160 characters).
  - "body" contains paragraphs separated by a blank line.
  - "tags" is a comma-separated list of 3-5 specific tags (team names, competition, "Transfers", etc.) useful for search and internal linking.`;

function buildStubDraft(source: SourceItem): GeneratedDraft {
  return {
    title: `[STUB] ${source.headline}`,
    dek: "AI drafting is running in stub mode — set ANTHROPIC_API_KEY to generate real rewrites.",
    body: [
      `[This is a placeholder draft. Set ANTHROPIC_API_KEY to have the Onibsport AI Desk rewrite this story properly.]`,
      source.rawSummary,
    ].join("\n\n"),
    tags: "AI Desk, Stub",
    isStub: true,
  };
}

export async function generateDraft(source: SourceItem): Promise<GeneratedDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return buildStubDraft(source);
  }

  const fullText = source.sourceUrl ? await fetchSourceArticleText(source.sourceUrl) : null;
  const sourceMaterial = fullText
    ? `Full source article text:\n${fullText}`
    : `Source summary (full article text wasn't available — work from this):\n${source.rawSummary}`;

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Source outlet: ${source.sourceName}\nOriginal headline: ${source.headline}\n\n${sourceMaterial}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI Desk did not return a text response.");
  }

  let parsed: { title: string; dek: string; body: string; tags: string };
  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
  } catch {
    throw new Error("AI Desk returned a response that could not be parsed as JSON.");
  }

  return { ...parsed, isStub: false };
}
