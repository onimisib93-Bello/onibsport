"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, Newspaper, PlusCircle, Robot } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: SquaresFour, exact: true },
  { href: "/admin/articles", label: "Articles", Icon: Newspaper, exact: false },
  { href: "/admin/articles/new", label: "Write a story", Icon: PlusCircle, exact: true },
  { href: "/admin/ai-desk", label: "AI Desk", Icon: Robot, exact: true },
];

/** Sidebar links on desktop, a scrolling pill row on small screens. */
export default function AdminNav({ pendingCount, horizontal = false }: { pendingCount: number; horizontal?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || (pathname.startsWith(`${href}/`) && pathname !== "/admin/articles/new");

  return (
    <nav aria-label="Admin" className={horizontal ? "no-scrollbar flex gap-1.5 overflow-x-auto" : "space-y-1"}>
      {NAV.map(({ href, label, Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-white text-ink" : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon size={20} weight={active ? "fill" : "bold"} aria-hidden="true" className={active ? "text-indigo" : undefined} />
            {label}
            {href === "/admin" && pendingCount > 0 && (
              <span className="ml-auto rounded-full bg-orange px-2 py-0.5 text-xs font-bold text-ink" aria-label={`${pendingCount} waiting for review`}>
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
