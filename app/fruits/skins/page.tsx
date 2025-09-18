"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

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
  rarity: string;
  price: number;
  robux_price: number;
  awakening: number;
  skins: Skin[];
  upgrading: { amount: number; name: string }[];
};

const API_URL = "https://bfscraper.app.abledtaha.online/info";

function fruitImagePath(name: string, skinName?: string): string {
  const base = "/images/";
  const normalize = (str: string) =>
    str.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");

  const fruitFile = `fruits-${normalize(name)}`;
  if (skinName) {
    if (skinName === "White") {
      return '/images/NA.webp';
    }
    return `${base}${fruitFile}-${normalize(skinName)}.webp`;
  }
  return `${base}${fruitFile}.webp`;
}

export default function SkinsPage() {
  const [fruits, setFruits] = useState<FruitInfo[]>([]);
  const [selected, setSelected] = useState<{ fruit: FruitInfo; skin: Skin } | null>(null);

  const searchParams = useSearchParams();
  const fruitParam = searchParams.get("fruit");
  const skinParam = searchParams.get("skin");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(API_URL);
        const data: FruitInfo[] = await res.json();
        const withSkins = data.filter((f) => f.skins && f.skins.length > 0);
        setFruits(withSkins);

        // Auto-select if params are present
        if (fruitParam && skinParam) {
          const fruit = withSkins.find(
            (f) => f.name.toLowerCase() === fruitParam.toLowerCase()
          );
          const skin = fruit?.skins.find(
            (s) => s.name.toLowerCase() === skinParam.toLowerCase()
          );
          if (fruit && skin) {
            setSelected({ fruit, skin });
          }
        }
      } catch (err) {
        console.error("Failed to fetch skins:", err);
      }
    }
    fetchData();
  }, [fruitParam, skinParam]);

  const entries = fruits.flatMap((fruit) =>
    fruit.skins.map((skin) => ({ fruit, skin }))
  );

  return (
    <main className="bf-wrap">
      <header className="bf-header" style={{ textAlign: "center" }}>
        <h1 className="bf-h1">Fruit Skins</h1>
        <p className="bf-muted">Browse all skins. Click to see full details.</p>
      </header>

      {entries.length === 0 ? (
        <p className="bf-muted">No skins found.</p>
      ) : (
        <section
          className="bf-section"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {entries.map(({ fruit, skin }, i) => (
            <button
              key={`${fruit.name}-${skin.name}-${i}`}
              onClick={() => setSelected({ fruit, skin })}
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
                  src={fruitImagePath(fruit.name, skin.name)}
                  alt={`${fruit.name} - ${skin.name}`}
                  fill
                  sizes="80px"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <span style={{ marginTop: 6, fontWeight: 700, color: "#fff" }}>
                {skin.name}
              </span>
              <span style={{ fontSize: 12, color: "#cfd9ff" }}>{fruit.name}</span>
            </button>
          ))}
        </section>
      )}

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
                  src={fruitImagePath(selected.fruit.name, selected.skin.name)}
                  alt={`${selected.fruit.name} - ${selected.skin.name}`}
                  fill
                  sizes="64px"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
                {selected.skin.name}
              </h2>
            </div>

            <div style={{ marginTop: 12, fontSize: 14, color: "#cfd9ff" }}>
              <div><b>Fruit:</b> {selected.fruit.name}</div>
              <div><b>Rarity:</b> {selected.skin.rarity}</div>
              <div><b>Chromatic:</b> {selected.skin.chromatic ? "Yes" : "No"}</div>
              {selected.skin.obtainment && (
                <div style={{ marginTop: 8 }}>
                  <b>Obtainment:</b> {selected.skin.obtainment}
                </div>
              )}
            </div>

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
