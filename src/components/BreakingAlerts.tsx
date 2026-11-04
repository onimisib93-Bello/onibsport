"use client";

import { useEffect, useState } from "react";
import { Bell, BellRinging, BellSlash } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * "Get breaking news alerts": subscribes this browser to Web Push (see
 * lib/push.ts). Hidden where the browser can't do push or alerts aren't set
 * up. On iPhone, push only works once the site is added to the Home Screen.
 */

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type State = "loading" | "unsupported" | "off" | "on" | "blocked" | "working";

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function supported() {
  return !!KEY && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export default function BreakingAlerts({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supported()) return "unsupported" as const;
      if (Notification.permission === "denied") return "blocked" as const;
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      return sub ? ("on" as const) : ("off" as const);
    })()
      .catch(() => "off" as const)
      .then((s) => {
        if (!cancelled) setState(s);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    setError(false);
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY!) }));
      const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error();
      setState("on");
    } catch {
      setError(true);
      setState("off");
    }
  }

  async function turnOff() {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
    } finally {
      setState("off");
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  const dark = tone === "dark";
  const base = cn(
    "inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-wait disabled:opacity-60",
    className
  );

  if (state === "blocked") {
    return (
      <p className={cn("inline-flex items-center gap-2 text-sm", dark ? "text-white/60" : "text-muted", className)}>
        <BellSlash size={18} weight="bold" aria-hidden="true" />
        Alerts are blocked in this browser&apos;s settings.
      </p>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {state === "on" ? (
        <button type="button" onClick={turnOff} className={cn(base, dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-paper text-ink ring-1 ring-line hover:ring-ink")}>
          <BellRinging size={18} weight="fill" className="text-orange" aria-hidden="true" />
          Breaking alerts on
          <span className={cn("text-xs font-semibold", dark ? "text-white/55" : "text-muted")}>Turn off</span>
        </button>
      ) : (
        <button type="button" onClick={turnOn} disabled={state === "working"} className={cn(base, "bg-orange text-ink hover:bg-gold")}>
          <Bell size={18} weight="fill" aria-hidden="true" />
          {state === "working" ? "Turning on…" : "Get breaking news alerts"}
        </button>
      )}
      {error && (
        <span role="alert" className={cn("text-xs font-semibold", dark ? "text-orange" : "text-[#b42318]")}>
          Couldn&apos;t turn alerts on. Try again.
        </span>
      )}
    </span>
  );
}
