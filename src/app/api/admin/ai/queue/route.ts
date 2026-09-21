import { NextResponse } from "next/server";
import { SOURCE_QUEUE } from "@/lib/ai/queue";

export async function GET() {
  return NextResponse.json({ items: SOURCE_QUEUE, stubMode: !process.env.ANTHROPIC_API_KEY });
}
