// app/stock/page.tsx
import Image from "next/image";

export const revalidate = 60; // re-fetch at most once per minute on the server

type StockItem = { name: string };
type StockPayload = {
  mirage: StockItem[];
  normal: StockItem[];
};
type Meta = {
  ok: boolean;
  message?: string;
  status?: number;
  url?: string;
  code?: string;             // e.g., ECONNREFUSED, ENOTFOUND (when available)
  tried?: string[];          // endpoints we attempted (for quick diagnostics)
  counts?: { mirage: number; normal: number };
};

// Prefer env vars; fall back to your hosted API (NOT just localhost)
const ENV_ENDPOINT =
  process.env.NEXT_PUBLIC_STOCKS_API ?? process.env.STOCKS_API ?? "";
const LOCAL_DEFAULT = "http://localhost:5000/stock"; // keep your local default
const CANDIDATE_ENDPOINTS: string[] = [
  ENV_ENDPOINT,
  "https://bfscraper.app.abledtaha.online/stock",
  "http://bfscraper.app.abledtaha.online/stock", // in case TLS is misconfigured
  "http://127.0.0.1:5000/stock",                 // explicit IPv4
  LOCAL_DEFAULT,                                  // your original
].filter(Boolean);

// map display -> local image path
function fruitImagePath(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  if (slug === "t-rex") return "/images/fruits-t-rex.webp";
  return `/images/fruits-${slug}.webp`;
}

// Accept both the new API (string arrays) and the old one ({name} arrays)
function normalizeStocks(input: unknown): StockPayload {
  const toItems = (v: unknown): StockItem[] => {
    if (Array.isArray(v)) {
      if (v.every((x) => typeof x === "string")) return (v as string[]).map((name) => ({ name }));
      if (v.every((x) => x && typeof x === "object" && "name" in (x as any))) {
        return (v as any[])
          .map((x) => ({ name: String((x as any).name ?? "") }))
          .filter((x) => x.name);
      }
    }
    return [];
  };

  const obj = (input && typeof input === "object" ? input : {}) as any;
  return {
    mirage: toItems(obj.mirage),
    normal: toItems(obj.normal),
  };
}

async function fetchWithTimeout(url: string, ms = 5000, init?: RequestInit) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { cache: "no-store", ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/** Try multiple endpoints; return first good payload or detailed error meta */
async function getStocks(): Promise<{ data: StockPayload; meta: Meta }> {
  const tried: string[] = [];
  let lastError: any = null;

  for (const url of CANDIDATE_ENDPOINTS) {
    tried.push(url);
    try {
      const res = await fetchWithTimeout(url, 5000);
      if (!res.ok) {
        lastError = { message: "Upstream responded non-200", status: res.status };
        continue; // try next endpoint
      }

      // Be defensive if server sends text
      const text = await res.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        lastError = { message: "Upstream returned non-JSON" };
        continue; // try next endpoint
      }

      const normalized = normalizeStocks(parsed);
      const counts = { mirage: normalized.mirage.length, normal: normalized.normal.length };

      return { data: normalized, meta: { ok: true, url, tried, counts } };
    } catch (e: any) {
      // Network error (timeout / DNS / TLS / refused). Save and try next.
      lastError = e;
      continue;
    }
  }

  // If we got here, all endpoints failed
  const code = (lastError && (lastError.code || (lastError.name === "AbortError" ? "ETIMEDOUT" : undefined))) as string | undefined;
  const message =
    lastError?.name === "AbortError"
      ? "Request timed out"
      : lastError?.message ?? "Network error";
  return {
    data: { mirage: [], normal: [] },
    meta: {
      ok: false,
      message,
      code,
      url: CANDIDATE_ENDPOINTS[CANDIDATE_ENDPOINTS.length - 1],
      tried,
    },
  };
}

export default async function StockPage() {
  const { data, meta } = await getStocks();
  const mirage = data.mirage ?? [];
  const normal = data.normal ?? [];

  const isEmpty = mirage.length === 0 && normal.length === 0;
  const showBanner = !meta.ok || isEmpty;

  return (
    <main className="bf-wrap" style={{ paddingBottom: 24 }}>
      <header className="bf-header" style={{ textAlign: "center" }}>
        <h1 className="bf-h1">Stocks</h1>
        <p className="bf-muted">
          Live list of fruits currently in stock. Mirage and Normal pools update automatically.
        </p>
      </header>

      {showBanner && (
        <div
          role="status"
          style={{
            margin: "16px 0",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #3a2a2a",
            background: "#2a1f1f",
            color: "#ffd7d7",
            fontSize: 14,
          }}
          aria-live="polite"
        >
          {!meta.ok
            ? `Couldn’t load live stock: ${meta.message ?? "unknown error"}${
                meta.status ? ` (status ${meta.status})` : ""
              }${meta.code ? ` [${meta.code}]` : ""}.`
            : "The API returned no items."}
          {meta.counts && ` (mirage: ${meta.counts.mirage}, normal: ${meta.counts.normal})`}
          {meta.tried && meta.tried.length > 0 && (
            <div style={{ opacity: 0.85, marginTop: 6, fontSize: 12 }}>
              Tried: {meta.tried.join(" → ")}
            </div>
          )}
        </div>
      )}

      <section className="bf-section" aria-label="Mirage Stock">
        <h2 className="bf-h2" style={{ marginBottom: 10 }}>Mirage</h2>
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
                <div style={{ width: 48, height: 48, position: "relative", flex: "0 0 auto" }}>
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
        <h2 className="bf-h2" style={{ marginBottom: 10 }}>Normal</h2>
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
                  border: "2px solid #121923", // <-- keep fixed
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
                title={n.name}
              >
                <div style={{ width: 48, height: 48, position: "relative", flex: "0 0 auto" }}>
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
