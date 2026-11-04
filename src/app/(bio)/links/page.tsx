import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FacebookLogo,
  InstagramLogo,
  Newspaper,
  SoccerBall,
  ThreadsLogo,
  TiktokLogo,
  WhatsappLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import { getLatestArticles } from "@/lib/data/db-articles";
import { getCategory } from "@/lib/data/categories";
import { SOCIAL_LINKS, YOUTUBE_CHANNEL_URL } from "@/lib/config";
import NewsImage from "@/components/ui/NewsImage";
import TimeAgo from "@/components/ui/TimeAgo";
import BreakingAlerts from "@/components/BreakingAlerts";
import { cn } from "@/lib/utils";

/**
 * The link-in-bio hub: one link for every social bio, with buttons for the
 * latest news (this site), full videos (YouTube), live scores and the latest
 * stories, plus every other Onibsport account.
 *
 * Put /links?utm_source=instagram (or tiktok, x, …) in each bio: the tag is
 * passed on to every button, so analytics still show which network sent the
 * reader. The admin dashboard has these links ready to copy.
 */

const DESCRIPTION = "Latest football news, full videos and live scores from Onibsport: one link for everything.";

export const metadata: Metadata = {
  title: "Onibsport | Links",
  description: DESCRIPTION,
  alternates: { canonical: "/links" },
  openGraph: {
    title: "Onibsport | Links",
    description: DESCRIPTION,
    url: "/links",
    siteName: "Onibsport",
    images: [{ url: "/covers/default-cover.jpg", width: 1200, height: 630, alt: "Onibsport" }],
  },
};

const SOCIALS = [
  { key: "instagram", label: "Instagram", Icon: InstagramLogo },
  { key: "tiktok", label: "TikTok", Icon: TiktokLogo },
  { key: "twitter", label: "X", Icon: XLogo },
  { key: "facebook", label: "Facebook", Icon: FacebookLogo },
  { key: "youtube", label: "YouTube", Icon: YoutubeLogo },
  { key: "threads", label: "Threads", Icon: ThreadsLogo },
  { key: "whatsapp", label: "WhatsApp channel", Icon: WhatsappLogo },
] as const;

/** A tracking tag from the bio link, kept short and safe. */
function tag(value: string | string[] | undefined) {
  return typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30) : "";
}

export default async function LinksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const source = tag(params.utm_source);
  const stories = await getLatestArticles(5);

  /** A link on this site, carrying the bio's tracking tag so the visit is credited to the right network. */
  const track = (path: string) => {
    if (!source) return path;
    const [base, hash] = path.split("#");
    const sp = new URLSearchParams({ utm_source: source, utm_medium: "bio", utm_campaign: "link_hub" });
    return `${base}${base.includes("?") ? "&" : "?"}${sp}${hash ? `#${hash}` : ""}`;
  };

  const buttons = [
    {
      href: track("/"),
      label: "Latest News",
      sub: "Breaking stories, transfers and match reports",
      Icon: Newspaper,
      tone: "bg-orange text-ink hover:bg-gold",
      iconTone: "bg-ink/10 text-ink",
      external: false,
    },
    {
      href: YOUTUBE_CHANNEL_URL,
      label: "Watch Full Videos",
      sub: "Highlights, reactions and analysis on YouTube",
      Icon: YoutubeLogo,
      tone: "bg-white text-ink hover:bg-paper",
      iconTone: "bg-[#ff0000] text-white",
      external: true,
    },
    {
      href: track("/live-scores"),
      label: "Live Scores",
      sub: "Scores, fixtures and league tables",
      Icon: SoccerBall,
      tone: "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15",
      iconTone: "bg-white/10 text-orange",
      external: false,
    },
  ];

  const socials = SOCIALS.filter((s) => SOCIAL_LINKS[s.key]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pitch-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-orange/20 blur-[120px]"
        aria-hidden="true"
      />

      <main className="relative mx-auto flex max-w-[480px] flex-col px-4 pb-12 pt-10 sm:pt-14">
        <header className="flex flex-col items-center text-center">
          <span className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-[0_0_0_6px_rgba(247,148,29,0.25)]">
            <Image src="/logo.png" alt="" width={586} height={514} priority className="h-16 w-auto" />
          </span>
          <h1 className="mt-5 font-display text-5xl font-black leading-none tracking-tight">
            Onib<span className="text-orange">sport</span>
          </h1>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-white/70">Football news, transfers and live scores, from Lagos to London.</p>
        </header>

        <nav aria-label="Onibsport links" className="mt-8 space-y-3">
          {buttons.map(({ href, label, sub, Icon, tone, iconTone, external }) => {
            const inner = (
              <>
                <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", iconTone)}>
                  <Icon size={26} weight="fill" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block font-display text-2xl font-black leading-tight">{label}</span>
                  <span className="block text-sm opacity-70">{sub}</span>
                </span>
                {external ? <ArrowUpRight size={20} weight="bold" aria-hidden="true" /> : <ArrowRight size={20} weight="bold" aria-hidden="true" />}
              </>
            );
            const className = cn("flex items-center gap-4 rounded-2xl p-3 pr-5 transition-colors", tone);
            return external ? (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={className}>
                {inner}
              </a>
            ) : (
              <Link key={label} href={href} className={className}>
                {inner}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 flex justify-center">
          <BreakingAlerts tone="dark" />
        </div>

        {stories.length > 0 && (
          <section aria-labelledby="just-posted" className="mt-10">
            <h2 id="just-posted" className="flex items-center gap-2 text-sm font-bold text-orange">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange" aria-hidden="true" />
              Just posted
            </h2>
            <p className="mt-1 text-sm text-white/55">Saw a story on our page? It&apos;s here.</p>
            <ul className="mt-4 space-y-2.5">
              {stories.map((story) => (
                <li key={story.slug}>
                  <Link
                    href={track(`/article/${story.slug}`)}
                    className="group flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 pr-4 ring-1 ring-white/10 transition-colors hover:bg-white/[0.1]"
                  >
                    <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-white/10">
                      <NewsImage src={story.image} focus={story.imageFocus} alt="" fill sizes="72px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-white/55">
                        {story.isBreaking ? <span className="text-orange">Breaking</span> : getCategory(story.category)?.name}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block font-semibold leading-snug text-white group-hover:text-orange">{story.title}</span>
                      <span className="mt-0.5 block text-xs text-white/45">
                        <TimeAgo iso={story.publishedAt} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={track("/")} className="mt-4 flex items-center justify-center gap-1.5 text-sm font-bold text-white/75 hover:text-white">
              See all the latest news
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </section>
        )}

        {socials.length > 0 && (
          <section aria-labelledby="follow" className="mt-10 text-center">
            <h2 id="follow" className="text-sm font-bold text-white/55">
              Follow Onibsport
            </h2>
            <ul className="mt-3 flex flex-wrap justify-center gap-2.5">
              {socials.map(({ key, label, Icon }) => (
                <li key={key}>
                  <a
                    href={SOCIAL_LINKS[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Onibsport on ${label}`}
                    className="grid h-12 w-12 place-items-center rounded-full bg-white/10 transition-colors hover:bg-orange hover:text-ink"
                  >
                    <Icon size={22} weight="fill" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-12 text-center text-xs text-white/40">
          <Link href={track("/")} className="hover:text-white/70">
            onibsport.com
          </Link>
        </footer>
      </main>
    </div>
  );
}
