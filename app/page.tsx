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
      {/* Hero */}
      {/* <header className="bf-header" style={{ marginBottom: 20 }}>
        <h1 className="bf-h1">Blox Fruits — Toolkit</h1>
        <p className="bf-muted" style={{ maxWidth: 720 }}>
          Keep your inventory organized across alts, peek at the latest shop
          stock, and look up details for every fruit — all in one place.
        </p>

        <div className="bf-btn-row" style={{ marginTop: 12 }}>
          <Link href="/tracker" className="bf-btn bf-btn-primary">
            Open Tracker
          </Link>
          <Link href="/stock" className="bf-btn">
            View Stock
          </Link>
          <Link href="/fruits" className="bf-btn">
            Fruit Encyclopedia
          </Link>
        </div>
      </header> */}

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
              {/* <Link href="/tracker#how-to" className="bf-btn">
                How it works
              </Link> */}
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
              <Link href="https://fruityblox.com/stock" className="bf-btn bf-btn-primary">
                View Stock
              </Link>
              {/* <Link href="/stock#about" className="bf-btn">
                Data sources
              </Link> */}
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
              <Link href="https://bloxfruitsvalues.com/values/fruits" className="bf-btn bf-btn-primary">
                Open Encyclopedia
              </Link>
              {/* <Link href="/fruits#search" className="bf-btn">
                Search & filters
              </Link> */}
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
              <Link href="https://fruityblox.com/trade-calculator" className="bf-btn bf-btn-primary">
                Open Calculator
              </Link>
            </div>
          </article>

          {/* <article className="bf-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 22 }}>🔐</span>
              <h2 className="bf-h2" style={{ margin: 0 }}>Trade Saver</h2>
            </div>
            <p className="bf-muted" style={{ marginTop: 8 }}>
              Remembers your trades for you. Never forget what you traded or with whom and when.
            </p>
            <div className="bf-btn-row" style={{ marginTop: 8 }}>
              <Link href="/saver" className="bf-btn bf-btn-primary">
                Open Trade Saver
              </Link>
            </div>
          </article> */}

          {/* <article className="bf-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 22 }}>💫</span>
              <h2 className="bf-h2" style={{ margin: 0 }}>Gacha</h2>
            </div>
            <p className="bf-muted" style={{ marginTop: 8 }}>
              Roll a fruit and see what you get! A fun way to simulate the gacha experience.
            </p>
            <div className="bf-btn-row" style={{ marginTop: 8 }}>
              <Link href="/gacha" className="bf-btn bf-btn-primary">
                Open Gacha
              </Link>
            </div>
          </article> */}
        </div>
      </section>

      {/* Optional: Quick links / footer */}
      {/* <footer className="bf-footer">
        <nav className="bf-muted" aria-label="Quick links">
          <span style={{ marginRight: 12 }}>
            <Link href="/tracker">Tracker</Link>
          </span>
          <span style={{ marginRight: 12 }}>
            <Link href="/stock">Stock</Link>
          </span>
          <span>
            <Link href="/fruits">Fruit Info</Link>
          </span>
        </nav>
      </footer> */}
    </main>
  );
}

// // app/page.tsx
// import { redirect } from "next/navigation";

// export default function Home() {
//   redirect("/tracker");
// }