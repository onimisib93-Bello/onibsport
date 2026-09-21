import { NextResponse } from "next/server";
import { getSourceQueue } from "@/lib/ai/alerts";

export async function GET() {
  const { items, isLive } = await getSourceQueue();
  return NextResponse.json({ items, stubMode: !process.env.ANTHROPIC_API_KEY, isLive });
}
