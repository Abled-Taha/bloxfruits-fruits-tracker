"use client";

export default function ResourcesPage() {
  const resources = [
    {
      name: "RDD Tools",
      url: "https://rdd.weao.gg",
      description:
        "A community-driven version manager for Roblox.",
    },
    {
      name: "Roblox Account Manager",
      url: "https://github.com/ic3w0lf22/Roblox-Account-Manager",
      description:
        "An open-source tool to easily manage multiple Roblox accounts, available via GitHub.",
    },
    {
      name: "Blox Fruits Wiki",
      url: "https://blox-fruits.fandom.com",
      description:
        "The official fan-maintained wiki for Blox Fruits. Contains fruit details, updates, and strategies.",
    },
    {
      name: "Roblox Dev Forum",
      url: "https://devforum.roblox.com",
      description:
        "Official Roblox developer forum with guides, announcements, and community help.",
    },
    {
      name: "Get Stock Pings",
      url: "https://discord.gg/92qhRJjKrQ",
      description:
        "Join our Discord server for pings on the fruits of your choice when they are in stock.",
    },
  ];

  return (
    <main className="bf-wrap">
      <header className="bf-header" style={{ textAlign: "center" }}>
        <h1 className="bf-h1">Resources</h1>
        <p className="bf-muted">
          Useful external links and tools for Blox Fruits and Roblox.
        </p>
      </header>

      <section
        className="bf-section"
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        }}
      >
        {resources.map((res, i) => (
          <a
            key={i}
            href={res.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: 16,
              borderRadius: 14,
              background: "#1e2a38",
              border: "1px solid #121923",
              textDecoration: "none",
              transition: "transform 0.12s ease, box-shadow 0.2s ease",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 6,
              }}
            >
              {res.name}
            </h2>
            <p style={{ fontSize: 14, color: "#cfd9ff", lineHeight: 1.4 }}>
              {res.description}
            </p>
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: "#9ecbff",
                textDecoration: "underline",
              }}
            >
              Visit →
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
