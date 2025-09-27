"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

/* ----------------------------- Types ----------------------------- */
type NewApiSkin = {
  name: string;
  regValue?: number;
  tradable?: boolean;
  tradeable?: boolean;
  tradeadble?: boolean;
  image?: string;
  ingame_image?: string;
  robuxValue?: number;
};

type NewApiFruit = {
  name: string;
  regValue?: number;
  permValue?: number;
  robuxValue?: number;
  skins?: NewApiSkin[];
};

type NewApiGamepass = {
  name: string;
  regValue?: number;
  robuxValue?: number;
};

type Item = {
  kind: "fruit" | "gamepass";
  name: string;
  valueNumeric: number;
  valueRaw: string;
  permNumeric?: number;
  permRaw?: string;
  robuxNumeric: number;
  image: string;
};

type Slot = { id: string; item?: Item; permanent?: boolean };

const VALUES_API = "https://bfscraper.app.abledtaha.online/all";

/* ----------------------------- Helpers ----------------------------- */
const uid = () =>
  Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36);

const canon = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Compact currency format
const moneyFmt = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const money = (n: number | undefined | null) => `$${moneyFmt.format(n ?? 0)}`;

const robuxFmt = new Intl.NumberFormat();
const robux = (n: number | undefined | null) => `${robuxFmt.format(n ?? 0)} R$`;

const FRUIT_ALIASES: Record<string, string> = {
  rumble: "Lightning",
  trex: "Trex",
  t_rex: "Trex",
  trex1: "Trex",
  dragon_east: "Dragon East",
  dragoneast: "Dragon East",
  eastdragon: "Dragon East",
  dragon_west: "Dragon West",
  dragonwest: "Dragon West",
  westdragon: "Dragon West",
};

const GAMEPASS_ALIASES: Record<string, string> = {
  "2xbossdrops": "2x boss drops",
  "2xmastery": "2x mastery",
  "2xmoney": "2x money",
  darkblade: "dark blade",
  fastboats: "fast boats",
  fruitnotifier: "fruit notifier",
  "+1fruitstorage": "fruit storage",
  "1fruitstorage": "fruit storage",
  fruitstorage: "fruit storage",
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

// Collapse Dragon East/West → Dragon for skins
function normalizeSkinParent(display: string): string {
  const d = display.trim();
  return d === "Dragon East" || d === "Dragon West" ? "Dragon" : d;
}

// skins use: fruits-<parent>-<skin>.webp (with Dragon collapsed)
function skinImagePath(parentDisplay: string, skinName: string): string {
  let base = slug(normalizeSkinParent(parentDisplay));
  return `/images/fruits-${base}-${slug(skinName)}.webp`;
}

function resolveDisplayName(apiName: string, candidates: string[], aliasMap: Record<string,string>) {
  const c = canon(apiName);
  if (aliasMap[c]) return aliasMap[c];
  const hit = candidates.find((n) => canon(n) === c);
  if (hit) return hit;
  if (c === "t_rex" || c === "t-rex" || c === "trex") return "Trex";
  return apiName;
}

// normalize misspellings/variants of "tradable"
function isTradable(s: NewApiSkin): boolean {
  return Boolean(s.tradable ?? s.tradeable ?? s.tradeadble ?? false);
}

/* ----------------------------- Component ----------------------------- */
export default function TradeCalculatorPage() {
  const [your, setYour] = useState<Slot[]>(() => Array.from({ length: 4 }, () => ({ id: uid() })));
  const [wanted, setWanted] = useState<Slot[]>(() => Array.from({ length: 4 }, () => ({ id: uid() })));

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [pickerOpen, setPickerOpen] = useState<null | { side: "your" | "wanted"; index: number }>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(VALUES_API);
        const data = await res.json();

        const apiFruits: NewApiFruit[] = Array.isArray(data?.fruits) ? data.fruits : [];
        const apiGamepasses: NewApiGamepass[] = Array.isArray(data?.gamepasses) ? data.gamepasses : [];

        // Fruits
        const fruitByDisplay = new Map<string, { reg: number; perm?: number; robux: number }>();
        for (const f of apiFruits) {
          const display = resolveDisplayName(f.name, DEFAULT_FRUIT_NAMES, FRUIT_ALIASES);
          const prev = fruitByDisplay.get(display) || { reg: 0, robux: 0 };
          fruitByDisplay.set(display, {
            reg: f.regValue ?? prev.reg,
            perm: f.permValue ?? prev.perm,
            robux: f.robuxValue ?? prev.robux,
          });
        }

        // Skins
        const skinItems: Item[] = [];
        for (const f of apiFruits) {
          let parent = resolveDisplayName(f.name, DEFAULT_FRUIT_NAMES, FRUIT_ALIASES);
          parent = normalizeSkinParent(parent);
          const skins = Array.isArray(f.skins) ? f.skins : [];
          for (const s of skins) {
            if (!isTradable(s)) continue;
            const skinDisplay = `${parent} • ${s.name} (Skin)`;
            const reg = s.regValue ?? 0;
            const rb = s.robuxValue ?? 0;
            const img = skinImagePath(parent, s.name) || fruitImagePath(parent);
            skinItems.push({
              kind: "fruit",
              name: skinDisplay,
              valueNumeric: reg,
              valueRaw: money(reg),
              robuxNumeric: rb,
              image: img,
            });
          }
        }

        const fruitItems: Item[] = DEFAULT_FRUIT_NAMES.map((display) => {
          const v = fruitByDisplay.get(display) ?? { reg: 0, robux: 0 };
          return {
            kind: "fruit",
            name: display,
            valueNumeric: v.reg,
            valueRaw: money(v.reg),
            permNumeric: v.perm,
            permRaw: v.perm != null ? money(v.perm) : undefined,
            robuxNumeric: v.robux,
            image: fruitImagePath(display),
          };
        });

        // Gamepasses
        const gpLookup = new Map<string, { reg: number; robux: number }>();
        for (const gp of apiGamepasses) {
          const display = resolveDisplayName(gp.name, DEFAULT_GAMEPASSES, GAMEPASS_ALIASES);
          gpLookup.set(canon(display), { reg: gp.regValue ?? 0, robux: gp.robuxValue ?? 0 });
        }
        const gamepassItems: Item[] = DEFAULT_GAMEPASSES.map((name) => {
          const v = gpLookup.get(canon(name)) ?? { reg: 0, robux: 0 };
          return {
            kind: "gamepass",
            name,
            valueNumeric: v.reg,
            valueRaw: money(v.reg),
            robuxNumeric: v.robux,
            image: gamepassImagePath(name),
          };
        });

        const combined = [...fruitItems, ...skinItems, ...gamepassItems];
        if (alive) setAllItems(combined);
      } catch {
        const fruitItems: Item[] = DEFAULT_FRUIT_NAMES.map((display) => ({
          kind: "fruit",
          name: display,
          valueNumeric: 0,
          valueRaw: money(0),
          robuxNumeric: 0,
          image: fruitImagePath(display),
        }));
        const gamepassItems: Item[] = DEFAULT_GAMEPASSES.map((name) => ({
          kind: "gamepass",
          name,
          valueNumeric: 0,
          valueRaw: money(0),
          robuxNumeric: 0,
          image: gamepassImagePath(name),
        }));
        if (alive) setAllItems([...fruitItems, ...gamepassItems]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
  const getSlotRobux = (s: Slot) => (s.item ? s.item.robuxNumeric : 0);

  const yourTotal = useMemo(() => your.reduce((sum, s) => sum + getSlotValue(s), 0), [your]);
  const wantedTotal = useMemo(() => wanted.reduce((sum, s) => sum + getSlotValue(s), 0), [wanted]);
  const yourRobux = useMemo(() => your.reduce((sum, s) => sum + getSlotRobux(s), 0), [your]);
  const wantedRobux = useMemo(() => wanted.reduce((sum, s) => sum + getSlotRobux(s), 0), [wanted]);

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
                        <div className="tc-chip-val">
                          {slot.item.valueRaw}
                          {slot.item.robuxNumeric > 0 && <div>{robux(slot.item.robuxNumeric)}</div>}
                        </div>
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
            <div>Value: <strong>{money(yourTotal)}</strong></div>
            <div>Robux: <strong>{robux(yourRobux)}</strong></div>
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
                        <div className="tc-chip-val">
                          {slot.item.valueRaw}
                          {slot.item.robuxNumeric > 0 && <div>{robux(slot.item.robuxNumeric)}</div>}
                        </div>
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
            <div>Value: <strong>{money(wantedTotal)}</strong></div>
            <div>Robux: <strong>{robux(wantedRobux)}</strong></div>
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
                    {it.robuxNumeric != null && it.robuxNumeric > 0 && (
                      <div>Robux: {robux(it.robuxNumeric)}</div>
                    )}
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
                  <div className="tc-li-val">
                    <div>Value: {it.valueRaw}</div>
                    {it.robuxNumeric != null && it.robuxNumeric > 0 && (
                      <div>Robux: {robux(it.robuxNumeric)}</div>
                    )}
                  </div>
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