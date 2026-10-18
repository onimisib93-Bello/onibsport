import { NextRequest, NextResponse } from "next/server";
import { generateSocialKit } from "@/lib/ai/draft";

/** Writes social posts for the story in the editor. Needs ANTHROPIC_API_KEY; otherwise the editor copies a prompt instead. */
export async function POST(request: NextRequest) {
  const { title, dek, body, hub } = await request.json().catch(() => ({}));
  if (typeof title !== "string" || typeof body !== "string" || !title.trim() || !body.trim()) {
    return NextResponse.json({ error: "Add the headline and story first." }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No ANTHROPIC_API_KEY is set. Use Copy social prompt instead." }, { status: 501 });
  }
  try {
    const social = await generateSocialKit({ title, dek: typeof dek === "string" ? dek : "", body, hub: typeof hub === "string" ? hub : undefined });
    return NextResponse.json({ social });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Couldn't write the posts." }, { status: 502 });
  }
}
