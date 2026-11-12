import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Archivo } from "next/font/google";
import "../globals.css";
import Analytics from "@/components/Analytics";
import PointerFx from "@/components/fx/PointerFx";

/**
 * A bare layout for the link-in-bio hub (/links): no header, ticker, footer or
 * newsletter pop-up, so visitors from a social bio see only the buttons.
 */

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
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#120a33",
};

export default function BioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${shoulders.variable} ${archivo.variable} h-full antialiased`}>
      {/* Inline so it beats the site-wide body colours in globals.css (and overscroll stays dark). */}
      <body className="min-h-full" style={{ background: "#120a33", color: "#ffffff" }}>
        {children}
        <Analytics />
        <PointerFx />
      </body>
    </html>
  );
}
