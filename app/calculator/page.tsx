"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

/* ----------------------------- Types ----------------------------- */
type FruitValue = { numeric: number; raw: string };
type ApiFruit = { name: string; values?: FruitValue[] };
type ApiGamepass = { name: string; values?: FruitValue[] };

type Item = {
  kind: "fruit" | "gamepass";
  name: string;
  // normal (values[0])
  valueNumeric: number;
  valueRaw: string;
  // permanent (values[1]) - fruits only
  permNumeric?: number;
  permRaw?: string;
  image: string; // /images/*.webp
};

type Slot = { id: string; item?: Item; permanent?: boolean };

const VALUES_API = "https://bfscraper.app.abledtaha.online/fruits";
// const VALUES_API = "http://localhost:5000/fruits";

/* ----------------------------- Helpers ----------------------------- */
const uid = () =>
  Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36);

const canon = (s: string) => s.toLowerCase().replace(/[\s_\-]/g, "").trim();
const toCamel = (s: string) =>
  s
    .toLowerCase()
    .replace(/[-_\s]+(.)/g, (_m, c: string) => c.toUpperCase())
    .replace(/^(.)/, (m) => m.toLowerCase());

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** REQUIRED by you */
const API_ALIASES: Record<string, string> = {
  rumble: "Lightning",
  trex: "Trex",
  "t-rex": "Trex",
  dragonEast: "Dragon East",
  dragonWest: "Dragon West",
};

const DEFAULT_FRUIT_NAMES = [
  "Dragon East","Dragon West","Kitsune","Yeti","Leopard","Spirit","Gas","Control","Venom","Shadow","Dough",
  "Trex","Mammoth","Gravity","Blizzard","Pain","Lightning","Portal","Phoenix","Sound",
  "Spider","Creation","Love","Buddha","Quake","Magma","Ghost","Rubber","Light","Diamond",
  "Eagle","Dark","Sand","Ice","Flame","Spike","Smoke","Bomb","Spring","Blade","Spin","Rocket",
];

const DEFAULT_GAMEPASSES = [
  "2x boss drops",
  "2x mastery",
  "2x money",
  "dark blade",
  "fast boats",
  "fruit notifier",
  "fruit storage",
];

/** Local image paths */
function fruitImagePath(displayName: string): string {
  if (displayName === "Lightning") return "/images/fruits-rumble.webp";
  if (displayName === "Trex") return "/images/fruits-t-rex.webp";
  if (displayName === "Dragon East") return "/images/fruits-dragon-east.webp";
  if (displayName === "Dragon West") return "/images/fruits-dragon-west.webp";
  return `/images/fruits-${slug(displayName)}.webp`;
}
function gamepassImagePath(name: string): string {
  return `/images/gamepasses-${slug(name)}.webp`;
}

/* ----------------------------- Component ----------------------------- */
export default function TradeCalculatorPage() {
  // 4 slots per side
  const [your, setYour] = useState<Slot[]>(
    () => Array.from({ length: 4 }, () => ({ id: uid() }))
  );
  const [wanted, setWanted] = useState<Slot[]>(
    () => Array.from({ length: 4 }, () => ({ id: uid() }))
  );

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [pickerOpen, setPickerOpen] =
    useState<null | { side: "your" | "wanted"; index: number }>(null);
  const [query, setQuery] = useState("");

  /* -------- Fetch values (FIRST values[0], PERM = values[1]) -------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(VALUES_API);
        const data = await res.json();

        const apiFruits: ApiFruit[] = Array.isArray(data?.fruits)
          ? data.fruits
          : [];
        const apiGamepasses: ApiGamepass[] = Array.isArray(data?.gamepasses)
          ? data.gamepasses
          : [];

        // Build display-name → {v0, v1} map (no merging; East/West are separate)
        const byDisplay = new Map<
          string,
          { v0?: FruitValue; v1?: FruitValue }
        >();

        for (const af of apiFruits) {
          const keyCamel = toCamel(af.name);
          const keyCanon = canon(af.name);
          const display =
            API_ALIASES[keyCamel] ||
            API_ALIASES[keyCanon] ||
            DEFAULT_FRUIT_NAMES.find((n) => canon(n) === keyCanon) ||
            null;
          if (!display) continue;

          const v0 =
            Array.isArray(af.values) && af.values.length > 0
              ? af.values[0]
              : undefined;
          const v1 =
            Array.isArray(af.values) && af.values.length > 1
              ? af.values[1]
              : undefined;

          byDisplay.set(display, { v0, v1 });
        }

        // Fruits in preferred order; default 0s if missing
        const fruitItems: Item[] = DEFAULT_FRUIT_NAMES.map((display) => {
          const v = byDisplay.get(display);
          return {
            kind: "fruit",
            name: display,
            valueNumeric: v?.v0?.numeric ?? 0,
            valueRaw: v?.v0?.raw ?? "0",
            permNumeric: v?.v1?.numeric,
            permRaw: v?.v1?.raw,
            image: fruitImagePath(display),
          };
        });

        // Gamepasses (values[1] doesn't exist)
        const gpLookup = new Map<string, FruitValue>();
        for (const gp of apiGamepasses) {
          const v0 =
            Array.isArray(gp.values) && gp.values.length > 0
              ? gp.values[0]
              : undefined;
          if (v0) gpLookup.set(gp.name, v0);
        }
        const gamepassItems: Item[] = DEFAULT_GAMEPASSES.map((name) => {
          const v = gpLookup.get(name);
          return {
            kind: "gamepass",
            name,
            valueNumeric: v?.numeric ?? 0,
            valueRaw: v?.raw ?? "0",
            image: gamepassImagePath(name),
          };
        });

        const combined = [...fruitItems, ...gamepassItems];
        if (alive) setAllItems(combined);
      } catch {
        // Fallback: still show items with 0 values so UI works offline/CORS
        const fruitItems: Item[] = DEFAULT_FRUIT_NAMES.map((display) => ({
          kind: "fruit",
          name: display,
          valueNumeric: 0,
          valueRaw: "0",
          image: fruitImagePath(display),
        }));
        const gamepassItems: Item[] = DEFAULT_GAMEPASSES.map((name) => ({
          kind: "gamepass",
          name,
          valueNumeric: 0,
          valueRaw: "0",
          image: gamepassImagePath(name),
        }));
        if (alive) setAllItems([...fruitItems, ...gamepassItems]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ----------------------------- Derived ----------------------------- */
  const filtered = useMemo(() => {
    const q = canon(query);
    if (!q) return allItems;
    return allItems.filter((it) => canon(it.name).includes(q));
  }, [allItems, query]);

  const getSlotValue = (s: Slot) => {
    if (!s.item) return 0;
    if (s.permanent && s.item.permNumeric != null) return s.item.permNumeric;
    return s.item.valueNumeric;
  };
  const getSlotRaw = (s: Slot) => {
    if (!s.item) return "0";
    if (s.permanent && s.item.permRaw) return s.item.permRaw;
    return s.item.valueRaw;
  };

  const yourTotal = useMemo(
    () => your.reduce((sum, s) => sum + getSlotValue(s), 0),
    [your]
  );
  const wantedTotal = useMemo(
    () => wanted.reduce((sum, s) => sum + getSlotValue(s), 0),
    [wanted]
  );

  /* ----------------------------- Actions ----------------------------- */
  function setSlot(side: "your" | "wanted", index: number, item?: Item) {
    const setter = side === "your" ? setYour : setWanted;
    const list = side === "your" ? your : wanted;
    const copy = list.slice();
    copy[index] = { ...copy[index], item, permanent: false };
    setter(copy);
  }

  function togglePerm(side: "your" | "wanted", index: number) {
    const setter = side === "your" ? setYour : setWanted;
    const list = side === "your" ? your : wanted;
    const s = list[index];
    if (!s.item || s.item.kind !== "fruit" || s.item.permNumeric == null) return;
    const copy = list.slice();
    copy[index] = { ...s, permanent: !s.permanent };
    setter(copy);
  }

  function swapSides() {
    setYour(wanted.map((s) => ({ id: uid(), item: s.item, permanent: s.permanent })));
    setWanted(your.map((s) => ({ id: uid(), item: s.item, permanent: s.permanent })));
  }

  /* ----------------------------- Render ----------------------------- */
  return (
    <main className="bf-wrap">
      <header className="tc-header">
        <h1 className="tc-title">Trading Calculator</h1>
        <p className="tc-sub">
          Add up to 4 items on each side of the trade. Click on any item to remove it. Toggle <em>Permanent</em> on fruits that support it.
        </p>
      </header>

      <section className="tc-grid">
        {/* LEFT: Your Items */}
        <div className="tc-column">
          <div className="tc-pill tc-pill-left">Your Items</div>
          <div className="tc-slots">
            {your.map((slot, i) => (
              <div key={slot.id} className="tc-slot-wrap">
                <button
                  className={`tc-slot ${slot.item ? "tc-slot-filled" : ""}`}
                  onClick={() =>
                    slot.item
                      ? setSlot("your", i, undefined)
                      : setPickerOpen({ side: "your", index: i })
                  }
                  title={slot.item ? "Click to remove" : "Add Item"}
                >
                  {slot.item ? (
                    <div className="tc-chip">
                      <Image src={slot.item.image} alt="" className="tc-chip-img" width={40} height={40}/>
                      <div className="tc-chip-text">
                        <div className="tc-chip-name">
                          {slot.item.name}
                          {slot.permanent && <span className="tc-perm-badge">PERM</span>}
                        </div>
                        <div className="tc-chip-val">{getSlotRaw(slot)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="tc-empty">
                      <div className="tc-plus">+</div>
                      <div>Add Item</div>
                    </div>
                  )}
                </button>

                {/* per-slot Permanent toggle (fruits only with values[1]) */}
                {slot.item?.kind === "fruit" && slot.item.permNumeric != null && (
                  <button
                    className={`tc-toggle ${slot.permanent ? "tc-toggle-on" : ""}`}
                    onClick={(e) => { e.stopPropagation(); togglePerm("your", i); }}
                    title="Toggle permanent value"
                  >
                    Permanent
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="tc-footer">
            <div>Value: <strong>${yourTotal.toLocaleString()}</strong></div>
          </div>
        </div>

        {/* SWAP BUTTON */}
        <div className="tc-swap-wrap">
          <button className="tc-swap" onClick={swapSides} aria-label="Swap sides">⇆</button>
        </div>

        {/* RIGHT: Wanted Items */}
        <div className="tc-column">
          <div className="tc-pill tc-pill-right">Wanted Items</div>
          <div className="tc-slots">
            {wanted.map((slot, i) => (
              <div key={slot.id} className="tc-slot-wrap">
                <button
                  className={`tc-slot ${slot.item ? "tc-slot-filled" : ""}`}
                  onClick={() =>
                    slot.item
                      ? setSlot("wanted", i, undefined)
                      : setPickerOpen({ side: "wanted", index: i })
                  }
                  title={slot.item ? "Click to remove" : "Add Item"}
                >
                  {slot.item ? (
                    <div className="tc-chip">
                      <Image src={slot.item.image} alt="" className="tc-chip-img" width={40} height={40}/>
                      <div className="tc-chip-text">
                        <div className="tc-chip-name">
                          {slot.item.name}
                          {slot.permanent && <span className="tc-perm-badge">PERM</span>}
                        </div>
                        <div className="tc-chip-val">{getSlotRaw(slot)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="tc-empty">
                      <div className="tc-plus">+</div>
                      <div>Add Item</div>
                    </div>
                  )}
                </button>

                {slot.item?.kind === "fruit" && slot.item.permNumeric != null && (
                  <button
                    className={`tc-toggle ${slot.permanent ? "tc-toggle-on" : ""}`}
                    onClick={(e) => { e.stopPropagation(); togglePerm("wanted", i); }}
                    title="Toggle permanent value"
                  >
                    Permanent
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="tc-footer">
            <div>Value: <strong>${wantedTotal.toLocaleString()}</strong></div>
          </div>
        </div>
      </section>

      {/* ---------- Picker Overlay ---------- */}
      {pickerOpen && (
        <div className="tc-modal" role="dialog" aria-modal="true">
          <div className="tc-modal-card">
            <div className="tc-modal-head">
              <div className="tc-modal-title">Add Item</div>
              <button className="tc-close" onClick={() => setPickerOpen(null)} aria-label="Close">×</button>
            </div>

            <input
              className="tc-input"
              placeholder="Search fruits & gamepasses…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />

            <div className="tc-group-title">Fruits</div>
            <div className="tc-list">
              {filtered.filter(i => i.kind === "fruit").map((it) => (
                <button
                  key={`f-${it.name}`}
                  className="tc-list-item"
                  onClick={() => {
                    if (pickerOpen) {
                      setSlot(pickerOpen.side, pickerOpen.index, it);
                      setPickerOpen(null);
                      setQuery("");
                    }
                  }}
                >
                  <div className="tc-li-left">
                    <Image src={it.image} alt="" className="tc-li-img" width={40} height={40}/>
                    <div className="tc-li-name">{it.name}</div>
                  </div>
                  <div className="tc-li-val">
                    <div>Normal: {it.valueRaw}</div>
                    {it.permRaw && <div>Perm: {it.permRaw}</div>}
                  </div>
                </button>
              ))}
              {filtered.filter(i => i.kind === "fruit").length === 0 && (
                <div className="tc-empty-state">No matching fruits</div>
              )}
            </div>

            <div className="tc-group-title mt-4">Gamepasses</div>
            <div className="tc-list">
              {filtered.filter(i => i.kind === "gamepass").map((it) => (
                <button
                  key={`g-${it.name}`}
                  className="tc-list-item"
                  onClick={() => {
                    if (pickerOpen) {
                      setSlot(pickerOpen.side, pickerOpen.index, it);
                      setPickerOpen(null);
                      setQuery("");
                    }
                  }}
                >
                  <div className="tc-li-left">
                    <Image src={it.image} alt="" className="tc-li-img" width={40} height={40}/>
                    <div className="tc-li-name">{it.name}</div>
                  </div>
                  <div className="tc-li-val">Value: {it.valueRaw}</div>
                </button>
              ))}
              {filtered.filter(i => i.kind === "gamepass").length === 0 && (
                <div className="tc-empty-state">No matching gamepasses</div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
