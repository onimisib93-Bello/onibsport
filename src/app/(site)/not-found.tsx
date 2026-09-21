import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-display text-8xl tracking-wide text-indigo">404</p>
      <h1 className="mt-2 font-display text-3xl tracking-wide text-ink">Offside — this page doesn&apos;t exist</h1>
      <p className="mt-3 text-muted">The story you&apos;re looking for may have moved, or the link was mistyped.</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-indigo px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-dark"
      >
        Back to the homepage
      </Link>
    </div>
  );
}
