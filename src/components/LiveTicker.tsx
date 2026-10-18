import { getScoreboard } from "@/lib/live/footballData";
import TickerBoard from "@/components/TickerBoard";

/** The LED perimeter board: live scores first, then today's kick-offs and latest results. */
export default async function LiveTicker() {
  return <TickerBoard initial={await getScoreboard()} />;
}
