import type { Metadata } from "next";
import { fixtures } from "@/lib/data/fixtures";
import { categories } from "@/lib/data/categories";
import LiveScoresView from "@/components/LiveScoresView";

export const metadata: Metadata = {
  title: "Live Scores",
  description: "Live football scores, results and upcoming fixtures across the world's top leagues and the NPFL.",
};

export default function LiveScoresPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl tracking-wide text-ink sm:text-5xl">Live Scores</h1>
      <p className="mt-2 text-muted">Follow every match as it happens, filtered by league.</p>
      <div className="mt-6">
        <LiveScoresView fixtures={fixtures} categories={categories} />
      </div>
    </div>
  );
}
