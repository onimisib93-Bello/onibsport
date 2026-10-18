"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardText, Check, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { saveHandoff } from "@/lib/ai/chatDraft";

const CLAUDE_CHAT_URL = "https://claude.ai/new";

/**
 * Free path for the AI Desk: copies a ready-made rewrite prompt (source text,
 * Onibsport's link list and the house rules) to paste into a Claude chat,
 * then points the editor at the import box.
 */
export default function CopyPromptButton({ itemId, primary = false }: { itemId: string; primary?: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "manual">("idle");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't prepare the prompt. Try again.");
        setState("idle");
        return;
      }
      saveHandoff(data.handoff);
      setPrompt(data.prompt);
      try {
        await navigator.clipboard.writeText(data.prompt);
        setState("copied");
      } catch {
        // Some browsers block clipboard writes after a network request; show it to copy by hand.
        setState("manual");
      }
    } catch {
      setError("Lost the connection. Try again.");
      setState("idle");
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleCopy}
        disabled={state === "loading"}
        className={`flex min-w-44 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors disabled:cursor-wait disabled:opacity-70 md:ml-auto ${
          primary ? "bg-night text-white hover:bg-indigo" : "bg-white text-ink ring-1 ring-line hover:ring-ink"
        }`}
      >
        {state === "copied" ? <Check size={16} weight="bold" className={primary ? "text-orange" : "text-[#1f9d5c]"} aria-hidden="true" /> : <ClipboardText size={16} weight="bold" aria-hidden="true" />}
        {state === "loading" ? "Reading the source…" : state === "copied" ? "Prompt copied" : "Copy rewrite prompt"}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-[#b42318]">
          {error}
        </p>
      )}

      {(state === "copied" || state === "manual") && (
        <div role="status" className="mt-3 rounded-2xl bg-paper p-4 text-sm text-ink ring-1 ring-line">
          {state === "manual" && (
            <>
              <p className="font-semibold">Your browser blocked copying. Select all the text below and copy it:</p>
              <textarea
                readOnly
                value={prompt}
                rows={6}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Rewrite prompt"
                className="mt-2 w-full rounded-xl border border-line bg-white p-2 font-mono text-xs"
              />
            </>
          )}
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>
              <a href={CLAUDE_CHAT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-indigo hover:text-sky-dark">
                Open a new Claude chat
                <ArrowSquareOut size={14} weight="bold" aria-hidden="true" />
              </a>
              , paste the prompt and send it.
            </li>
            <li>When Claude finishes, click the copy button on its reply&apos;s code block.</li>
            <li>
              <Link href="/admin/articles/new?import=1" className="font-bold text-indigo hover:text-sky-dark">
                Open the editor
              </Link>{" "}
              and paste it into &ldquo;Paste a draft from Claude&rdquo;.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
