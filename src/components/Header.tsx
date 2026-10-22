"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { List, X, MagnifyingGlass, Broadcast } from "@phosphor-icons/react/dist/ssr";
import { categories } from "@/lib/data/categories";
import { leagueTheme } from "@/lib/leagues";
import LeagueCrest from "@/components/ui/LeagueCrest";
import SearchPalette from "@/components/SearchPalette";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [railHidden, setRailHidden] = useState(false);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const lastY = useRef(0);

  // The league rail tucks away while reading down the page and returns on any scroll up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const delta = y - lastY.current;
    lastY.current = y;
    if (y < 140) setRailHidden(false);
    else if (delta > 6) setRailHidden(true);
    else if (delta < -6) setRailHidden(false);
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Onibsport home">
            <Image src="/logo.png" alt="" width={44} height={39} priority className="h-10 w-auto" />
            <span className="font-display text-[28px] font-black leading-none tracking-tight text-indigo">
              Onib<span className="text-orange-deep">sport</span>
            </span>
          </Link>

          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 xl:flex">
            {[
              { href: "/", label: "News" },
              { href: "/live-scores", label: "Scores & fixtures" },
              { href: "/category/transfers", label: "Transfers" },
              { href: "/videos", label: "Videos" },
            ].map((item) => {
              const active = item.href === pathname;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                    active ? "bg-paper text-indigo" : "text-ink/70 hover:bg-paper hover:text-ink"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-paper pl-3 pr-2 text-sm text-muted transition-colors hover:border-indigo/30 hover:text-ink sm:w-56"
            >
              <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
              <span className="hidden sm:inline">Search stories</span>
              <span className="sr-only sm:hidden">Search</span>
              <kbd className="ml-auto hidden rounded-md border border-line bg-white px-1.5 py-0.5 font-body text-[11px] font-semibold text-muted sm:inline">⌘K</kbd>
            </button>
            <Link
              href="/live-scores"
              className="hidden h-10 items-center gap-2 rounded-full bg-night px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo md:inline-flex"
            >
              <Broadcast size={18} weight="bold" className="text-orange" aria-hidden="true" />
              Live scores
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="site-drawer"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-ink transition-colors hover:bg-paper xl:hidden"
            >
              <List size={24} weight="bold" />
            </button>
          </div>
        </div>

        {/* League rail: every hub, coloured by its kit. */}
        <motion.nav
          aria-label="Leagues"
          initial={false}
          animate={railHidden ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden border-t border-line/70"
        >
          <ul className="no-scrollbar mx-auto flex h-12 max-w-[1400px] items-stretch gap-1 overflow-x-auto px-4 sm:px-6">
            {categories.map((c) => {
              const href = `/category/${c.slug}`;
              const active = pathname === href;
              const theme = leagueTheme(c.slug);
              return (
                <li key={c.slug} className="flex shrink-0">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                      active ? "text-ink" : "text-ink/65 hover:text-ink"
                    )}
                  >
                    <LeagueCrest slug={c.slug} size={22} />
                    {c.name}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-2 bottom-0 h-[3px] origin-left rounded-full transition-transform duration-300",
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      )}
                      style={{ background: theme.deep }}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </motion.nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-[80] bg-night/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="drawer"
              id="site-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 right-0 z-[90] flex w-[min(420px,92vw)] flex-col overflow-y-auto bg-night text-white"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 38 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 90 || info.velocity.x > 500) setOpen(false);
              }}
            >
              <div className="flex items-center justify-between px-5 pt-5">
                <span className="font-display text-2xl font-black">Menu</span>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/10 hover:bg-white/20"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 px-5 pt-5">
                <Link href="/live-scores" className="flex items-center gap-2 rounded-xl bg-orange px-4 py-3 font-semibold text-ink">
                  <Broadcast size={18} weight="bold" aria-hidden="true" />
                  Live scores
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSearchOpen(true);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-semibold"
                >
                  <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
                  Search
                </button>
              </div>
              <p className="px-5 pt-7 text-sm font-semibold text-white/50">Leagues and desks</p>
              <ul className="space-y-1 px-3 pb-8 pt-2">
                {categories.map((c, i) => (
                  <motion.li
                    key={c.slug}
                    initial={reduce ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.035, duration: 0.3 }}
                  >
                    <Link href={`/category/${c.slug}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/5">
                      <LeagueCrest slug={c.slug} size={40} />
                      <span className="min-w-0">
                        <span className="block font-display text-xl font-extrabold leading-tight">{c.name}</span>
                        <span className="block truncate text-xs text-white/55">{leagueTheme(c.slug).blurb}</span>
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
