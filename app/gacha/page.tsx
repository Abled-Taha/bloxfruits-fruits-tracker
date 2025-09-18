"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

declare global {
  interface Window {
    __BFFT_DEBUG__?: boolean;
    BFFT_setDebug?: (on: boolean) => void;
  }
}

/* ----------------------------- Types ----------------------------- */
type Skin = {
  chromatic: boolean;
  image: string;
  ingame_image: string;
  name: string;
  obtainment: string;
  rarity: string;
};

type FruitInfo = {
  name: string;
  type: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Legendary" | "Mythical" | string;
  price: number;
  robux_price: number;
  awakening: number;
  skins: Skin[];
  upgrading: { amount: number; name: string }[];
};

type SaveShape = {
  v: 1;
  inventory: Record<string, number>;
  stats: {
    totalRolls: number;
    byRarity: Record<string, number>;
  };
};

const API_URL = "https://bfscraper.app.abledtaha.online/info";
const STORAGE_KEY = "bfft-gacha-inventory-v1";

/* ----------------------------- Assets ----------------------------- */
function fruitImagePath(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  if (slug === "t-rex") return "/images/fruits-t-rex.webp";
  if (slug === "dragon") return "/images/fruits-dragon-west.webp";
  if (slug === "lightning") return "/images/fruits-rumble.webp";
  return `/images/fruits-${slug}.webp`;
}

/* ----------------------------- Weights ----------------------------- */
const RARITY_WEIGHTS: Record<string, number> = {
  Common: 52,
  Uncommon: 28,
  Rare: 12,
  Legendary: 7,
  Mythical: 1,
};
const RARITY_ORDER = ["Common", "Uncommon", "Rare", "Legendary", "Mythical"];

/* ----------------------------- Utils ----------------------------- */
function randInt(max: number) {
  return Math.floor(Math.random() * max);
}
function pickWeighted(weights: Record<string, number>): string {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of entries) {
    if ((r -= w) <= 0) return k;
  }
  return entries.at(-1)?.[0] ?? "Common";
}
function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
function normalizeName(s: string) {
  return s.trim();
}

/* ----------------------------- Component ----------------------------- */
export default function GachaPage() {
  const [pool, setPool] = useState<FruitInfo[]>([]);
  const [byRarity, setByRarity] = useState<Record<string, FruitInfo[]>>({});
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<SaveShape["stats"]>({ totalRolls: 0, byRarity: {} });

  // Roll settings (hidden from main, in Debug)
  const [rollCount, setRollCount] = useState(1);

  // Animation / results
  const [isRolling, setIsRolling] = useState(false);
  const [buttonPreview, setButtonPreview] = useState<FruitInfo | null>(null);
  const [resultOverlay, setResultOverlay] = useState<{ first: FruitInfo; count: number } | null>(
    null
  );
  const rollingIntervalRef = useRef<number | null>(null);
  const rollBtnRef = useRef<HTMLButtonElement>(null);

  const [loading, setLoading] = useState(true);
  const [invQuery, setInvQuery] = useState("");

  // Load saved
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SaveShape;
        if (parsed?.v === 1) {
          setInventory(parsed.inventory || {});
          setStats(parsed.stats || { totalRolls: 0, byRarity: {} });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save
  useEffect(() => {
    const payload: SaveShape = { v: 1, inventory, stats };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [inventory, stats]);

  // Fetch pool
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch pool");
        const data: FruitInfo[] = await res.json();

        const sorted = [...data].sort(
          (a, b) =>
            RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
            a.name.localeCompare(b.name)
        );
        setPool(sorted);

        const groups: Record<string, FruitInfo[]> = {};
        for (const r of RARITY_ORDER) groups[r] = [];
        for (const f of sorted) (groups[f.rarity] ?? (groups[f.rarity] = [])).push(f);
        setByRarity(groups);
      } catch {
        const fallback: FruitInfo[] = [
          { name: "Smoke", rarity: "Common", type: "Elemental", price: 100000, robux_price: 250, awakening: 0, skins: [], upgrading: [] },
          { name: "Light", rarity: "Rare", type: "Elemental", price: 650000, robux_price: 1100, awakening: 14500, skins: [], upgrading: [] },
          { name: "Buddha", rarity: "Legendary", type: "Beast", price: 1200000, robux_price: 1650, awakening: 14500, skins: [], upgrading: [] },
          { name: "Dough", rarity: "Mythical", type: "Elemental", price: 2800000, robux_price: 2400, awakening: 18500, skins: [], upgrading: [] },
          { name: "Dragon", rarity: "Mythical", type: "Beast", price: 15000000, robux_price: 5000, awakening: 0, skins: [], upgrading: [] },
        ];
        setPool(fallback);
        const groups: Record<string, FruitInfo[]> = {};
        for (const r of RARITY_ORDER) groups[r] = [];
        for (const f of fallback) (groups[f.rarity] ?? (groups[f.rarity] = [])).push(f);
        setByRarity(groups);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [debug, setDebug] = useState(false);

  useEffect(() => {
    // initial from localStorage OR window flag
    const ls = typeof localStorage !== "undefined" && localStorage.getItem("bfft-debug");
    const initial = (ls === "1") || !!window.__BFFT_DEBUG__;
    setDebug(initial);

    // expose a global setter for console usage
    window.BFFT_setDebug = (on: boolean) => {
      window.__BFFT_DEBUG__ = on;
      try { localStorage.setItem("bfft-debug", on ? "1" : "0"); } catch {}
      window.dispatchEvent(new CustomEvent("bfft-debug-change", { detail: on }));
    };

    // listen for custom event (same-tab) and storage (cross-tab)
    const onCustom = (e: Event) => setDebug(!!(e as CustomEvent).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bfft-debug" && e.newValue != null) {
        setDebug(e.newValue === "1");
      }
    };

    window.addEventListener("bfft-debug-change", onCustom as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("bfft-debug-change", onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const totalInventory = useMemo(
    () => Object.values(inventory).reduce((a, b) => a + b, 0),
    [inventory]
  );

  function addToInventory(name: string, amount = 1) {
    setInventory((prev) => ({ ...prev, [name]: (prev[name] || 0) + amount }));
  }
  function recordStats(rarity: string, qty = 1) {
    setStats((prev) => ({
      totalRolls: prev.totalRolls + qty,
      byRarity: { ...prev.byRarity, [rarity]: (prev.byRarity[rarity] || 0) + qty },
    }));
  }

  function doActualRolls(n: number): FruitInfo[] {
    const qty = clampInt(n, 1, 10000);
    const picked: FruitInfo[] = [];
    for (let i = 0; i < qty; i++) {
      const rarity = pickWeighted(RARITY_WEIGHTS);
      const candidates = (byRarity[rarity] || pool).filter(Boolean);
      const chosen =
        candidates.length > 0 ? candidates[randInt(candidates.length)] : pool[randInt(pool.length)];
      if (!chosen) continue;
      picked.push(chosen);
      addToInventory(normalizeName(chosen.name), 1);
      recordStats(rarity, 1);
    }
    return picked;
  }

  function startButtonAnimation() {
    // cycles a single preview fruit on the button
    const frame = () => {
      const f = pool[randInt(pool.length)] || pool[0];
      setButtonPreview(f);
    };
    frame();
    rollingIntervalRef.current = window.setInterval(frame, 120);
  }

  async function handleRollClick() {
    // If there is a result overlay, the first click just clears it
    if (resultOverlay) {
      setResultOverlay(null);
      return;
    }
    if (isRolling || loading || pool.length === 0) return;

    setIsRolling(true);
    startButtonAnimation();

    // 5–7s duration
    const duration = 5000 + randInt(2001);
    await new Promise((r) => setTimeout(r, duration));

    if (rollingIntervalRef.current) {
      clearInterval(rollingIntervalRef.current);
      rollingIntervalRef.current = null;
    }

    const results = doActualRolls(rollCount);
    const first = results[0] ?? pool[0];
    setButtonPreview(first);
    setResultOverlay({ first, count: results.length });
    setIsRolling(false);

    // Keep the button centered in view
    rollBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function clearInventory() {
    if (!confirm("Clear all gacha inventory and stats?")) return;
    setInventory({});
    setStats({ totalRolls: 0, byRarity: {} });
  }

  const filteredInventoryEntries = useMemo(() => {
    const q = invQuery.trim().toLowerCase();
    const entries = Object.entries(inventory);
    const mapped = entries
      .map(([name, count]) => {
        const fruit = pool.find((f) => f.name.toLowerCase() === name.toLowerCase());
        return { name, count, rarity: fruit?.rarity ?? "—", type: fruit?.type ?? "—" };
      })
      .sort(
        (a, b) =>
          RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
          a.name.localeCompare(b.name)
      );
    if (!q) return mapped;
    return mapped.filter((e) => e.name.toLowerCase().includes(q));
  }, [inventory, invQuery, pool]);

  return (
    <main className="bf-wrap">
      <header className="bf-header" style={{ textAlign: "center" }}>
        <h1 className="bf-h1">Gacha Simulator</h1>
        <p className="bf-muted">Tap the big button to roll. Results save to your inventory.</p>
      </header>

      {/* Stat cards */}
      <section className="bf-section">
        <div className="bf-cards gacha-cards">
          <div className="bf-card">
            <div className="bf-card-label">Total Rolls</div>
            <div className="bf-card-number">{stats.totalRolls}</div>
          </div>
          <div className="bf-card">
            <div className="bf-card-label">Inventory Items</div>
            <div className="bf-card-number">{totalInventory}</div>
          </div>
        </div>
      </section>

      {/* BIG CENTER ROLL BUTTON */}
      <section className="bf-section" style={{ display: "grid", placeItems: "center" }}>
        <button
          ref={rollBtnRef}
          onClick={handleRollClick}
          disabled={loading || pool.length === 0 || isRolling}
          style={{
            width: 280,
            height: 280,
            borderRadius: "50%",
            border: "1px solid #2b3750",
            background:
              "radial-gradient(120px 120px at 30% 30%, rgba(82,113,255,0.35), rgba(82,113,255,0.05)), linear-gradient(180deg, #1a2432, #121923)",
            boxShadow:
              "0 0 0 2px rgba(255,255,255,0.05) inset, 0 10px 30px rgba(82,113,255,0.25), 0 2px 0 rgba(0,0,0,0.35) inset",
            position: "relative",
            overflow: "hidden",
            cursor: loading || isRolling ? "not-allowed" : "pointer",
            transition: "transform 120ms ease, box-shadow 200ms ease",
            WebkitTapHighlightColor: "transparent",
          }}
          className="gacha-roll-btn"
          title={loading ? "Loading pool…" : isRolling ? "Rolling…" : "Roll"}
        >
          {/* Shine / shimmer while rolling */}
          {isRolling && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.08) 40%, transparent 60%)",
                transform: "translateX(-100%)",
                animation: "gachaShimmer 1.2s linear infinite",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Content */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: 16,
              textAlign: "center",
            }}
          >
            {/* Fruit image (preview while rolling, result after) */}
            {buttonPreview && (
              <div className="roll-img-wrap">
                <Image
                  src={fruitImagePath(buttonPreview.name)}
                  alt={buttonPreview.name}
                  fill
                  sizes="(max-width: 480px) 96px, 120px"
                  style={{
                    objectFit: "contain",
                    filter: isRolling ? "blur(1px) saturate(0.9)" : "none",
                    opacity: isRolling ? 0.85 : 1,
                    transition: "filter 160ms ease, opacity 160ms ease",
                  }}
                  priority
                />
              </div>
            )}

            {/* Label */}
            {!resultOverlay ? (
              <div>
                <div
                  className="roll-label"
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    color: isRolling ? "#dbe5ff" : "#ffffff",
                    textShadow: "0 2px 10px rgba(82,113,255,0.5)",
                  }}
                >
                  {isRolling ? "Rolling…" : "ROLL"}
                </div>
                <div className="bf-muted roll-sub" style={{ marginTop: 4, fontSize: 12 }}>
                  {isRolling ? "Good luck!" : `x${rollCount}`}
                </div>
              </div>
            ) : (
              <div>
                <div
                  className="roll-result"
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#ffffff",
                    marginBottom: 2,
                    textShadow: "0 2px 10px rgba(82,113,255,0.45)",
                  }}
                >
                  {resultOverlay.first.name}
                </div>
                <div
                  className="bf-muted"
                  style={{
                    fontSize: 12,
                    opacity: 0.9,
                  }}
                >
                  {resultOverlay.count > 1 ? `+${resultOverlay.count - 1} more` : "Tap to hide"}
                </div>
              </div>
            )}
          </div>

          {/* subtle glow ring */}
          <div
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: "50%",
              boxShadow: isRolling
                ? "0 0 40px rgba(82,113,255,0.35), 0 0 70px rgba(82,113,255,0.25)"
                : "0 0 18px rgba(82,113,255,0.18)",
              pointerEvents: "none",
              transition: "box-shadow 200ms ease",
            }}
          />

          <style jsx>{`
            .gacha-roll-btn:active {
              transform: scale(0.98);
              box-shadow: 0 10px 18px rgba(82, 113, 255, 0.15);
            }
            .roll-img-wrap {
              width: 120px;
              height: 120px;
              position: relative;
            }
            @keyframes gachaShimmer {
              0% {
                transform: translateX(-120%);
              }
              100% {
                transform: translateX(120%);
              }
            }

            /* -------- Mobile polish -------- */
            @media (max-width: 480px) {
              .gacha-roll-btn {
                width: 220px !important;
                height: 220px !important;
              }
              .roll-img-wrap {
                width: 96px;
                height: 96px;
              }
              .roll-label {
                font-size: 22px !important;
              }
              .roll-sub {
                font-size: 11px !important;
              }
            }
          `}</style>
        </button>
      </section>

      {/* Latest results grid (kept for history/inspection) */}
      {/* <section className="bf-section">
        <h2 className="bf-h2">Latest Roll Results</h2>
        {resultOverlay ? (
          <p className="bf-muted">Result shown on the button — tap the button to hide.</p>
        ) : (
          <p className="bf-muted">Tap Roll to get new results.</p>
        )}
      </section> */}

      {/* Inventory */}
      <section className="bf-section">
        <h2 className="bf-h2">Your Inventory</h2>
        <div className="bf-inline-form" style={{ marginBottom: 10 }}>
          <input
            value={invQuery}
            onChange={(e) => setInvQuery(e.target.value)}
            placeholder="Search your inventory…"
            aria-label="Search inventory"
            className="bf-input"
          />
        </div>

        {filteredInventoryEntries.length === 0 ? (
          <p className="bf-muted">No items yet. Roll to add fruits to your inventory.</p>
        ) : (
          <div className="bf-scroll-x inv-scroll">
            <table className="bf-table inv-table">
              <thead>
                <tr>
                  <th className="bf-th bf-sticky-left">Fruit</th>
                  <th className="bf-th">Count</th>
                  <th className="bf-th">Rarity</th>
                  <th className="bf-th inv-hide-sm">Type</th>
                  <th className="bf-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventoryEntries.map((row) => (
                  <tr key={row.name}>
                    <td className="bf-td bf-sticky-left">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, position: "relative" }}>
                          <Image
                            src={fruitImagePath(row.name)}
                            alt={row.name}
                            fill
                            sizes="28px"
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                        <strong>{row.name}</strong>
                      </div>
                    </td>
                    <td className="bf-td bf-td-number">{row.count}</td>
                    <td className="bf-td">{row.rarity}</td>
                    <td className="bf-td inv-hide-sm">{row.type}</td>
                    <td className="bf-td">
                      <div className="bf-btn-row inv-actions">
                        <button
                          className="bf-btn bf-btn-sm"
                          onClick={() =>
                            setInventory((prev) => ({
                              ...prev,
                              [row.name]: Math.max(0, (prev[row.name] || 0) - 1),
                            }))
                          }
                        >
                          −1
                        </button>
                        {/* <button
                          className="bf-btn bf-btn-sm"
                          onClick={() =>
                            setInventory((prev) => ({
                              ...prev,
                              [row.name]: (prev[row.name] || 0) + 1,
                            }))
                          }
                        >
                          +1
                        </button> */}
                        <button
                          className="bf-btn bf-btn-danger bf-btn-sm"
                          onClick={() =>
                            setInventory((prev) => {
                              const { [row.name]: _, ...rest } = prev;
                              return rest;
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="bf-td bf-sticky-left bf-strong">Totals</td>
                  <td className="bf-td bf-td-number">
                    {Object.values(inventory).reduce((a, b) => a + b, 0)}
                  </td>
                  <td className="bf-td" colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Debug Menu: hidden controls */}
      {debug && (
        <section className="bf-section">
          <details>
            <summary className="bf-h3">Debug</summary>

            <div className="bf-cards" style={{ marginTop: 12 }}>
              <div className="bf-card">
                <div className="bf-card-label">Pool Size</div>
                <div className="bf-card-number">{pool.length}</div>
              </div>
            </div>

            <div className="bf-inline-form" style={{ marginTop: 12, gap: 8 }}>
              <label className="bf-muted" htmlFor="rollCount" style={{ alignSelf: "center" }}>
                Roll Count
              </label>
              <input
                id="rollCount"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rollCount}
                onChange={(e) =>
                  setRollCount(clampInt(parseInt(e.target.value || "1", 10) || 1, 1, 10000))
                }
                className="bf-input"
                aria-label="Roll count"
                style={{ maxWidth: 140 }}
                disabled={isRolling}
              />
              <div className="bf-btn-row" style={{ marginTop: 0 }}>
                <button className="bf-btn" onClick={() => setRollCount(10)} disabled={isRolling}>
                  Set x10
                </button>
                <button className="bf-btn" onClick={() => setRollCount(100)} disabled={isRolling}>
                  Set x100
                </button>
              </div>
              <button className="bf-btn bf-btn-danger" onClick={clearInventory} disabled={isRolling}>
                Clear Inventory
              </button>
            </div>

            <details style={{ marginTop: 12 }}>
              <summary className="bf-h3">View Rarity Odds</summary>
              <ul className="bf-muted" style={{ marginTop: 8 }}>
                {RARITY_ORDER.map((r) => (
                  <li key={r}>
                    {r}: {RARITY_WEIGHTS[r] ?? 0} weight
                  </li>
                ))}
              </ul>
              <p className="bf-muted" style={{ marginTop: 6 }}>
                Higher weight ≈ more common. Adjust weights in code to tune balance.
              </p>
            </details>

            <details style={{ marginTop: 12 }}>
              <summary className="bf-h3">View Current Pool</summary>
              {loading ? (
                <p className="bf-muted">Loading pool…</p>
              ) : (
                <div
                  className="bf-scroll-x"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  {pool.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      style={{
                        borderRadius: 12,
                        background: "#1e2a38",
                        border: "1px solid #121923",
                        padding: 10,
                      }}
                    >
                      <div style={{ width: "100%", height: 80, position: "relative" }}>
                        <Image
                          src={fruitImagePath(f.name)}
                          alt={f.name}
                          fill
                          sizes="140px"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          justifyContent: "space-between",
                        }}
                      >
                        <strong style={{ color: "#fff", fontSize: 14 }}>{f.name}</strong>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#cfd9ff",
                            background: "rgba(93,70,255,0.15)",
                            border: "1px solid rgba(93,70,255,0.3)",
                            padding: "1px 6px",
                            borderRadius: 999,
                          }}
                        >
                          {f.rarity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </details>
          </details>
        </section>
      )}

      {/* Global mobile helpers (plain <style>, not styled-jsx) */}
      <style>{`
        /* Reduce card spacing on small devices */
        @media (max-width: 480px) {
          .gacha-cards {
            gap: 10px;
          }
          .bf-card {
            padding: 10px 12px;
          }
          .bf-card-number {
            font-size: 22px;
          }
        }

        /* Inventory table tweaks for mobile */
        .inv-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }
        @media (max-width: 480px) {
          .inv-table .bf-th,
          .inv-table .bf-td {
            padding: 8px 10px;
            font-size: 13px;
          }
          .inv-actions {
            gap: 6px;
          }
          .inv-hide-sm {
            display: none;
          }
        }

        /* Respect notches / safe areas */
        @supports (padding: max(0px)) {
          main.bf-wrap {
            padding-left: max(16px, env(safe-area-inset-left));
            padding-right: max(16px, env(safe-area-inset-right));
          }
        }
      `}</style>
    </main>
  );
}
