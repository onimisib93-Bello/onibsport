import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Accent } from "@/lib/types";
import { accentBorder } from "@/lib/accent";

export default function SectionHeading({
  title,
  href,
  accent = "indigo",
}: {
  title: string;
  href?: string;
  accent?: Accent;
}) {
  return (
    <div className={`flex items-end justify-between border-b-2 pb-3 ${accentBorder[accent]}`}>
      <h2 className="font-display text-3xl tracking-wide text-ink">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-indigo hover:text-orange">
          See all
          <ArrowRight size={16} weight="bold" />
        </Link>
      )}
    </div>
  );
}
