import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import FullImage from "@/components/ui/FullImage";

/**
 * Article bodies are stored as plain text blocks separated by blank lines
 * (see db-articles.ts). Each block may use a small, safe markdown subset so
 * both the AI Desk and editors can add structure without raw HTML:
 *
 *   ## Heading / ### Subheading
 *   > Pull quote
 *   - list item / 1. numbered item (one per line)
 *   ![Alt text](https://image.url "Optional caption")
 *   Inline: [link text](https://url), **bold**, *italic*
 *
 * Everything renders to React elements — nothing is injected as HTML.
 */

export type Block =
  | { type: "h2" | "h3"; text: string; id: string }
  | { type: "quote"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "p"; text: string };

export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[*_[\]()]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

const IMAGE_RE = /^!\[([^\]]*)\]\(\s*(\S+?)(?:\s+"([^"]*)")?\s*\)$/;

export function parseBlocks(paragraphs: string[]): Block[] {
  const blocks: Block[] = [];
  for (const raw of paragraphs) {
    const text = raw.trim();
    if (!text) continue;

    if (text.startsWith("### ")) {
      const t = text.slice(4).trim();
      blocks.push({ type: "h3", text: t, id: headingId(t) });
    } else if (text.startsWith("## ")) {
      const t = text.slice(3).trim();
      blocks.push({ type: "h2", text: t, id: headingId(t) });
    } else if (text.startsWith(">")) {
      blocks.push({ type: "quote", text: text.replace(/^>\s?/gm, "").trim() });
    } else if (IMAGE_RE.test(text)) {
      const [, alt, src, caption] = text.match(IMAGE_RE)!;
      if (safeUrl(src)) blocks.push({ type: "image", src, alt, caption });
    } else {
      const lines = text.split("\n").map((l) => l.trim());
      if (lines.every((l) => /^[-*]\s+/.test(l))) {
        blocks.push({ type: "ul", items: lines.map((l) => l.replace(/^[-*]\s+/, "")) });
      } else if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
        blocks.push({ type: "ol", items: lines.map((l) => l.replace(/^\d+[.)]\s+/, "")) });
      } else {
        blocks.push({ type: "p", text: lines.join(" ") });
      }
    }
  }
  return blocks;
}

function safeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || (url.startsWith("/") && !url.startsWith("//"));
}

const INLINE_RE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** Renders inline links, bold and italic. Unsafe link targets fall back to plain text. */
export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE_RE)) {
    const index = match.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    const [, linkText, href, bold, italic] = match;
    if (linkText !== undefined) {
      if (!safeUrl(href)) {
        out.push(linkText);
      } else if (href.startsWith("/")) {
        out.push(
          <Link key={key++} href={href}>
            {linkText}
          </Link>
        );
      } else {
        out.push(
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer">
            {linkText}
          </a>
        );
      }
    } else if (bold !== undefined) {
      out.push(<strong key={key++}>{bold}</strong>);
    } else if (italic !== undefined) {
      out.push(<em key={key++}>{italic}</em>);
    }
    last = index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Strips markdown so text can be used in meta tags, excerpts and word counts. */
export function plainText(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingMinutes(paragraphs: string[]): number {
  const words = paragraphs.map(plainText).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
      return <h2 id={block.id}>{renderInline(block.text)}</h2>;
    case "h3":
      return <h3 id={block.id}>{renderInline(block.text)}</h3>;
    case "quote":
      return <blockquote>{renderInline(block.text)}</blockquote>;
    case "ul":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    case "image":
      return (
        <figure>
          <FullImage src={block.src} alt={block.alt} sizes="(min-width: 768px) 720px, 100vw" className="rounded-xl" />
          {(block.caption || block.alt) && <figcaption>{block.caption || block.alt}</figcaption>}
        </figure>
      );
    default:
      return <p>{renderInline(block.text)}</p>;
  }
}

export function RichText({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <Fragment key={i}>
          <RenderBlock block={block} />
        </Fragment>
      ))}
    </>
  );
}
