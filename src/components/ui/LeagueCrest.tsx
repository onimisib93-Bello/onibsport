import { leagueTheme } from "@/lib/leagues";
import { cn } from "@/lib/utils";

/** League monogram in that league's kit colours. */
export default function LeagueCrest({ slug, size = 32, className }: { slug: string; size?: number; className?: string }) {
  const theme = leagueTheme(slug);
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-[28%] font-display font-black leading-none", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * (theme.crest.length > 3 ? 0.3 : theme.crest.length > 2 ? 0.36 : 0.44),
        background: theme.deep,
        color: theme.tint,
        boxShadow: `inset 0 0 0 1.5px ${theme.tint}55`,
      }}
    >
      {theme.crest}
    </span>
  );
}
