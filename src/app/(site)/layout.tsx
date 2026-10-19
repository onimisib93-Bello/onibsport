import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Archivo } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import LiveTicker from "@/components/LiveTicker";
import Footer from "@/components/Footer";
import NewsletterModal from "@/components/NewsletterModal";
import BreakingToast from "@/components/BreakingToast";
import Analytics from "@/components/Analytics";
import { getFirstBreakingArticle } from "@/lib/data/db-articles";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const shoulders = Big_Shoulders({
  variable: "--font-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Onibsport — Football News, Transfers & Live Scores",
    template: "%s | Onibsport",
  },
  description:
    "Breaking football news, transfer rumours, match reports and live scores — from the Premier League and Champions League to Nigeria's Super Eagles and the NPFL.",
  keywords: [
    "football news",
    "Nigeria football",
    "NPFL",
    "Super Eagles",
    "Premier League news",
    "transfer news",
    "live football scores",
  ],
  icons: { icon: "/logo.png" },
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "Onibsport",
    type: "website",
    url: "/",
    images: [{ url: "/covers/default-cover.jpg", width: 1200, height: 630, alt: "Onibsport — Football News" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/covers/default-cover.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#120a33",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const breaking = await getFirstBreakingArticle();
  const siteJsonLd = [organizationJsonLd(), websiteJsonLd()];

  return (
    <html lang="en" className={`${shoulders.variable} ${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {siteJsonLd.map((data, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
        ))}
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-orange px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <LiveTicker />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <BreakingToast article={breaking} />
        <NewsletterModal />
        <Analytics />
      </body>
    </html>
  );
}
