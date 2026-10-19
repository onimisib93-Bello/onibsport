import type { Metadata } from "next";
import { RANGES, getAnalytics, type RangeDays } from "@/lib/analytics/queries";
import AnalyticsView from "@/components/admin/analytics/AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const requested = Number(Array.isArray(params.range) ? params.range[0] : params.range);
  const days: RangeDays = RANGES.find((r) => r.days === requested)?.days ?? 7;
  return <AnalyticsView data={await getAnalytics(days)} days={days} />;
}
