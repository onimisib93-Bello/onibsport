"use client";

import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react/dist/ssr";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
    >
      <SignOut size={18} weight="bold" />
      Sign out
    </button>
  );
}
