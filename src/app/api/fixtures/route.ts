import { NextRequest, NextResponse } from "next/server";
import { getFixturesForDate, parseDateParam } from "@/lib/live/footballData";
import { getCategory } from "@/lib/data/categories";
import { parseTimeZone } from "@/lib/time";

/** Results and fixtures for one day: GET /api/fixtures?date=YYYY-MM-DD[&league=slug][&tz=Europe/London] */
export async function GET(request: NextRequest) {
  const date = parseDateParam(request.nextUrl.searchParams.get("date"));
  if (!date) {
    return NextResponse.json({ error: "Pass a date as YYYY-MM-DD." }, { status: 400 });
  }
  const league = request.nextUrl.searchParams.get("league");
  const timeZone = parseTimeZone(request.nextUrl.searchParams.get("tz")) ?? "UTC";
  const fixtures = await getFixturesForDate(date, timeZone);
  const filtered = league && getCategory(league) ? fixtures.filter((f) => f.league === league) : fixtures;
  return NextResponse.json({ date, fixtures: filtered }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
