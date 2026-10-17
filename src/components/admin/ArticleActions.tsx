"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, TrashSimple } from "@phosphor-icons/react/dist/ssr";

export function PublishButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handlePublish() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/articles/${id}/publish`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handlePublish}
        disabled={loading}
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1f9d5c] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1a8550] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CheckCircle size={16} weight="bold" aria-hidden="true" />
        {loading ? "Publishing…" : "Approve & publish"}
      </button>
      {error && (
        <span role="alert" className="mt-1 text-xs font-semibold text-[#b42318]">
          Couldn&apos;t publish. Try again.
        </span>
      )}
    </span>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this article? This can't be undone.")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      aria-label="Delete article"
      className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-[#fde8e8] hover:text-[#b42318] disabled:opacity-60"
    >
      <TrashSimple size={17} weight="bold" />
    </button>
  );
}
