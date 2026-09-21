import { Suspense } from "react";
import type { Metadata } from "next";
import SearchResults from "@/components/SearchResults";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Onibsport's football coverage by team, player, or league.",
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
