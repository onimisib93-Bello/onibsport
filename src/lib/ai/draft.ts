import Anthropic from "@anthropic-ai/sdk";
import { SourceItem } from "@/lib/ai/queue";

export interface GeneratedDraft {
  title: string;
  dek: string;
  body: string;
  tags: string;
  isStub: boolean;
}

const SYSTEM_PROMPT = `You are the Onibsport AI Desk, a football news editor. Given a short summary of a news item, you write an ORIGINAL, SEO-optimized news article about it — never copy the source's wording. Rules:
- Headline: punchy, attention-grabbing, high click-through — but it must accurately reflect the article body. No misleading or false claims. No clickbait that overpromises. Naturally include the main keyword (team/player/competition name) near the start.
- Body: 6-9 paragraphs, written in your own words, in an engaging narrative style that gives readers a reason to keep scrolling — open with the most compelling angle, build context and stakes through the middle, and close with what happens next or why it matters. Factual and grounded, never inventing specifics.
- Naturally repeat the key entities (team names, player names, competition) a few times through the body the way a well-optimized sports article would, without keyword-stuffing.
- Do not fabricate specific quotes, statistics, or facts beyond what's implied by the summary.
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

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Source: ${source.sourceName}\nHeadline: ${source.headline}\nSummary: ${source.rawSummary}`,
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
