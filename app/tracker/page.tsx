"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ----------------------------- Types ----------------------------- */
type FruitValue = { numeric: number; raw: string };
type Fruit = { id: string; name: string; valueNumeric?: number; valueRaw?: string };
type Account = { id: string; name: string; counts: Record<string, number> };
type SaveShape = { v: 1; fruits: Fruit[]; accounts: Account[] };
type SearchScope = "fruits" | "accounts" | "both";

const STORAGE_KEY = "bloxfruit-tracker-v1";
const VALUES_API = "https://bfscraper.app.abledtaha.online/fruits";

/* ----------------------------- Utils ----------------------------- */
const uid = () =>
  Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36);

const defaultFruits: Fruit[] = [
  { id: "frt-dragonEast", name: "Dragon East" },
  { id: "frt-dragonWest", name: "Dragon West" },
  { id: "frt-kitsune", name: "Kitsune" },
  { id: "frt-yeti", name: "Yeti" },
  { id: "frt-leopard", name: "Leopard" },
  { id: "frt-spirit", name: "Spirit" },
  { id: "frt-gas", name: "Gas" },
  { id: "frt-control", name: "Control" },
  { id: "frt-venom", name: "Venom" },
  { id: "frt-shadow", name: "Shadow" },
  { id: "frt-dough", name: "Dough" },
  { id: "frt-trex", name: "Trex" },
  { id: "frt-mammoth", name: "Mammoth" },
  { id: "frt-gravity", name: "Gravity" },
  { id: "frt-blizzard", name: "Blizzard" },
  { id: "frt-pain", name: "Pain" },
  { id: "frt-lightning", name: "Lightning" }, // API uses "Rumble"
  { id: "frt-portal", name: "Portal" },
  { id: "frt-phoenix", name: "Phoenix" },
  { id: "frt-sound", name: "Sound" },
  { id: "frt-spider", name: "Spider" },
  { id: "frt-creation", name: "Creation" },
  { id: "frt-love", name: "Love" },
  { id: "frt-buddha", name: "Buddha" },
  { id: "frt-quake", name: "Quake" },
  { id: "frt-magma", name: "Magma" },
  { id: "frt-ghost", name: "Ghost" },
  { id: "frt-rubber", name: "Rubber" },
  { id: "frt-light", name: "Light" },
  { id: "frt-diamond", name: "Diamond" },
  { id: "frt-eagle", name: "Eagle" },
  { id: "frt-dark", name: "Dark" },
  { id: "frt-sand", name: "Sand" },
  { id: "frt-ice", name: "Ice" },
  { id: "frt-flame", name: "Flame" },
  { id: "frt-spike", name: "Spike" },
  { id: "frt-smoke", name: "Smoke" },
  { id: "frt-bomb", name: "Bomb" },
  { id: "frt-spring", name: "Spring" },
  { id: "frt-blade", name: "Blade" },
  { id: "frt-spin", name: "Spin" },
  { id: "frt-rocket", name: "Rocket" },
];

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
function norm(s: string) {
  return s.toLowerCase().normalize("NFKD");
}
function match(text: string, q: string) {
  if (!q) return true;
  const t = norm(text);
  const tokens = norm(q).trim().split(/\s+/).filter(Boolean);
  return tokens.every((tok) => t.includes(tok));
}
function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// Nice compact formatter for totals (k/m/b)
function formatCompact(n: number): string {
  if (!isFinite(n) || n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2).replace(/\.00$/, "") + "b";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace(/\.0$/, "") + "m";
  if (abs >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}

/* ----------------------------- API mapping helpers ----------------------------- */
// Clean a fruit name to a comparable token
function canon(s: string) {
  return s.toLowerCase().replace(/[\s_\-]/g, "").trim();
}
// Some API names differ from your list. Map API -> your canonical names.
const API_ALIASES: Record<string, string> = {
  // API → Your fruit name
  rumble: "Lightning",
  trex: "Trex",
  "t-rex": "Trex",
  dragoneast: "Dragon East",
  dragonwest: "Dragon West",
};

function mapApiNameToFruitName(apiName: string): string | null {
  const c = canon(apiName);
  if (API_ALIASES[c]) return API_ALIASES[c];

  // Try direct canonical match against your fruit names
  // (e.g., "phoenix", "quake", "magma", etc.)
  const byCanon: Record<string, string> = {};
  for (const f of defaultFruits) byCanon[canon(f.name)] = f.name;
  if (byCanon[c]) return byCanon[c];

  return null;
}

/* ----------------------------- Page ----------------------------- */
export default function TrackerPage() {
  const [fruits, setFruits] = useState<Fruit[]>(defaultFruits);
  const [accounts, setAccounts] = useState<Account[]>([
    { id: uid(), name: "Main", counts: {} },
  ]);

  const [newFruitName, setNewFruitName] = useState("");
  const [newAccountName, setNewAccountName] = useState("");

  // Search
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("fruits"); // <- default to fruits
  const searchRef = useRef<HTMLInputElement>(null);

  /* Load saved */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SaveShape;
      if (parsed?.v === 1) {
        setFruits(parsed.fruits?.length ? parsed.fruits : defaultFruits);
        setAccounts(
          parsed.accounts?.length
            ? parsed.accounts
            : [{ id: uid(), name: "Main", counts: {} }]
        );
      }
    } catch {}
  }, []);

  /* Persist */
  useEffect(() => {
    const payload: SaveShape = { v: 1, fruits, accounts };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [fruits, accounts]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ----------------------------- Fetch & merge values ----------------------------- */
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(VALUES_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        type ApiFruit = { name: string; values?: FruitValue[] };
        const apiFruits: ApiFruit[] = Array.isArray(data?.fruits) ? data.fruits : [];

        // Build a map from your Fruit.name -> {numeric, raw}, using the FIRST entry of values
        const valueMap = new Map<string, FruitValue>();

        for (const item of apiFruits) {
          const targetName = mapApiNameToFruitName(item.name);
          if (!targetName) continue;

          const v0 = Array.isArray(item.values) && item.values.length > 0 ? item.values[0] : null;
          if (!v0) continue;

          // If multiple API entries map to the same fruit (e.g., Dragon East/West),
          // keep the higher numeric value to be conservative.
          const prev = valueMap.get(targetName);
          if (!prev || (typeof v0.numeric === "number" && v0.numeric > (prev.numeric ?? 0))) {
            valueMap.set(targetName, { numeric: v0.numeric, raw: v0.raw });
          }
        }

        if (!isMounted) return;

        setFruits((prev) =>
          prev.map((f) => {
            const v = valueMap.get(f.name);
            return v ? { ...f, valueNumeric: v.numeric, valueRaw: v.raw } : f;
          })
        );
      } catch (err) {
        console.error("Failed to fetch fruit values:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ----------------------------- Filtering ----------------------------- */
  const visibleFruits = useMemo(() => {
    if (scope === "accounts") return fruits; // don't filter fruits
    return fruits.filter((f) => match(f.name, query));
  }, [fruits, query, scope]);

  const visibleAccounts = useMemo(() => {
    if (scope === "fruits") return accounts; // don't filter accounts
    return accounts.filter((a) => match(a.name, query));
  }, [accounts, query, scope]);

  // Totals for the visible slice
  const totalsByFruitVisible = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const f of visibleFruits) totals[f.id] = 0;
    for (const acc of visibleAccounts) {
      for (const [fruitId, cnt] of Object.entries(acc.counts)) {
        if (fruitId in totals) totals[fruitId] += cnt || 0;
      }
    }
    return totals;
  }, [visibleFruits, visibleAccounts]);

  const grandTotalVisible = useMemo(
    () => Object.values(totalsByFruitVisible).reduce((a, b) => a + b, 0),
    [totalsByFruitVisible]
  );

  // Value totals (sum of counts * valueNumeric)
  const grandValueVisible = useMemo(() => {
    let sum = 0;
    for (const f of visibleFruits) {
      const count = totalsByFruitVisible[f.id] || 0;
      const v = f.valueNumeric || 0;
      sum += count * v;
    }
    return sum;
  }, [visibleFruits, totalsByFruitVisible]);

  /* ----------------------------- Actions ----------------------------- */
  function addAccount() {
    const name = newAccountName.trim() || `Alt ${accounts.length}`;
    const acc: Account = { id: uid(), name, counts: {} };
    setAccounts((prev) => [...prev, acc]);
    setNewAccountName("");
  }

  function removeAccount(accountId: string) {
    if (!confirm("Remove this account/alt?")) return;
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
  }

  function renameAccount(accountId: string, nextName: string) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, name: nextName } : a))
    );
  }

  function setCount(accountId: string, fruitId: string, value: number) {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              counts: {
                ...a.counts,
                [fruitId]: clampInt(value, 0, 99999),
              },
            }
          : a
      )
    );
  }

  function bump(accountId: string, fruitId: string, delta: number) {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              counts: {
                ...a.counts,
                [fruitId]: clampInt((a.counts[fruitId] || 0) + delta, 0, 99999),
              },
            }
          : a
      )
    );
  }

  /* ----------------------------- Render ----------------------------- */
  return (
    <main className="bf-wrap">
      <header className="bf-header">
        <h1 className="bf-h1">Blox Fruits Inventory Tracker</h1>
        <p className="bf-muted">
          Track how many fruits you have across all your accounts/alts. Changes
          are saved automatically in your browser.
        </p>
      </header>

      {/* Quick stats (for the visible slice) */}
      <section className="bf-cards">
        <div className="bf-card">
          <div className="bf-card-label">Visible Total Fruits</div>
          <div className="bf-card-number">{grandTotalVisible}</div>
        </div>
        <div className="bf-card">
          <div className="bf-card-label">
            Fruits <span className="bf-muted">— showing</span>
          </div>
          <div className="bf-card-number">
            {visibleFruits.length}/{fruits.length}
          </div>
        </div>
        <div className="bf-card">
          <div className="bf-card-label">
            Accounts <span className="bf-muted">— showing</span>
          </div>
          <div className="bf-card-number">
            {visibleAccounts.length}/{accounts.length}
          </div>
        </div>
        <div className="bf-card">
          <div className="bf-card-label">Visible Total Value</div>
          <div className="bf-card-number">{formatCompact(grandValueVisible)}</div>
        </div>
      </section>

      {/* Search bar + scope */}
      <section className="bf-section" aria-label="Search">
        <div className="bf-inline-form">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search ("/" to focus, Esc to clear)'
            aria-label="Search fruits or accounts"
            className="bf-input"
          />
          {query && (
            <button
              className="bf-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              title="Clear"
            >
              Clear
            </button>
          )}

          {/* Scope toggle */}
          <div className="bf-btn-row" style={{ marginTop: 0 }}>
            <button
              className={`bf-btn ${scope === "fruits" ? "bf-btn-primary" : ""}`}
              onClick={() => setScope("fruits")}
              title="Filter fruits only (keep all accounts visible)"
            >
              Fruits
            </button>
            <button
              className={`bf-btn ${scope === "accounts" ? "bf-btn-primary" : ""}`}
              onClick={() => setScope("accounts")}
              title="Filter accounts only (keep all fruits visible)"
            >
              Accounts
            </button>
            <button
              className={`bf-btn ${scope === "both" ? "bf-btn-primary" : ""}`}
              onClick={() => setScope("both")}
              title="Filter fruits and accounts together"
            >
              Both
            </button>
          </div>
        </div>
      </section>

      {/* Manage Accounts */}
      <section className="bf-section">
        <h2 className="bf-h2">Accounts / Alts</h2>
        <div className="bf-inline-form">
          <input
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="Add an account (e.g., Alt 1)"
            aria-label="Account name"
            className="bf-input"
          />
        <button onClick={addAccount} className="bf-btn bf-btn-primary">
            Add Account
          </button>
        </div>
        {accounts.length === 0 && (
          <p className="bf-muted">No accounts yet — add one to start.</p>
        )}
      </section>

      {/* Grid */}
      <section className="bf-section">
        <h2 className="bf-h2">Inventory Grid</h2>
        {visibleFruits.length === 0 || visibleAccounts.length === 0 ? (
          <p className="bf-muted">
            {query
              ? "No matches in this scope. Try a different term or switch scope."
              : "Add at least one fruit and one account to use the grid."}
          </p>
        ) : (
          <div className="bf-scroll-x">
            <table className="bf-table">
              <thead>
                <tr>
                  <th className="bf-th bf-sticky-left">Account</th>
                  {visibleFruits.map((f) => (
                    <th key={f.id} className="bf-th">
                      <div className="bf-th-col">
                        <span>{highlight(f.name, scope !== "accounts" ? query : "")}</span>
                        <div className="bf-th-meta">
                          <span className="bf-total-pill">
                            total: {totalsByFruitVisible[f.id] || 0}
                          </span>
                          {typeof f.valueRaw === "string" && (
                            <span className="bf-value-pill" title="Market value (per fruit)">
                              value: {f.valueRaw}
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="bf-th">Row Total</th>
                  <th className="bf-th">Row Value</th>
                  <th className="bf-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAccounts.map((a) => {
                  const rowTotal = visibleFruits.reduce(
                    (sum, f) => sum + (a.counts[f.id] || 0),
                    0
                  );
                  const rowValue = visibleFruits.reduce((sum, f) => {
                    const cnt = a.counts[f.id] || 0;
                    const val = f.valueNumeric || 0;
                    return sum + cnt * val;
                  }, 0);

                  return (
                    <tr key={a.id}>
                      <td className="bf-td bf-sticky-left">
                        <input
                          value={a.name}
                          onChange={(e) => renameAccount(a.id, e.target.value)}
                          aria-label={`Rename account ${a.name}`}
                          className="bf-name-input"
                        />
                      </td>
                      {visibleFruits.map((f) => {
                        const val = a.counts[f.id] || 0;
                        return (
                          <td key={f.id} className="bf-td">
                            <div className="bf-cell-controls">
                              <button
                                onClick={() => bump(a.id, f.id, -1)}
                                className="bf-btn bf-btn-sm"
                                aria-label={`Decrease ${f.name} for ${a.name}`}
                              >
                                −
                              </button>
                              <input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={val}
                                onChange={(e) =>
                                  setCount(
                                    a.id,
                                    f.id,
                                    parseInt(e.target.value || "0", 10) || 0
                                  )
                                }
                                className="bf-count-input"
                                aria-label={`${f.name} count for ${a.name}`}
                              />
                              <button
                                onClick={() => bump(a.id, f.id, +1)}
                                className="bf-btn bf-btn-sm"
                                aria-label={`Increase ${f.name} for ${a.name}`}
                              >
                                +
                              </button>
                            </div>
                          </td>
                        );
                      })}
                      <td className="bf-td bf-td-number">{rowTotal}</td>
                      <td className="bf-td bf-td-number" title="Sum of (count × value) across visible fruits">
                        {formatCompact(rowValue)}
                      </td>
                      <td className="bf-td">
                        <button
                          onClick={() => removeAccount(a.id)}
                          className="bf-btn bf-btn-danger"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="bf-td bf-sticky-left bf-strong">Totals</td>
                  {visibleFruits.map((f) => (
                    <td key={f.id} className="bf-td bf-td-number">
                      {totalsByFruitVisible[f.id] || 0}
                    </td>
                  ))}
                  <td className="bf-td bf-td-number bf-strong">
                    {grandTotalVisible}
                  </td>
                  <td className="bf-td bf-td-number bf-strong" title="Grand total value for visible fruits & accounts">
                    {formatCompact(grandValueVisible)}
                  </td>
                  <td className="bf-td" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Utilities */}
      <section className="bf-section">
        <details>
          <summary className="bf-h3">Backup / Reset</summary>
          <div className="bf-btn-row">
            <button
              className="bf-btn bf-btn-ghost"
              onClick={() => {
                const data = localStorage.getItem(STORAGE_KEY) ?? "";
                navigator.clipboard.writeText(data);
                alert("Saved current data to clipboard.");
              }}
            >
              Copy data to clipboard
            </button>
            <button
              className="bf-btn bf-btn-ghost"
              onClick={() => {
                const raw = prompt("Paste data to restore:");
                if (!raw) return;
                try {
                  const parsed = JSON.parse(raw) as SaveShape;
                  if (parsed?.v !== 1) throw new Error("Bad version");
                  setFruits(parsed.fruits);
                  setAccounts(parsed.accounts);
                } catch {
                  alert("Invalid data. Could not restore.");
                }
              }}
            >
              Restore from pasted data
            </button>
            <button
              className="bf-btn bf-btn-ghost-danger"
              onClick={() => {
                if (
                  confirm(
                    "Reset everything to defaults? This clears your local data."
                  )
                ) {
                  localStorage.removeItem(STORAGE_KEY);
                  setFruits(defaultFruits);
                  setAccounts([{ id: uid(), name: "Main", counts: {} }]);
                  setQuery("");
                }
              }}
            >
              Reset all
            </button>
          </div>
        </details>
      </section>
    </main>
  );
}
