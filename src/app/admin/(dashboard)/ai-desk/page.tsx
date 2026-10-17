import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { getSourceQueue } from "@/lib/ai/alerts";
import DraftButton from "@/components/admin/DraftButton";

const STEPS = [
  { title: "Read the source", text: "Fetches the full story from the link, plus its photo and publisher name." },
  { title: "Rewrite it in full", text: "An original, full-length article with subheadings, a credit link to the source and links to your hubs." },
  { title: "Make it findable", text: "Headline, meta description, tags, alt text and the right league hub, ready for search." },
  { title: "Wait for you", text: "Saved as pending review. Nothing goes live until you approve it." },
];

export default async function AiDeskPage() {
  const stubMode = !process.env.ANTHROPIC_API_KEY;
  const { items, isLive } = await getSourceQueue();

  return (
    <div>
      <h1 className="font-display text-5xl font-black leading-none text-ink">AI Desk</h1>
      <p className="mt-2 max-w-2xl text-muted">Turn incoming stories into full Onibsport articles. Every draft waits for your approval.</p>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <span className="font-display text-3xl font-black text-indigo/25">{i + 1}</span>
            <p className="mt-1 font-semibold text-ink">{s.title}</p>
            <p className="mt-1 text-sm text-muted">{s.text}</p>
          </li>
        ))}
      </ol>

      {stubMode && (
        <div className="mt-6 rounded-2xl border border-orange/40 bg-orange/10 p-4 text-sm text-ink">
          <span className="font-bold text-orange-deep">Stub mode:</span> no <code className="font-mono">ANTHROPIC_API_KEY</code> is set, so drafts are placeholders
          rather than real rewrites. Add the key to your environment variables (Vercel: Settings, Environment Variables) and redeploy to turn on real drafting.
        </div>
      )}

      {isLive ? (
        <div className="mt-4 rounded-2xl border border-sky/30 bg-sky/10 p-4 text-sm text-ink">
          <span className="font-bold text-sky-dark">Live queue:</span> these stories were just pulled from your Google Alerts RSS feed(s).
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-ink/80 ring-1 ring-line">
          <span className="font-bold text-ink">Sample queue:</span> no <code className="font-mono">NEWS_ALERTS_RSS_URL</code> is set (or it returned nothing), so this
          is placeholder data. For each alert at{" "}
          <a href="https://google.com/alerts" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo underline">
            google.com/alerts
          </a>
          , switch delivery to <span className="font-semibold">RSS feed</span> and copy that alert&apos;s feed link. Paste all of them into{" "}
          <code className="font-mono">NEWS_ALERTS_RSS_URL</code>, separated by commas.
        </div>
      )}

      <h2 className="mt-10 font-display text-3xl font-black text-ink">Incoming ({items.length})</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-muted">{item.sourceName}</p>
              <p className="mt-0.5 font-display text-xl font-extrabold leading-tight text-ink">{item.headline}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{item.rawSummary}</p>
              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate text-xs font-semibold text-indigo hover:text-sky-dark"
                >
                  <ArrowSquareOut size={14} weight="bold" className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.sourceUrl}</span>
                </a>
              )}
            </div>
            <div className="shrink-0">
              <DraftButton itemId={item.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
