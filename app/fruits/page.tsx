"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type UpgradeItem = { amount: number; name: string };
type Skin = {
  chromatic: boolean;
  image: string;
  ingame_image: string;
  name: string;
  obtainment: string;
  rarity: string;
};
type FruitInfo = {
  awakening: number;
  image: string;
  name: string;
  price: number;
  rarity: string;
  robux_price: number;
  skins: Skin[];
  type: string;
  upgrading: UpgradeItem[];
};

const API_URL = "https://bfscraper.app.abledtaha.online/info";

function fruitImagePath(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  if (slug === "t-rex") return "/images/fruits-t-rex.webp";
  if (slug === "dragon") return "/images/fruits-dragon-west.webp";
  if (slug === "lightning") return "/images/fruits-rumble.webp";
  return `/images/fruits-${slug}.webp`;
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFKD");
}
function highlight(text: string, q: string) {
  if (!q) return text;
  const t = text;
  const idx = t.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {t.slice(0, idx)}
      <mark>{t.slice(idx, idx + q.length)}</mark>
      {t.slice(idx + q.length)}
    </>
  );
}

export default function FruitsPage() {
  const router = useRouter();
  const [fruits, setFruits] = useState<FruitInfo[]>([]);
  const [selected, setSelected] = useState<FruitInfo | null>(null);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fruits.length === 0) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const qp = params.get("fruit");
    if (!qp) return;

    const found = fruits.find(
      (f) => f.name.toLowerCase() === qp.toLowerCase()
    );
    if (found) setSelected(found);
  }, [fruits]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(API_URL);
        const data: FruitInfo[] = await res.json();
        setFruits(data);
      } catch (err) {
        console.error("Failed to fetch fruits:", err);
      }
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = norm(query).trim();
    if (!q) return fruits;
    return fruits.filter((f) => {
      const hay = `${f.name} ${f.type} ${f.rarity}`;
      return norm(hay).includes(q);
    });
  }, [fruits, query]);

  return (
    <main className="bf-wrap">
      <header className="bf-header" style={{ textAlign: "center" }}>
        <h1 className="bf-h1">Fruits</h1>
        <p className="bf-muted">Browse all fruits and tap to see details.</p>
      </header>

      {/* Search */}
      <section className="bf-section" aria-label="Search fruits">
        <div className="bf-inline-form" style={{ gap: 8 }}>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, type, or rarity…"
            aria-label="Search fruits"
            className="bf-input"
          />
          {query && (
            <button className="bf-btn" onClick={() => setQuery("")} title="Clear">
              Clear
            </button>
          )}
          <div className="bf-card" style={{ padding: "6px 10px", marginLeft: "auto" }}>
            <div className="bf-card-label">Showing</div>
            <div className="bf-card-number">
              {filtered.length}/{fruits.length}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section
        className="bf-section"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((fruit) => (
          <button
            key={fruit.name}
            onClick={() => {
              setSelected(fruit);
              router.replace(
                `${typeof window !== "undefined" ? window.location.pathname : "/fruits"}?fruit=${encodeURIComponent(fruit.name)}`,
                { scroll: false }
              );
            }}
            style={{
              borderRadius: 14,
              background: "#1e2a38",
              border: "1px solid #121923",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div style={{ width: 80, height: 80, position: "relative" }}>
              <Image
                src={fruitImagePath(fruit.name)}
                alt={fruit.name}
                fill
                sizes="80px"
                style={{ objectFit: "contain" }}
              />
            </div>
            <span
              style={{
                marginTop: 8,
                fontWeight: 700,
                color: "#fff",
                fontSize: 14,
              }}
            >
              {highlight(fruit.name, query)}
            </span>
            <span className="bf-muted" style={{ fontSize: 12, marginTop: 4 }}>
              {fruit.rarity} • {fruit.type}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="bf-muted" style={{ gridColumn: "1/-1" }}>
            No fruits match “{query}”.
          </p>
        )}
      </section>

      {/* Modal */}
      {selected && (
        <div
          onClick={() => {
            setSelected(null);
            router.replace(
              `${typeof window !== "undefined" ? window.location.pathname : "/fruits"}`,
              { scroll: false }
            );
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e2a38",
              border: "1px solid #121923",
              borderRadius: 14,
              padding: 20,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 64, height: 64, position: "relative" }}>
                <Image
                  src={fruitImagePath(selected.name)}
                  alt={selected.name}
                  fill
                  sizes="64px"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
                {selected.name}
              </h2>
            </div>

            <div style={{ marginTop: 12, fontSize: 14, color: "#cfd9ff" }}>
              <div>
                <b>Type:</b> {selected.type}
              </div>
              <div>
                <b>Rarity:</b> {selected.rarity}
              </div>
              <div>
                <b>Price:</b> {selected.price.toLocaleString()} Beli
              </div>
              <div>
                <b>Robux:</b> {selected.robux_price}
              </div>
              {selected.awakening > 0 && (
                <div>
                  <b>Awakening:</b> {selected.awakening} Fragments
                </div>
              )}
            </div>

            {selected.upgrading.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <b style={{ color: "#fff" }}>Upgrading:</b>
                <ul style={{ margin: "6px 0 0 16px", color: "#c4cad5" }}>
                  {selected.upgrading.map((u, i) => (
                    <li key={i}>
                      {u.amount.toLocaleString()} {u.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.skins.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <b style={{ color: "#fff" }}>Skins:</b>
                <ul style={{ margin: "6px 0 0 16px", color: "#c4cad5" }}>
                  {selected.skins.map((s, i) => (
                    <li key={i}>
                      <Link
                        href={{
                          pathname: "/fruits/skins",
                          query: {
                            fruit: selected.name,
                            skin: s.name,
                          },
                        }}
                        style={{ color: "#9ecbff", textDecoration: "underline" }}
                        title={`View ${s.name} for ${selected.name}`}
                        prefetch={false}
                      >
                        {s.name}
                      </Link>{" "}
                      <span style={{ opacity: 0.7 }}>({s.rarity})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button onClick={() => {
                setSelected(null);
                router.replace(
                  `${typeof window !== "undefined" ? window.location.pathname : "/fruits"}`,
                  { scroll: false }
                );
              }}
              className="bf-btn bf-btn-danger">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
