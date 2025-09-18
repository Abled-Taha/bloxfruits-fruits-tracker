// app/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Blox Fruits Tools",
  description:
    "Track your fruits across alts, check current stock, and browse info for every fruit.",
};

export default function Home() {
  return (
    <main className="bf-wrap">
      {/* Feature grid */}
      <section className="bf-section">
        <div className="bf-cards">
          <article className="bf-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 22 }}>📦</span>
              <h2 className="bf-h2" style={{ margin: 0 }}>Tracker (with Alts)</h2>
            </div>
            <p className="bf-muted" style={{ marginTop: 8 }}>
              Add your accounts/alts, log how many of each fruit you own, and
              see totals per fruit and per account. Data saves to your browser.
            </p>
            <div className="bf-btn-row" style={{ marginTop: 8 }}>
              <Link href="/tracker" className="bf-btn bf-btn-primary">
                Open Tracker
              </Link>
            </div>
          </article>

          <article className="bf-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 22 }}>🧮</span>
              <h2 className="bf-h2" style={{ margin: 0 }}>Trade Calculator</h2>
            </div>
            <p className="bf-muted" style={{ marginTop: 8 }}>
              Helps you in calculating your trades. Be sure not to be scammed by other players.
            </p>
            <div className="bf-btn-row" style={{ marginTop: 8 }}>
              <Link href="/calculator" className="bf-btn bf-btn-primary">
                Open Calculator
              </Link>
            </div>
          </article>

          <article className="bf-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 22 }}>🛒</span>
              <h2 className="bf-h2" style={{ margin: 0 }}>Live Stock</h2>
            </div>
            <p className="bf-muted" style={{ marginTop: 8 }}>
              Check the current in-game shop stock. (Note: uses community data
              and may be temporarily unavailable — we show clear error states.)
            </p>
            <div className="bf-btn-row" style={{ marginTop: 8 }}>
              <Link href="/stock" className="bf-btn bf-btn-primary">
                View Stock
              </Link>
            </div>
          </article>

          <article className="bf-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 22 }}>📖</span>
              <h2 className="bf-h2" style={{ margin: 0 }}>Fruit Info</h2>
            </div>
            <p className="bf-muted" style={{ marginTop: 8 }}>
              Browse every fruit’s name and basic details. Great for quick
              reference while trading or planning your build.
            </p>
            <div className="bf-btn-row" style={{ marginTop: 8 }}>
              <Link href="/fruits" className="bf-btn bf-btn-primary">
                Open Encyclopedia
              </Link>
            </div>
          </article>

          <article className="bf-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 22 }}>🔐</span>
              <h2 className="bf-h2" style={{ margin: 0 }}>Trade Saver</h2>
            </div>
            <p className="bf-muted" style={{ marginTop: 8 }}>
              Remembers your trades for you. Never forget what you traded or with whom and when.
            </p>
            <div className="bf-btn-row" style={{ marginTop: 8 }}>
              <Link href="/" className="bf-btn bf-btn-primary">
                Open Trade Saver
              </Link>
            </div>
          </article>

          <article className="bf-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 22 }}>💫</span>
              <h2 className="bf-h2" style={{ margin: 0 }}>Gacha</h2>
            </div>
            <p className="bf-muted" style={{ marginTop: 8 }}>
              Roll a fruit and see what you get! A fun way to simulate the gacha experience.
            </p>
            <div className="bf-btn-row" style={{ marginTop: 8 }}>
              <Link href="/" className="bf-btn bf-btn-primary">
                Open Gacha
              </Link>
            </div>
          </article>

          <article className="bf-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 22 }}>💰</span>
              <h2 className="bf-h2" style={{ margin: 0 }}>Trade</h2>
            </div>
            <p className="bf-muted" style={{ marginTop: 8 }}>
              A simple trade interface to facilitate trading fruits with other players.
            </p>
            <div className="bf-btn-row" style={{ marginTop: 8 }}>
              <Link href="/" className="bf-btn bf-btn-primary">
                Open Trade
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
