// app/stock/page.tsx
import Image from "next/image";

export const revalidate = 60; // re-fetch at most once per minute on the server

type StockPayload = {
  mirage?: { name: string }[];
  normal?: { name: string }[];
};

const STOCKS_API = "https://bfscraper.app.abledtaha.online/stock";

// map display -> local image path
function fruitImagePath(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  // special filenames you showed
  if (slug === "t-rex") return "/images/fruits-t-rex.webp";
  return `/images/fruits-${slug}.webp`;
}

async function getStocks(): Promise<StockPayload> {
  const res = await fetch(STOCKS_API, { cache: "no-store" });
  if (!res.ok) {
    // graceful fallback so page still renders
    return { mirage: [], normal: [] };
  }
  return res.json();
}

export default async function StockPage() {
  const data = await getStocks();
  const mirage = data.mirage ?? [];
  const normal = data.normal ?? [];

  return (
    <main className="bf-wrap" style={{ paddingBottom: 24 }}>
      <header className="bf-header" style={{ textAlign: "center" }}>
        <h1 className="bf-h1">Stocks</h1>
        <p className="bf-muted">
          Live list of fruits currently in stock. Mirage and Normal pools update automatically.
        </p>
      </header>

      <section className="bf-section" aria-label="Mirage Stock">
        <h2 className="bf-h2" style={{ marginBottom: 10 }}>
          Mirage
        </h2>
        {mirage.length === 0 ? (
          <p className="bf-muted">No Mirage items right now.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {mirage.map((m) => (
              <article
                key={`mir-${m.name}`}
                style={{
                  borderRadius: 12,
                  background: "#1e2a38",
                  border: "2px solid #121923",
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
                title={m.name}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    position: "relative",
                    flex: "0 0 auto",
                  }}
                >
                  <Image
                    src={fruitImagePath(m.name)}
                    alt={m.name}
                    fill
                    sizes="48px"
                    style={{ objectFit: "contain" }}
                    priority={false}
                  />
                </div>
                <div style={{ fontWeight: 800, color: "#e7ecf6" }}>{m.name}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bf-section" aria-label="Normal Stock">
        <h2 className="bf-h2" style={{ marginBottom: 10 }}>
          Normal
        </h2>
        {normal.length === 0 ? (
          <p className="bf-muted">No Normal items right now.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {normal.map((n) => (
              <article
                key={`nor-${n.name}`}
                style={{
                  borderRadius: 12,
                  background: "#1e2a38",
                  border: "2px solid #121923",
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
                title={n.name}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    position: "relative",
                    flex: "0 0 auto",
                  }}
                >
                  <Image
                    src={fruitImagePath(n.name)}
                    alt={n.name}
                    fill
                    sizes="48px"
                    style={{ objectFit: "contain" }}
                    priority={false}
                  />
                </div>
                <div style={{ fontWeight: 800, color: "#e7ecf6" }}>{n.name}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
