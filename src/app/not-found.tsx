import Link from "next/link";
import "./globals.css";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-6xl font-bold text-indigo">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Offside — this page doesn&apos;t exist</h1>
        <Link href="/" className="mt-6 rounded-full bg-indigo px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-dark">
          Back to the homepage
        </Link>
      </body>
    </html>
  );
}
