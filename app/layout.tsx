import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BFFT",
  description: "BloxFruits Tools (BFFT)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Navbar (no styled-jsx; styles live in globals.css) */}
        <header className="bfft-nav-wrap">
          <nav className="bfft-nav">
            <Link href="/" className="bfft-brand" aria-label="BFFT Home">
              <span className="bfft-logo">🍍</span>
              <span className="bfft-title">BloxFruits Tools (BFFT)</span>
            </Link>

            <div className="bfft-links">
              <Link href="/tracker" className="bfft-link">Tracker</Link>
              <Link href="/calculator" className="bfft-link">Trade Calculator</Link>
              <Link href="/stock" className="bfft-link">Stock</Link>
              <Link href="/fruits" className="bfft-link">Fruit Info</Link>
              <Link href="/gacha" className="bfft-link">Gacha</Link>
              <Link href="/resources" className="bfft-link">Resources</Link>
            </div>
          </nav>
        </header>

        <main className="bfft-main">{children}</main>

        <footer className="bfft-footer">
          <div className="bfft-footer-inner">
            <span>© {new Date().getFullYear()} BFFT</span>
            <span className="bfft-dot">•</span>
            <span className="bfft-muted">Blox Fruits tools</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
