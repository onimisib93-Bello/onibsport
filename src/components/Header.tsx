"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { List, X, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { categories } from "@/lib/data/categories";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="Onibsport" width={40} height={35} priority className="h-9 w-auto" />
          <span className="font-display text-2xl tracking-wide text-indigo">
            ONIB<span className="text-orange">SPORT</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {categories.map((c) => {
            const href = `/category/${c.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={c.slug}
                href={href}
                className={`relative px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? "text-indigo" : "text-ink/70 hover:text-indigo"
                }`}
              >
                {c.shortName}
                {active && <span className="absolute inset-x-3 -bottom-[1px] h-[3px] rounded-full bg-orange" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            aria-label="Search Onibsport"
            className="grid h-10 w-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-paper hover:text-indigo"
          >
            <MagnifyingGlass size={20} weight="bold" />
          </Link>
          <Link
            href="/live-scores"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-indigo px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-dark"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
            </span>
            Live Scores
          </Link>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink/70 hover:bg-paper lg:hidden"
          >
            {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-white px-4 py-3 lg:hidden">
          <ul className="flex flex-col">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/80 hover:bg-paper hover:text-indigo"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/live-scores"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-lg bg-indigo px-3 py-2.5 text-sm font-semibold text-white"
              >
                Live Scores
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
