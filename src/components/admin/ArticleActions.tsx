"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, TrashSimple } from "@phosphor-icons/react/dist/ssr";

export function PublishButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    setLoading(true);
    try {
      await fetch(`/api/admin/articles/${id}/publish`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full bg-sky px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-dark disabled:opacity-60"
    >
      <CheckCircle size={14} weight="bold" />
      {loading ? "Publishing…" : "Approve & Publish"}
    </button>
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
      onClick={handleDelete}
      disabled={loading}
      aria-label="Delete article"
      className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
    >
      <TrashSimple size={16} weight="bold" />
    </button>
  );
}
