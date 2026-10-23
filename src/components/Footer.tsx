import Link from "next/link";
import Image from "next/image";
import { XLogo, FacebookLogo, InstagramLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import { categories } from "@/lib/data/categories";
import { SOCIAL_LINKS } from "@/lib/config";
import LeagueCrest from "@/components/ui/LeagueCrest";
import NewsletterForm from "@/components/NewsletterForm";

export default function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-night text-white">
      <div className="pitch-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1400px] px-4 pt-14 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
              <Image src="/logo.png" alt="" width={44} height={39} className="h-10 w-auto" />
              <span className="font-display text-3xl font-black leading-none tracking-tight text-indigo">
                Onib<span className="text-orange-deep">sport</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-white/65">
              Football news, transfers and live scores — from Lagos to London, Enyimba to El Clásico.
            </p>
            <div className="mt-6 flex gap-2">
              {[
                { Icon: XLogo, href: SOCIAL_LINKS.twitter, label: "Onibsport on X" },
                { Icon: FacebookLogo, href: SOCIAL_LINKS.facebook, label: "Onibsport on Facebook" },
                { Icon: InstagramLogo, href: SOCIAL_LINKS.instagram, label: "Onibsport on Instagram" },
                { Icon: YoutubeLogo, href: SOCIAL_LINKS.youtube, label: "Onibsport on YouTube" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-orange hover:text-ink"
                >
                  <Icon size={20} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Leagues">
            <h2 className="font-display text-xl font-extrabold">Leagues</h2>
            <ul className="mt-4 space-y-1">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="flex items-center gap-2.5 py-1 text-sm text-white/70 transition-colors hover:text-white">
                    <LeagueCrest slug={c.slug} size={20} />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Scores">
            <h2 className="font-display text-xl font-extrabold">Match centre</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/live-scores" className="text-white/70 hover:text-white">
                  Live scores
                </Link>
              </li>
              <li>
                <Link href="/live-scores?view=results" className="text-white/70 hover:text-white">
                  Latest results
                </Link>
              </li>
              <li>
                <Link href="/live-scores?view=fixtures" className="text-white/70 hover:text-white">
                  Upcoming fixtures
                </Link>
              </li>
              <li>
                <Link href="/category/premier-league#table" className="text-white/70 hover:text-white">
                  League tables
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-white/70 hover:text-white">
                  Search the archive
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-xl font-extrabold">Get the headlines first</h2>
            <p className="mt-3 text-sm text-white/65">Breaking news and the weekend&apos;s biggest stories, once a day. Unsubscribe any time.</p>
            <div className="mt-4">
              <NewsletterForm tone="dark" />
            </div>
          </div>
        </div>

        <p
          aria-hidden="true"
          className="pointer-events-none mt-16 select-none text-center font-display text-[22vw] font-black leading-[0.75] tracking-tighter text-white/[0.06] lg:text-[17rem]"
        >
          ONIBSPORT
        </p>
        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Onibsport. All rights reserved.</p>
          <p>Kick-off times are shown in your own time zone.</p>
        </div>
      </div>
    </footer>
  );
}
