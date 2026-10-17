"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

// A full rewrite takes a minute or so; these tell the editor what's happening meanwhile.
const STAGES = ["Reading the source…", "Writing the story…", "Adding links and SEO…", "Almost there…"];

export default function DraftButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 12000);
    return () => clearInterval(id);
  }, [loading]);

  async function handleDraft() {
    setLoading(true);
    setStage(0);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not generate a draft. Try again.");
        return;
      }
      router.push(`/admin/articles/${data.article.id}`);
      router.refresh();
    } catch {
      setError("Lost the connection while drafting. Check the Articles list — the draft may have saved — then try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start sm:items-end">
      <button
        type="button"
        onClick={handleDraft}
        disabled={loading}
        aria-live="polite"
        className="flex min-w-44 cursor-pointer items-center justify-center gap-2 rounded-full bg-night px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo disabled:cursor-wait disabled:opacity-80"
      >
        <Sparkle size={16} weight="fill" className={loading ? "animate-spin text-orange" : "text-orange"} aria-hidden="true" />
        {loading ? STAGES[stage] : "Draft with AI"}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 max-w-xs text-xs font-semibold text-[#b42318] sm:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
