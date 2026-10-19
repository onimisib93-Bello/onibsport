import Link from "next/link";
import {
  ArrowSquareOut,
  ArrowsLeftRight,
  Desktop,
  DeviceMobile,
  DeviceTablet,
  FacebookLogo,
  Globe,
  GoogleLogo,
  InstagramLogo,
  LinkedinLogo,
  MagnifyingGlass,
  RedditLogo,
  SnapchatLogo,
  TelegramLogo,
  ThreadsLogo,
  TiktokLogo,
  WhatsappLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import { RANGES, type AnalyticsData, type RangeDays } from "@/lib/analytics/queries";
import { SOCIAL_SOURCES } from "@/lib/analytics/classify";
import { getCategory } from "@/lib/data/categories";
import ColumnChart from "@/components/admin/analytics/ColumnChart";
import BarList from "@/components/admin/analytics/BarList";
import LiveDot from "@/components/ui/LiveDot";
import { cn } from "@/lib/utils";


const SOURCE_INFO: Record<string, { label: string; Icon: typeof Globe }> = {
  facebook: { label: "Facebook", Icon: FacebookLogo },
  x: { label: "X (Twitter)", Icon: XLogo },
  instagram: { label: "Instagram", Icon: InstagramLogo },
  tiktok: { label: "TikTok", Icon: TiktokLogo },
  whatsapp: { label: "WhatsApp", Icon: WhatsappLogo },
  threads: { label: "Threads", Icon: ThreadsLogo },
  youtube: { label: "YouTube", Icon: YoutubeLogo },
  telegram: { label: "Telegram", Icon: TelegramLogo },
  linkedin: { label: "LinkedIn", Icon: LinkedinLogo },
  snapchat: { label: "Snapchat", Icon: SnapchatLogo },
  reddit: { label: "Reddit", Icon: RedditLogo },
  google: { label: "Google search", Icon: GoogleLogo },
  bing: { label: "Bing", Icon: MagnifyingGlass },
  "other-search": { label: "Other search engines", Icon: MagnifyingGlass },
  direct: { label: "Direct, apps and bookmarks", Icon: ArrowsLeftRight },
  other: { label: "Other websites", Icon: Globe },
};

const DEVICE_ICON: Record<string, typeof Globe> = { mobile: DeviceMobile, tablet: DeviceTablet, desktop: Desktop };

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code: string | null) {
  if (!code) return "Unknown";
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function sourceIcon(key: string) {
  const Icon = SOURCE_INFO[key]?.Icon ?? Globe;
  return <Icon size={16} weight="fill" className="shrink-0 text-ink/60" aria-hidden="true" />;
}

function duration(sec: number | null) {
  if (sec == null) return "–";
  const s = Math.round(sec);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function compact(v: number) {
  return v >= 10_000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K` : v.toLocaleString();
}

function Delta({ now, before, days }: { now: number; before: number; days: number }) {
  if (!before) return <p className="mt-1 text-xs text-muted">No earlier period to compare</p>;
  const change = ((now - before) / before) * 100;
  const up = change >= 0;
  return (
    <p className={cn("mt-1 text-xs font-semibold", up ? "text-[#1f7a4a]" : "text-[#b42318]")}>
      <span aria-hidden="true">{up ? "▲" : "▼"}</span> {Math.abs(change).toFixed(0)}%{" "}
      <span className="font-normal text-muted">vs previous {days === 1 ? "day" : `${days} days`}</span>
    </p>
  );
}

function Card({ title, help, children, className }: { title: string; help?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-white p-5 ring-1 ring-line", className)}>
      <h2 className="font-display text-2xl font-black text-ink">{title}</h2>
      {help && <p className="mt-0.5 text-xs text-muted">{help}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** The analytics dashboard for one date range (data from getAnalytics). */
export default function AnalyticsView({ data, days }: { data: AnalyticsData; days: RangeDays }) {
  const rangeLabel = RANGES.find((r) => r.days === days)!.label;

  const arrivals = data.sources.reduce((s, x) => s + x.views, 0);
  const social = data.sources.filter((s) => (SOCIAL_SOURCES as readonly string[]).includes(s.key));
  const socialTotal = social.reduce((s, x) => s + x.views, 0);
  const bestHour = data.hours.indexOf(Math.max(...data.hours));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-black leading-none text-ink">Analytics</h1>
          <p className="mt-2 text-muted">Who reads Onibsport, where they come from and what they read. Times are West Africa Time.</p>
        </div>
        <nav aria-label="Date range" className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-line">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/admin/analytics?range=${r.days}`}
              aria-current={r.days === days ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                r.days === days ? "bg-night text-white" : "text-ink/65 hover:text-ink"
              )}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </div>

      {!data.ready ? (
        <section className="mt-8 rounded-2xl bg-white p-8 ring-1 ring-line">
          <h2 className="font-display text-3xl font-black text-ink">Analytics isn&apos;t switched on yet</h2>
          <p className="mt-2 max-w-2xl text-muted">
            The site is ready to count visits, but the database doesn&apos;t have the table to store them yet. From the project folder on your computer, run:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-night p-4 font-mono text-sm text-white">
            npx vercel env pull .env.local{"\n"}npm run db:push
          </pre>
          <p className="mt-3 text-sm text-muted">This only adds the new table. Your stories and settings aren&apos;t changed. Visits are counted from then on.</p>
        </section>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="col-span-2 rounded-2xl bg-night p-5 text-white lg:col-span-1">
              <dt className="text-sm font-semibold text-white/70">Page views</dt>
              <dd className="mt-1 font-display text-6xl font-black leading-none tabular-nums">{compact(data.views)}</dd>
              <dd>
                <Delta now={data.views} before={data.prevViews} days={days} />
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <dt className="text-sm font-semibold text-muted">Visitors</dt>
              <dd className="mt-1 font-display text-5xl font-black leading-none tabular-nums text-ink">{compact(data.visitors)}</dd>
              <dd>
                <Delta now={data.visitors} before={data.prevVisitors} days={days} />
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <dt className="flex items-center gap-2 text-sm font-semibold text-muted">
                <LiveDot /> Reading now
              </dt>
              <dd className="mt-1 font-display text-5xl font-black leading-none tabular-nums text-ink">{data.live}</dd>
              <dd className="mt-1 text-xs text-muted">Visitors in the last 5 minutes</dd>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <dt className="text-sm font-semibold text-muted">Average read time</dt>
              <dd className="mt-1 font-display text-5xl font-black leading-none tabular-nums text-ink">{duration(data.avgReadSec)}</dd>
              <dd className="mt-1 text-xs text-muted">On stories</dd>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <dt className="text-sm font-semibold text-muted">Read to the end</dt>
              <dd className="mt-1 font-display text-5xl font-black leading-none tabular-nums text-ink">
                {data.readThroughPct == null ? "–" : `${Math.round(data.readThroughPct)}%`}
              </dd>
              <dd className="mt-1 text-xs text-muted">Story views scrolled past 75%</dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Card title={days === 1 ? "Views today, by hour" : `Views per day, last ${rangeLabel.toLowerCase()}`} help="Hover or tab through the bars for exact numbers.">
              <ColumnChart
                valueName="views"
                ariaLabel={days === 1 ? "Page views by hour today" : `Page views per day over the last ${days} days`}
                labelEvery={days === 1 ? 3 : days <= 7 ? 1 : days <= 30 ? 5 : 15}
                data={data.series.map((d) => ({
                  label:
                    data.seriesUnit === "hour"
                      ? `${d.label}:00`
                      : new Date(`${d.label}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
                  value: d.views,
                  detail: `${d.visitors.toLocaleString()} visitors`,
                }))}
              />
            </Card>
            <Card
              title="Best time to post"
              help={data.views > 0 ? `Readers are most active around ${String(bestHour).padStart(2, "0")}:00. Schedule social posts just before it.` : "Views by hour of day."}
            >
              <ColumnChart
                valueName="views"
                ariaLabel="Page views by hour of day"
                labelEvery={6}
                width={420}
                data={data.hours.map((v, h) => ({ label: `${String(h).padStart(2, "0")}:00`, value: v }))}
              />
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <Card title="Where readers come from" help="The site or app each visit started from.">
              <BarList
                total={arrivals}
                items={data.sources.map((s) => ({ key: s.key, label: SOURCE_INFO[s.key]?.label ?? s.key, value: s.views, icon: sourceIcon(s.key) }))}
              />
            </Card>
            <Card
              title="Social media"
              help={socialTotal ? `${Math.round((socialTotal / Math.max(1, arrivals)) * 100)}% of visits came from social media.` : "Visits from social networks, including your tracked post links."}
            >
              <BarList
                total={socialTotal}
                empty="No visits from social media in this period yet. Share stories from the editor's Social posts panel."
                items={social.map((s) => ({ key: s.key, label: SOURCE_INFO[s.key]?.label ?? s.key, value: s.views, icon: sourceIcon(s.key) }))}
              />
            </Card>
            <Card title="Countries">
              <BarList items={data.countries.map((c) => ({ key: c.key, label: countryName(c.key), value: c.views }))} total={data.views} />
            </Card>
            <Card title="Cities">
              <BarList
                items={data.cities.map((c) => ({
                  key: `${c.city}-${c.country}`,
                  label: (
                    <>
                      {c.city}
                      <span className="text-muted">, {countryName(c.country)}</span>
                    </>
                  ),
                  value: c.views,
                }))}
                total={data.views}
              />
            </Card>
            <Card title="Devices">
              <BarList
                total={data.views}
                items={data.devices.map((d) => {
                  const Icon = DEVICE_ICON[d.key] ?? Desktop;
                  return {
                    key: d.key,
                    label: d.key[0].toUpperCase() + d.key.slice(1),
                    value: d.views,
                    icon: <Icon size={16} weight="fill" className="shrink-0 text-ink/60" aria-hidden="true" />,
                  };
                })}
              />
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted">Browsers</h3>
                  <BarList total={data.views} items={data.browsers.map((b) => ({ key: b.key, label: b.key, value: b.views }))} />
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted">Systems</h3>
                  <BarList total={data.views} items={data.os.map((o) => ({ key: o.key, label: o.key, value: o.views }))} />
                </div>
              </div>
            </Card>
            <Card title="League hubs" help="Views of hub pages.">
              <BarList
                items={data.hubs.map((h) => ({ key: h.key, label: getCategory(h.key)?.name ?? h.key, value: h.views, href: `/category/${h.key}` }))}
              />
            </Card>
          </div>

          <Card title={`Top stories, ${rangeLabel.toLowerCase()}`} className="mt-6" help="Visitors are counted once per day. Read to the end means they scrolled past 75% of the story.">
            {data.topStories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No story views in this period yet.</p>
            ) : (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th scope="col" className="py-2 pl-5 pr-2 font-semibold">
                        Story
                      </th>
                      <th scope="col" className="px-2 py-2 text-right font-semibold">
                        Views
                      </th>
                      <th scope="col" className="px-2 py-2 text-right font-semibold">
                        Visitors
                      </th>
                      <th scope="col" className="px-2 py-2 text-right font-semibold">
                        Avg read
                      </th>
                      <th scope="col" className="py-2 pl-2 pr-5 text-right font-semibold">
                        Read to end
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topStories.map((s, i) => (
                      <tr key={s.slug} className="border-b border-line last:border-0 hover:bg-paper/60">
                        <td className="py-2.5 pl-5 pr-2">
                          <span className="mr-2 inline-block w-5 font-display text-lg font-black text-indigo/30">{i + 1}</span>
                          {s.id ? (
                            <Link href={`/admin/articles/${s.id}`} className="font-semibold text-ink hover:text-indigo">
                              {s.title}
                            </Link>
                          ) : (
                            <span className="font-semibold text-ink">{s.slug}</span>
                          )}
                          <a
                            href={`/article/${s.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open the live story"
                            className="ml-2 inline-flex align-middle text-muted hover:text-ink"
                          >
                            <ArrowSquareOut size={14} weight="bold" />
                          </a>
                        </td>
                        <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-ink">{s.views.toLocaleString()}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{s.visitors.toLocaleString()}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{duration(s.avgSec)}</td>
                        <td className="py-2.5 pl-2 pr-5 text-right tabular-nums">{s.readThrough == null ? "–" : `${Math.round(s.readThrough)}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card title="Social post campaigns" help="From the tracked links in your social posts (utm_campaign).">
              <BarList items={data.campaigns.map((c) => ({ key: c.key, label: c.key, value: c.views }))} empty="No tracked campaign visits yet." />
            </Card>
            <Card title="Referring websites" help="Exact sites that sent visitors.">
              <BarList items={data.referrers.map((r) => ({ key: r.key, label: r.key, value: r.views }))} empty="No referring websites yet." />
            </Card>
            <Card title="Other pages" help="Homepage, hubs, scores and search.">
              <BarList items={data.topPages.map((p) => ({ key: p.key, label: p.key, value: p.views, href: p.key }))} />
            </Card>
          </div>

          <p className="mt-6 text-xs text-muted">
            How this is counted: one view per page opened on the public site. Visits by editors signed in to the admin, search-engine crawlers and link previews
            aren&apos;t counted. No cookies are used and IP addresses aren&apos;t stored; visitors are recognised for one day only, using a one-way code.
          </p>
        </>
      )}
    </div>
  );
}
