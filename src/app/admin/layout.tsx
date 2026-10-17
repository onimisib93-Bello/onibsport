import type { Metadata } from "next";
import { Big_Shoulders, Archivo } from "next/font/google";
import "../globals.css";

const shoulders = Big_Shoulders({ variable: "--font-shoulders", subsets: ["latin"], axes: ["opsz"], display: "swap" });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Onibsport Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${shoulders.variable} ${archivo.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper">{children}</body>
    </html>
  );
}
