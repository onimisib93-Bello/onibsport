import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SectionHeading({
  title,
  href,
  linkLabel = "See all",
  color,
  id,
  tone = "light",
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  /** Short bar in front of the title, e.g. a league's kit colour. */
  color?: string;
  id?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cn("relative flex items-end justify-between gap-4 pb-4", className)}>
      {/* The title rises out of its baseline and the rule draws across as the section scrolls into view. */}
      <h2 id={id} className={cn("flex items-center gap-3 font-display text-4xl font-black leading-none sm:text-5xl", tone === "dark" ? "text-white" : "text-ink")}>
        {color && <span aria-hidden="true" className="h-8 w-2 rounded-full sm:h-10" style={{ background: color }} />}
        <span className="-my-1 block overflow-hidden py-1">
          <span className="sd-rise block">{title}</span>
        </span>
      </h2>
      <span aria-hidden="true" className={cn("sd-rule absolute inset-x-0 bottom-0 h-px", tone === "dark" ? "bg-white/20" : "bg-ink/15")} />
      {href && (
        <Link
          href={href}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
            tone === "dark" ? "border-white/25 text-white hover:bg-white hover:text-ink" : "border-line bg-white text-ink hover:border-ink"
          )}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
