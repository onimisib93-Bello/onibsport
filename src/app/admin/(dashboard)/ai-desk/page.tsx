import { getSourceQueue } from "@/lib/ai/alerts";
import DraftButton from "@/components/admin/DraftButton";

export default async function AiDeskPage() {
  const stubMode = !process.env.ANTHROPIC_API_KEY;
  const { items, isLive } = await getSourceQueue();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ink">AI Desk</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Incoming stories are rewritten in original words with a punchy, accurate headline, then saved as{" "}
        <span className="font-semibold">Pending review</span> — nothing publishes without your approval.
      </p>

      {stubMode && (
        <div className="mt-4 rounded-xl border border-orange/30 bg-orange/5 p-4 text-sm text-ink/80">
          <span className="font-semibold text-orange">Stub mode:</span> no <code className="font-mono">ANTHROPIC_API_KEY</code> is set,
          so drafts are placeholders rather than real AI rewrites. Add the key to your environment variables to enable real drafting.
        </div>
      )}

      {isLive ? (
        <div className="mt-4 rounded-xl border border-sky/30 bg-sky/5 p-4 text-sm text-ink/80">
          <span className="font-semibold text-sky-dark">Live queue:</span> these stories were just pulled from your Google Alerts RSS
          feed.
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-line bg-paper p-4 text-sm text-ink/80">
          <span className="font-semibold text-ink">Sample queue:</span> no <code className="font-mono">NEWS_ALERTS_RSS_URL</code> is set
          (or it returned nothing), so this is placeholder data. Create a Google Alert at{" "}
          <a href="https://google.com/alerts" target="_blank" rel="noopener noreferrer" className="text-indigo underline">
            google.com/alerts
          </a>{" "}
          for the keywords you want to track, set its delivery method to <span className="font-semibold">RSS feed</span> instead of
          email, and paste that feed&apos;s URL into the <code className="font-mono">NEWS_ALERTS_RSS_URL</code> environment variable.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted">{item.sourceName}</p>
              <p className="mt-0.5 font-semibold text-ink">{item.headline}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{item.rawSummary}</p>
              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block truncate text-xs text-indigo underline"
                >
                  {item.sourceUrl}
                </a>
              )}
            </div>
            <div className="shrink-0">
              <DraftButton itemId={item.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
