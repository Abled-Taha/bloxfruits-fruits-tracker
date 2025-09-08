"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Blox Fruits tracker – page.tsx (UI-polished)
 * - Auto light/dark via prefers-color-scheme
 * - Consistent spacing & typography
 * - Sticky header & first column
 * - Better chip/editor controls
 * - Smooth horizontal scroll + visible scrollbars
 */

type Fruit = { id: string; name: string };
type Account = { id: string; name: string; counts: Record<string, number> };

type SaveShape = {
  v: 1;
  fruits: Fruit[];
  accounts: Account[];
};

const STORAGE_KEY = "bloxfruit-tracker-v1";

const uid = () =>
  Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36);

const defaultFruits: Fruit[] = [
  { id: "frt-dragon", name: "Dragon" },
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
  { id: "frt-lightning", name: "Lightning" },
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

export default function Page() {
  const [fruits, setFruits] = useState<Fruit[]>(defaultFruits);
  const [accounts, setAccounts] = useState<Account[]>([
    { id: uid(), name: "Main", counts: {} },
  ]);

  const [newFruitName, setNewFruitName] = useState("");
  const [newAccountName, setNewAccountName] = useState("");

  // Load from localStorage on first mount
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
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Persist whenever fruits/accounts change
  useEffect(() => {
    const payload: SaveShape = { v: 1, fruits, accounts };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [fruits, accounts]);

  const totalsByFruit = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const f of fruits) totals[f.id] = 0;
    for (const acc of accounts) {
      for (const [fruitId, cnt] of Object.entries(acc.counts)) {
        totals[fruitId] = (totals[fruitId] ?? 0) + (cnt || 0);
      }
    }
    return totals;
  }, [fruits, accounts]);

  const grandTotal = useMemo(
    () => Object.values(totalsByFruit).reduce((a, b) => a + b, 0),
    [totalsByFruit]
  );

  /* Actions */

  function addFruit() {
    const name = newFruitName.trim();
    if (!name) return;
    const id = "frt-" + name.toLowerCase().replace(/\s+/g, "-");
    if (fruits.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      setNewFruitName("");
      return;
    }
    setFruits((prev) => [...prev, { id, name }]);
    setNewFruitName("");
  }

  function removeFruit(fruitId: string) {
    if (!confirm("Remove this fruit from the tracker?")) return;
    setFruits((prev) => prev.filter((f) => f.id !== fruitId));
    setAccounts((prev) =>
      prev.map((a) => {
        const { [fruitId]: _, ...rest } = a.counts;
        return { ...a, counts: rest };
      })
    );
  }

  function renameFruit(fruitId: string, nextName: string) {
    setFruits((prev) =>
      prev.map((f) => (f.id === fruitId ? { ...f, name: nextName } : f))
    );
  }

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

  return (
    <main className="bf-wrap">
      <header className="bf-header">
        <h1 className="bf-h1">Blox Fruits Inventory Tracker</h1>
        <p className="bf-muted">
          Track how many fruits you have across all your accounts/alts. Changes
          are saved automatically in your browser.
        </p>
      </header>

      {/* Quick stats */}
      <section className="bf-cards">
        <div className="bf-card">
          <div className="bf-card-label">Total Fruits</div>
          <div className="bf-card-number">{grandTotal}</div>
        </div>
        <div className="bf-card">
          <div className="bf-card-label">Fruits Tracked</div>
          <div className="bf-card-number">{fruits.length}</div>
        </div>
        <div className="bf-card">
          <div className="bf-card-label">Accounts</div>
          <div className="bf-card-number">{accounts.length}</div>
        </div>
      </section>

      {/* Fruits */}
      {/* <section className="bf-section">
        <h2 className="bf-h2">Fruits</h2>
        <div className="bf-inline-form">
          <input
            value={newFruitName}
            onChange={(e) => setNewFruitName(e.target.value)}
            placeholder="Add a fruit (e.g., Spirit)"
            aria-label="Fruit name"
            className="bf-input"
          />
          <button onClick={addFruit} className="bf-btn bf-btn-primary">
            Add Fruit
          </button>
        </div>

        {fruits.length === 0 ? (
          <p className="bf-muted">No fruits yet — add a few to begin.</p>
        ) : (
          <ul className="bf-chips">
            {fruits.map((f) => (
              <li key={f.id} className="bf-chip">
                <input
                  value={f.name}
                  onChange={(e) => renameFruit(f.id, e.target.value)}
                  aria-label={`Rename ${f.name}`}
                  className="bf-chip-input"
                />
                <button
                  onClick={() => removeFruit(f.id)}
                  title="Remove fruit"
                  className="bf-chip-remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section> */}

      {/* Accounts */}
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
        {fruits.length === 0 || accounts.length === 0 ? (
          <p className="bf-muted">
            Add at least one fruit and one account to use the grid.
          </p>
        ) : (
          <div className="bf-scroll-x">
            <table className="bf-table">
              <thead>
                <tr>
                  <th className="bf-th bf-sticky-left">Account</th>
                  {fruits.map((f) => (
                    <th key={f.id} className="bf-th">
                      <div className="bf-th-col">
                        <span>{f.name}</span>
                        <span className="bf-total-pill">
                          total: {totalsByFruit[f.id] || 0}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="bf-th">Row Total</th>
                  <th className="bf-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const rowTotal = fruits.reduce(
                    (sum, f) => sum + (a.counts[f.id] || 0),
                    0
                  );
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
                      {fruits.map((f) => {
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
                  {fruits.map((f) => (
                    <td key={f.id} className="bf-td bf-td-number">
                      {totalsByFruit[f.id] || 0}
                    </td>
                  ))}
                  <td className="bf-td bf-td-number bf-strong">{grandTotal}</td>
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
                }
              }}
            >
              Reset all
            </button>
          </div>
        </details>
      </section>

      <footer className="bf-footer">
        <span className="bf-muted">
          Tip: Use the +/- buttons for quick updates while grinding or trading.
        </span>
      </footer>

      {/* ---- Styles ---- */}
      <style jsx global>{`
        :root {
          --bg: #0b0b0c;
          --card: #141416;
          --muted: #9aa0a6;
          --border: #2a2b2f;
          --soft-border: #1e1f23;
          --text: #e7e9ea;
          --primary: #e5e7eb;
          --primary-ink: #0b0b0c;
          --danger-bg: #2b1416;
          --danger-border: #b21b2a;
          --danger-ink: #ffb4bf;
          --chip-bg: #17181b;
          --chip-ring: #2c2e33;
          --table-head: #121215;
          --table-row: #0f1012;
          --focus: 0 0 0 2px rgba(99, 102, 241, 0.45);
          --radius: 12px;
        }
        @media (prefers-color-scheme: light) {
          :root {
            --bg: #fafafa;
            --card: #ffffff;
            --muted: #6b7280;
            --border: #e5e7eb;
            --soft-border: #eef0f3;
            --text: #111827;
            --primary: #111827;
            --primary-ink: #ffffff;
            --danger-bg: #fee2e2;
            --danger-border: #ef4444;
            --danger-ink: #991b1b;
            --chip-bg: #ffffff;
            --chip-ring: #e5e7eb;
            --table-head: #f6f7f9;
            --table-row: #ffffff;
            --focus: 0 0 0 2px rgba(59, 130, 246, 0.55);
          }
        }

        * {
          box-sizing: border-box;
        }
        body {
          background: var(--bg);
          color: var(--text);
        }

        .bf-wrap {
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 16px 72px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji",
            "Segoe UI Emoji";
        }
        .bf-header {
          margin-bottom: 8px;
        }
        .bf-h1 {
          font-weight: 800;
          font-size: 28px;
          letter-spacing: -0.3px;
          margin: 0 0 6px;
        }
        .bf-h2 {
          font-weight: 700;
          font-size: 18px;
          margin: 20px 0 8px;
        }
        .bf-h3 {
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
        }
        .bf-muted {
          color: var(--muted);
          font-size: 14px;
        }
        .bf-section {
          margin-top: 12px;
        }

        /* Cards */
        .bf-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin: 12px 0 16px;
        }
        .bf-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
        }
        .bf-card-label {
          font-size: 12px;
          color: var(--muted);
        }
        .bf-card-number {
          font-size: 26px;
          font-weight: 800;
          margin-top: 6px;
        }

        /* Inputs + Buttons */
        .bf-inline-form {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          margin: 8px 0 4px;
        }
        .bf-input,
        .bf-name-input,
        .bf-count-input,
        .bf-chip-input {
          appearance: none;
          background: var(--card);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 10px;
          outline: none;
          transition: box-shadow 0.12s ease, border-color 0.12s ease;
        }
        .bf-input {
          padding: 10px 12px;
          min-width: 240px;
        }
        .bf-name-input {
          padding: 8px 10px;
          width: 180px;
        }
        .bf-count-input {
          width: 70px;
          text-align: center;
          padding: 8px 10px;
        }
        .bf-chip-input {
          padding: 6px 0 6px 2px;
          background: transparent;
          border: none;
          min-width: 64px;
        }
        .bf-input:focus,
        .bf-name-input:focus,
        .bf-count-input:focus,
        .bf-chip-input:focus {
          box-shadow: var(--focus);
        }

        .bf-btn {
          border-radius: 10px;
          padding: 9px 12px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          cursor: pointer;
          transition: transform 0.04s ease, background 0.12s ease,
            border-color 0.12s ease;
        }
        .bf-btn:hover {
          transform: translateY(-0.5px);
          border-color: var(--soft-border);
        }
        .bf-btn:active {
          transform: translateY(0.5px);
        }
        .bf-btn-sm {
          padding: 6px 9px;
        }
        .bf-btn-primary {
          background: var(--primary);
          color: var(--primary-ink);
          border-color: var(--primary);
        }
        .bf-btn-danger {
          background: var(--danger-bg);
          color: var(--danger-ink);
          border-color: var(--danger-border);
        }
        .bf-btn-ghost {
          background: var(--card);
          color: var(--text);
        }
        .bf-btn-ghost-danger {
          background: transparent;
          color: var(--danger-ink);
          border-color: var(--danger-border);
        }
        .bf-btn-row {
          margin-top: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Chips */
        .bf-chips {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          list-style: none;
          padding: 0;
          margin: 10px 0 0;
        }
        .bf-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px 6px 12px;
          border-radius: 999px;
          background: var(--chip-bg);
          border: 1px solid var(--chip-ring);
        }
        .bf-chip-remove {
          border: 1px solid var(--danger-border);
          color: var(--danger-ink);
          background: var(--danger-bg);
          width: 26px;
          height: 26px;
          border-radius: 999px;
          cursor: pointer;
          line-height: 24px;
          text-align: center;
        }

        /* Table */
        .bf-scroll-x {
          overflow-x: auto;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--table-row);
          scroll-behavior: smooth;
        }
        .bf-scroll-x::-webkit-scrollbar {
          height: 10px;
        }
        .bf-scroll-x::-webkit-scrollbar-track {
          background: transparent;
        }
        .bf-scroll-x::-webkit-scrollbar-thumb {
          background: var(--chip-ring);
          border-radius: 999px;
        }

        .bf-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 780px;
        }
        thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: var(--table-head);
        }
        .bf-th,
        .bf-td {
          padding: 10px 12px;
          font-size: 14px;
          border-bottom: 1px solid var(--border);
        }
        .bf-th {
          text-align: left;
          vertical-align: bottom;
        }
        .bf-td-number {
          text-align: right;
        }
        .bf-strong {
          font-weight: 700;
        }
        .bf-sticky-left {
          position: sticky;
          left: 0;
          z-index: 3;
          background: linear-gradient(
            to right,
            var(--table-head),
            var(--table-head)
          );
        }
        tbody .bf-sticky-left {
          background: linear-gradient(to right, var(--table-row), var(--table-row));
        }
        .bf-th-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .bf-total-pill {
          font-size: 11px;
          color: var(--muted);
        }

        .bf-cell-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bf-footer {
          margin-top: 18px;
        }
      `}</style>
    </main>
  );
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
