"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

export default function DraftButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDraft() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not generate a draft.");
        return;
      }
      router.push(`/admin/articles/${data.article.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDraft}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full bg-indigo px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-dark disabled:opacity-60"
      >
        <Sparkle size={14} weight="fill" />
        {loading ? "Drafting…" : "Draft with AI"}
      </button>
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
