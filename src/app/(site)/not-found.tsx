import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-night px-4 py-28 text-center text-white sm:px-6">
      <div className="pitch-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl">
        <p className="led-glow font-display text-[9rem] font-black leading-none text-orange sm:text-[12rem]">404</p>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Offside. This page doesn&apos;t exist.</h1>
        <p className="mt-3 text-white/70">The story may have moved, or the link was mistyped.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-orange px-6 py-3 text-sm font-bold text-ink hover:bg-gold">
            Back to the front page
          </Link>
          <Link href="/search" className="rounded-full px-6 py-3 text-sm font-bold ring-1 ring-white/30 hover:bg-white/10">
            Search stories
          </Link>
        </div>
      </div>
    </section>
  );
}
