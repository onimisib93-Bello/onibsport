import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/admin/LogoutButton";
import AdminNav from "@/components/admin/AdminNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const [session, pendingCount] = await Promise.all([
    token ? verifySession(token) : null,
    prisma.article.count({ where: { status: "PENDING_REVIEW" } }).catch(() => 0),
  ]);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative flex shrink-0 flex-col overflow-hidden bg-night text-white lg:sticky lg:top-0 lg:h-screen lg:w-64">
        <div className="pitch-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-3 px-4 py-4 lg:block lg:px-5 lg:py-6">
          <Link href="/admin" className="inline-flex items-center gap-2.5 rounded-xl bg-white px-3 py-2">
            <Image src="/logo.png" alt="" width={32} height={28} className="h-7 w-auto" />
            <span className="font-display text-xl font-black leading-none text-indigo">
              Onib<span className="text-orange-deep">sport</span>
            </span>
          </Link>
          <p className="hidden text-xs font-semibold text-white/50 lg:mt-3 lg:block">Newsroom</p>
          <div className="w-32 lg:hidden">
            <LogoutButton />
          </div>
        </div>
        <div className="relative px-3 pb-3 lg:hidden">
          <AdminNav pendingCount={pendingCount} horizontal />
        </div>
        <div className="relative hidden flex-1 px-3 lg:block">
          <AdminNav pendingCount={pendingCount} />
        </div>
        <div className="relative hidden border-t border-white/10 p-3 lg:block">
          {session && <p className="truncate px-3 pb-2 text-xs text-white/50">{session.email}</p>}
          <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
            <ArrowSquareOut size={18} weight="bold" aria-hidden="true" />
            View the site
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
