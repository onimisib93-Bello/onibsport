import { cn } from "@/lib/utils";

/**
 * Team crest from the data feed when there is one; otherwise a monogram
 * roundel tinted from the team name, so every club still gets a mark.
 */
function hue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function initials(name: string) {
  const words = name.replace(/[^A-Za-z\s]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Crest({ name, src, size = 28, className }: { name: string; src?: string; size?: number; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- crests come from the data provider's CDN at tiny sizes
      <img src={src} alt="" width={size} height={size} loading="lazy" className={cn("shrink-0 object-contain", className)} style={{ width: size, height: size }} />
    );
  }
  const h = hue(name);
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-full font-display font-extrabold leading-none text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(145deg, hsl(${h} 55% 38%), hsl(${(h + 30) % 360} 60% 22%))`,
        boxShadow: "inset 0 0 0 1.5px rgb(255 255 255 / 0.22)",
      }}
    >
      {initials(name)}
    </span>
  );
}
