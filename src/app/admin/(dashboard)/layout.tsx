import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { SquaresFour, Newspaper, PlusCircle, Sparkle, Robot } from "@phosphor-icons/react/dist/ssr";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const nav = [
    { href: "/admin", label: "Dashboard", Icon: SquaresFour },
    { href: "/admin/articles", label: "Articles", Icon: Newspaper },
    { href: "/admin/articles/new", label: "New Article", Icon: PlusCircle },
    { href: "/admin/ai-desk", label: "AI Desk", Icon: Robot },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-ink text-white">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-5">
          <Image src="/logo.png" alt="Onibsport" width={32} height={28} className="h-7 w-auto brightness-0 invert" />
          <span className="font-display text-lg tracking-wide">
            ONIB<span className="text-orange">SPORT</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Icon size={18} weight="bold" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          {session && <p className="truncate px-3 pb-1 text-xs text-white/50">{session.email}</p>}
          <LogoutButton />
          <Link href="/" className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white">
            <Sparkle size={16} weight="bold" />
            View site
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10">{children}</div>
      </main>
    </div>
  );
}
