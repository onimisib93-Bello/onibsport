import { SOURCE_QUEUE } from "@/lib/ai/queue";
import DraftButton from "@/components/admin/DraftButton";

export default function AiDeskPage() {
  const stubMode = !process.env.ANTHROPIC_API_KEY;

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
          so drafts are placeholders rather than real AI rewrites. Add the key to your <code className="font-mono">.env</code> to enable
          real drafting. The queue below is also sample data — swap <code className="font-mono">src/lib/ai/queue.ts</code> for a real news
          feed when you&apos;re ready.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {SOURCE_QUEUE.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted">{item.sourceName}</p>
              <p className="mt-0.5 font-semibold text-ink">{item.headline}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{item.rawSummary}</p>
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
