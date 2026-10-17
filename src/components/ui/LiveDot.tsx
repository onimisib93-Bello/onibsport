import { cn } from "@/lib/utils";

export default function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2 shrink-0", className)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
      <span className="relative inline-flex h-full w-full rounded-full bg-orange" />
    </span>
  );
}
