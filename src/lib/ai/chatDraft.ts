import { parseSocialSection, splitSocialSection, type SocialKit } from "@/lib/ai/social";

/**
 * Client-side half of the free "rewrite in Claude chat" workflow: the AI Desk
 * copies a prompt (see buildChatPrompt in draft.ts) and remembers which story
 * it was for; the editor reads Claude's labelled reply back into the form.
 */

export interface ChatHandoff {
  headline: string;
  outlet: string;
  sourceUrl: string | null;
  image: string | null;
  categorySlug: string;
  copiedAt: number;
}

export interface ChatDraft {
  title: string;
  dek: string;
  body: string;
  tags: string;
  imageAlt: string;
  category?: string;
  /** Posts from the "=== SOCIAL ===" section, when the reply has one. */
  social?: SocialKit;
}

const HANDOFF_KEY = "onibsport-chat-handoff";
/** A copied prompt older than this is probably for a different story. */
const HANDOFF_TTL_MS = 6 * 60 * 60 * 1000;

export function saveHandoff(handoff: Omit<ChatHandoff, "copiedAt">) {
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify({ ...handoff, copiedAt: Date.now() }));
  } catch {
    // Storage unavailable: the import still works, just without source details.
  }
}

export function readHandoff(): ChatHandoff | null {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const handoff = JSON.parse(raw) as ChatHandoff;
    return Date.now() - handoff.copiedAt < HANDOFF_TTL_MS ? handoff : null;
  } catch {
    return null;
  }
}

export function clearHandoff() {
  try {
    localStorage.removeItem(HANDOFF_KEY);
  } catch {
    // Best-effort only.
  }
}

type Label = "TITLE" | "STANDFIRST" | "CATEGORY" | "TAGS" | "IMAGE ALT" | "BODY";

/** Matches "TITLE:", "**Title:**", "Image alt -" and similar at the start of a line. */
function labelOf(line: string): { label: Label; rest: string } | null {
  const m = line.match(/^\s*[*_#]*\s*(TITLE|HEADLINE|STANDFIRST|DEK|CATEGORY|HUB|TAGS|IMAGE ALT|ALT TEXT|BODY|ARTICLE)\s*[*_]*\s*[:\-–]\s*[*_]*\s?(.*)$/i);
  if (!m) return null;
  const key = m[1].toUpperCase();
  const label: Label =
    key === "HEADLINE" ? "TITLE" : key === "DEK" ? "STANDFIRST" : key === "HUB" ? "CATEGORY" : key === "ALT TEXT" ? "IMAGE ALT" : key === "ARTICLE" ? "BODY" : (key as Label);
  return { label, rest: m[2] ?? "" };
}

/**
 * Reads a reply laid out as TITLE / STANDFIRST / CATEGORY / TAGS / IMAGE ALT
 * / BODY. Tolerates a surrounding code fence, bold labels and stray blank
 * lines. Everything after BODY: is the article.
 */
export function parseChatDraft(input: string): ChatDraft | { error: string } {
  let text = input.replace(/\r\n/g, "\n").trim();
  const fenced = text.match(/```[a-zA-Z]*\n([\s\S]*?)\n?```/);
  if (fenced) text = fenced[1];

  const fields: Partial<Record<Label, string>> = {};
  let socialText: string | null = null;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const found = labelOf(lines[i]);
    if (!found) continue;
    if (found.label === "BODY") {
      // Everything after BODY: is the article, up to the optional social section.
      const [body, social] = splitSocialSection([found.rest, ...lines.slice(i + 1)].join("\n"));
      fields.BODY = body.trim();
      socialText = social;
      break;
    }
    fields[found.label] = found.rest.trim();
  }

  if (!fields.TITLE || !fields.BODY) {
    return {
      error:
        "Couldn't find the TITLE and BODY lines. Copy Claude's whole reply (use the copy button on its code block) and paste it again, or ask Claude to reply in the TITLE / STANDFIRST / CATEGORY / TAGS / IMAGE ALT / BODY format.",
    };
  }

  return {
    title: fields.TITLE.replace(/^#+\s*/, ""),
    dek: fields.STANDFIRST ?? "",
    body: fields.BODY.replace(/\n{3,}/g, "\n\n"),
    tags: (fields.TAGS ?? "")
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean)
      .join(", "),
    imageAlt: fields["IMAGE ALT"] ?? "",
    category: fields.CATEGORY?.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z-]/g, "") || undefined,
    social: socialText ? parseSocialSection(socialText) : undefined,
  };
}
