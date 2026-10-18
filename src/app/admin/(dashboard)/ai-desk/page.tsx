import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { getSourceQueue } from "@/lib/ai/alerts";
import DraftButton from "@/components/admin/DraftButton";
import CopyPromptButton from "@/components/admin/CopyPromptButton";

const STEPS = [
  { title: "Read the source", text: "Fetches the full story from the link, plus its photo and publisher name." },
  { title: "Rewrite it in full", text: "An original, full-length article with subheadings, a credit link to the source and links to your hubs." },
  { title: "Make it findable", text: "Headline, meta description, tags, alt text and the right league hub, ready for search." },
  { title: "Wait for you", text: "Saved as pending review. Nothing goes live until you approve it." },
];

export default async function AiDeskPage() {
  const stubMode = !process.env.ANTHROPIC_API_KEY;
  const { items, isLive } = await getSourceQueue();

  // One section per alert keyword, in the order the alerts are configured; newest story first in each.
  const groups: { keyword: string; anchor: string; items: typeof items }[] = [];
  for (const item of items) {
    const keyword = item.keyword ?? "Incoming";
    let group = groups.find((g) => g.keyword === keyword);
    if (!group) {
      group = { keyword, anchor: keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"), items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  for (const g of groups) g.items.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

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
          <span className="font-bold text-orange-deep">No API key yet, so use Claude chat for free.</span> Click{" "}
          <span className="font-semibold">Copy rewrite prompt</span> on a story, paste it into a Claude chat, then paste Claude&apos;s reply into the editor
          and it fills itself in. To make it one click instead, add <code className="font-mono">ANTHROPIC_API_KEY</code> in Vercel (Settings, Environment
          Variables) and redeploy.
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

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-3xl font-black text-ink">Incoming ({items.length})</h2>
        {groups.length > 1 && <p className="text-sm text-muted">{groups.length} alerts, newest first within each</p>}
      </div>
      {groups.length > 1 && (
        <nav aria-label="Jump to an alert" className="sticky top-0 z-10 -mx-4 mt-4 flex gap-1.5 overflow-x-auto bg-paper/95 px-4 py-2 backdrop-blur sm:-mx-8 sm:px-8">
          {groups.map((g) => (
            <a
              key={g.keyword}
              href={`#alert-${g.anchor}`}
              className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-ink ring-1 ring-line hover:ring-ink"
            >
              {g.keyword} <span className="text-muted">{g.items.length}</span>
            </a>
          ))}
        </nav>
      )}
      <div className="mt-4 space-y-10">
        {groups.map((g) => (
          <section key={g.keyword} id={`alert-${g.anchor}`} aria-labelledby={`alert-${g.anchor}-title`} className="scroll-mt-16">
            {groups.length > 1 && (
              <h3 id={`alert-${g.anchor}-title`} className="mb-3 font-display text-2xl font-black text-ink">
                {g.keyword}
              </h3>
            )}
            <ul className="space-y-3">
              {g.items.map((item) => (
                <li key={item.id} className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-line md:grid-cols-[minmax(0,1fr)_20rem] md:items-start">
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
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    {stubMode ? (
                      <>
                        <CopyPromptButton itemId={item.id} primary />
                        <DraftButton itemId={item.id} label="Save as a placeholder draft" subtle />
                      </>
                    ) : (
                      <>
                        <DraftButton itemId={item.id} />
                        <CopyPromptButton itemId={item.id} />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
