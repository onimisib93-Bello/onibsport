import { NextRequest, NextResponse } from "next/server";
import { getSourceQueue } from "@/lib/ai/alerts";
import { buildChatPrompt, prepareSourceBrief } from "@/lib/ai/draft";
import { internalLinkCandidates } from "@/lib/ai/links";

/**
 * Free alternative to /api/admin/ai/draft: builds the full rewrite prompt for
 * one queue item so an editor can paste it into a Claude chat, plus the source
 * details the editor fills in when the reply is imported.
 */
export async function POST(request: NextRequest) {
  const { itemId } = await request.json().catch(() => ({}));
  const { items } = await getSourceQueue();
  const source = items.find((s) => s.id === itemId);
  if (!source) {
    return NextResponse.json({ error: "This story is no longer in the queue. Reload the AI Desk." }, { status: 400 });
  }

  const brief = await prepareSourceBrief(source, await internalLinkCandidates().catch(() => []));
  return NextResponse.json({
    prompt: buildChatPrompt(brief),
    handoff: {
      outlet: brief.outlet,
      sourceUrl: brief.sourceUrl ?? null,
      image: brief.image ?? null,
      categorySlug: source.categorySlug,
      headline: source.headline,
    },
  });
}
