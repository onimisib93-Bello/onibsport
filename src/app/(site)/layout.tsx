import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Source_Sans_3 } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import LiveTicker from "@/components/LiveTicker";
import Footer from "@/components/Footer";
import NewsletterModal from "@/components/NewsletterModal";
import BreakingToast from "@/components/BreakingToast";
import { getBreakingArticles } from "@/lib/data/articles";

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Onibsport — Football News, Transfers & Live Scores",
    template: "%s | Onibsport",
  },
  description:
    "Breaking football news, transfer rumours, match reports and live scores — from the Premier League and Champions League to Nigeria's Super Eagles and the NPFL.",
  icons: { icon: "/logo.png" },
  openGraph: {
    siteName: "Onibsport",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2d1b69",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [breaking] = getBreakingArticles();

  return (
    <html lang="en" className={`${bebas.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <LiveTicker />
        <main className="flex-1">{children}</main>
        <Footer />
        <BreakingToast article={breaking} />
        <NewsletterModal />
      </body>
    </html>
  );
}
