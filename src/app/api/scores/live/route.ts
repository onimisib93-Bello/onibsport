import { NextResponse } from "next/server";
import { getScoreboard } from "@/lib/live/footballData";

/**
 * Current ticker and homepage strip, polled by open pages so scores stay
 * live even when the page HTML itself came from the cache. Shared caches may
 * hold it for 20s, so many visitors cost at most a few upstream requests.
 */
export async function GET() {
  const board = await getScoreboard();
  return NextResponse.json(board, {
    headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" },
  });
}
