"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CategoryOption {
  id: string;
  name: string;
}

export interface ArticleFormValues {
  id?: string;
  title: string;
  slug: string;
  dek: string;
  body: string;
  image: string;
  imageAlt: string;
  author: string;
  source: string;
  tags: string;
  isBreaking: boolean;
  featuredVideoUrl: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED";
  categoryId: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ArticleForm({
  categories,
  initial,
}: {
  categories: CategoryOption[];
  initial?: ArticleFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [values, setValues] = useState<ArticleFormValues>(
    initial ?? {
      title: "",
      slug: "",
      dek: "",
      body: "",
      image: "/placeholders/pl-title-race.jpg",
      imageAlt: "",
      author: "",
      source: "",
      tags: "",
      isBreaking: false,
      featuredVideoUrl: "",
      status: "DRAFT",
      categoryId: categories[0]?.id ?? "",
    }
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/admin/articles/${initial!.id}` : "/api/admin/articles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Could not save the article. Check the fields and try again.");
        return;
      }
      router.push("/admin/articles");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-ink">Title</label>
        <input
          required
          value={values.title}
          onChange={(e) => {
            update("title", e.target.value);
            if (!slugTouched) update("slug", slugify(e.target.value));
          }}
          className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-indigo focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink">Slug</label>
        <input
          required
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update("slug", slugify(e.target.value));
          }}
          className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm font-mono focus:border-indigo focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink">Dek (subheading)</label>
        <textarea
          required
          rows={2}
          value={values.dek}
          onChange={(e) => update("dek", e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-indigo focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink">Body</label>
        <p className="mt-0.5 text-xs text-muted">Separate paragraphs with a blank line.</p>
        <textarea
          required
          rows={10}
          value={values.body}
          onChange={(e) => update("body", e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm leading-relaxed focus:border-indigo focus:outline-none"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-ink">Category</label>
          <select
            required
            value={values.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-indigo focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink">Status</label>
          <select
            value={values.status}
            onChange={(e) => update("status", e.target.value as ArticleFormValues["status"])}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-indigo focus:outline-none"
          >
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-ink">Author</label>
          <input
            required
            value={values.author}
            onChange={(e) => update("author", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-indigo focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink">Source (optional, for AI-assisted drafts)</label>
          <input
            value={values.source}
            onChange={(e) => update("source", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-indigo focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-ink">Image path</label>
          <input
            required
            value={values.image}
            onChange={(e) => update("image", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm font-mono focus:border-indigo focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink">Image alt text</label>
          <input
            required
            value={values.imageAlt}
            onChange={(e) => update("imageAlt", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-indigo focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-ink">Tags (comma-separated)</label>
          <input
            value={values.tags}
            onChange={(e) => update("tags", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-indigo focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink">Featured video URL (optional)</label>
          <input
            value={values.featuredVideoUrl}
            onChange={(e) => update("featuredVideoUrl", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-indigo focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={values.isBreaking}
          onChange={(e) => update("isBreaking", e.target.checked)}
          className="h-4 w-4 rounded border-line text-indigo focus:ring-indigo"
        />
        Mark as breaking news
      </label>

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-line pt-5">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-indigo px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create article"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/articles")}
          className="rounded-full px-6 py-2.5 text-sm font-semibold text-muted hover:bg-line"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
