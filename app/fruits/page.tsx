"use client";

import { useEffect, useState } from "react";
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

export default function FruitsPage() {
  const [fruits, setFruits] = useState<FruitInfo[]>([]);
  const [selected, setSelected] = useState<FruitInfo | null>(null);

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

  return (
    <main className="bf-wrap">
      <header className="bf-header" style={{ textAlign: "center" }}>
        <h1 className="bf-h1">Fruits</h1>
        <p className="bf-muted">Browse all fruits and tap to see details.</p>
      </header>

      <section
        className="bf-section"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {fruits.map((fruit) => (
          <button
            key={fruit.name}
            onClick={() => setSelected(fruit)}
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
              {fruit.name}
            </span>
          </button>
        ))}
      </section>

      {/* Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
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
              <div><b>Type:</b> {selected.type}</div>
              <div><b>Rarity:</b> {selected.rarity}</div>
              <div><b>Price:</b> {selected.price.toLocaleString()} Beli</div>
              <div><b>Robux:</b> {selected.robux_price}</div>
              {selected.awakening > 0 && (
                <div><b>Awakening:</b> {selected.awakening} Fragments</div>
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
              <button
                onClick={() => setSelected(null)}
                className="bf-btn bf-btn-danger"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
