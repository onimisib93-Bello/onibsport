import Link from "next/link";
import Image from "next/image";
import { TwitterLogo, FacebookLogo, InstagramLogo, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { categories } from "@/lib/data/categories";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-ink text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Onibsport" width={36} height={31} className="h-8 w-auto brightness-0 invert" />
              <span className="font-display text-xl tracking-wide text-white">
                ONIB<span className="text-orange">SPORT</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              Breaking football news, transfers, and match coverage — from the Premier League to the NPFL.
            </p>
            <div className="mt-5 flex gap-3">
              {[TwitterLogo, FacebookLogo, InstagramLogo, WhatsappLogo].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Follow Onibsport"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-orange"
                >
                  <Icon size={18} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Leagues</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.slice(0, 4).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="text-white/60 hover:text-orange">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Nigeria</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.slice(4).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="text-white/60 hover:text-orange">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/live-scores" className="text-white/60 hover:text-orange">
                  Live Scores
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Get the headlines first</h3>
            <p className="mt-4 text-sm text-white/60">Breaking news straight to your inbox. No spam, unsubscribe anytime.</p>
            <form className="mt-3 flex gap-2">
              <input
                type="email"
                required
                placeholder="you@email.com"
                aria-label="Email address"
                className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-orange focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white hover:bg-gold"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Onibsport. All rights reserved.</p>
          <p>Built for fans of the beautiful game — everywhere from Lagos to London.</p>
        </div>
      </div>
    </footer>
  );
}
