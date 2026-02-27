import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getTenant } from "@/lib/tenant/server";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  const companyName = tenant?.companyName ?? "COVOS";
  return {
    title: `${companyName} — Territory Map`,
    description: `Initial territory definitions for ${companyName} sales partners. Phase 1: 4 territories, land grab advantage.`,
  };
}

// Palette cycles for territories that don't have a hardcoded color
const COLORS = ["#2563eb", "#7c3aed", "#059669", "#dc2626", "#d97706", "#0891b2"];

const verticalTerritory = {
  id: "V1",
  name: "National Vertical (by arrangement)",
  color: "#92400e",
  status: "By arrangement",
  description:
    "For reps with proven industry-specific networks (e.g., dental practices, HVAC chains, franchise groups). National scope, single vertical. Requires demonstrated vertical relationships. Granted instead of geographic territory — not in addition to.",
};

export default async function TerritoryMapPage() {
  const tenant = await getTenant();
  const companyName = tenant?.companyName ?? "COVOS";

  // Pull live territories from DB — only active ones, ordered by creation date
  const dbTerritories = await prisma.territory.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, cities: true, states: true },
  });

  const territories = dbTerritories.map((t, i) => ({
    id: `T${t.id}`,
    name: t.name,
    color: COLORS[i % COLORS.length],
    status: "Available",
    states: t.states,
    cities: t.cities,
  }));


  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* HEADER */}
      <section style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        color: "white", padding: "56px 32px 48px", textAlign: "center",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", opacity: 0.5, marginBottom: 16 }}>
          {companyName}
        </p>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 16px" }}>
          Phase 1 Territory Map
        </h1>
        <p style={{ fontSize: 17, opacity: 0.8, maxWidth: 520, margin: "0 auto" }}>
          {territories.length} {territories.length === 1 ? "territory" : "territories"} available. First reps get first pick. Exclusively yours as long as production threshold is met.
        </p>
      </section>

      {/* RULES STRIP */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
          {[
            { label: "Production threshold", value: "2 closes/mo (90-day rolling avg)" },
            { label: "Claiming method", value: `First ${territories.length} reps · first pick` },
            { label: "Territory type", value: "Geographic (default) or National Vertical" },
            { label: "Client ownership", value: "Permanent — never moves with territory" },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e3a5f" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TERRITORY CARDS */}
      <section style={{ padding: "56px 24px", maxWidth: 960, margin: "0 auto" }}>
        {territories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>No territories configured yet.</p>
            <p style={{ fontSize: 14 }}>Add territories in Settings → Territory Management to populate this page.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 24 }}>
            {territories.map((t) => (
              <div key={t.id} style={{
                borderRadius: 14, border: `2px solid ${t.color}`, overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}>
                {/* Card header */}
                <div style={{ background: t.color, color: "white", padding: "20px 24px",
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, letterSpacing: 2 }}>{t.id}</span>
                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 0" }}>{t.name}</h3>
                  </div>
                  <span style={{
                    background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700,
                  }}>{t.status}</span>
                </div>

                {/* Card body */}
                <div style={{ padding: "24px" }}>
                  {t.states.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                        States
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {t.states.map((s) => (
                          <span key={s} style={{
                            background: `${t.color}14`, border: `1px solid ${t.color}40`,
                            color: t.color, borderRadius: 20, padding: "3px 12px", fontSize: 13, fontWeight: 600,
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {t.cities.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                        Key Cities
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {t.cities.map((city) => (
                          <span key={city} style={{
                            background: `${t.color}14`, border: `1px solid ${t.color}40`,
                            color: t.color, borderRadius: 20, padding: "3px 12px", fontSize: 13, fontWeight: 500,
                          }}>{city}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VERTICAL TERRITORY */}
        <div style={{
          marginTop: 24, borderRadius: 14, border: `2px dashed ${verticalTerritory.color}`,
          overflow: "hidden",
        }}>
          <div style={{ background: verticalTerritory.color, color: "white", padding: "18px 24px",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, letterSpacing: 2 }}>{verticalTerritory.id}</span>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 0" }}>{verticalTerritory.name}</h3>
            </div>
            <span style={{
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700,
            }}>{verticalTerritory.status}</span>
          </div>
          <div style={{ padding: "20px 24px", background: "#fffbeb" }}>
            <p style={{ fontSize: 14, color: "#78350f", lineHeight: 1.65, margin: 0 }}>{verticalTerritory.description}</p>
          </div>
        </div>
      </section>

      {/* PHASE ROADMAP */}
      <section style={{ background: "#f1f5f9", padding: "56px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, textAlign: "center", marginBottom: 36 }}>Territory Evolution</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              {
                phase: "Phase 1", subtitle: "1–4 Reps", color: "#2563eb",
                items: ["Large territories", "First pick land grab", "Lots of room to build", "Shared leads during ramp"],
              },
              {
                phase: "Phase 2", subtitle: "5–10 Reps", color: "#7c3aed",
                items: ["Territories may split", "Original rep picks which half to keep", "New reps fill gaps", "Lead routing tightens"],
              },
              {
                phase: "Phase 3", subtitle: "10+ Reps", color: "#059669",
                items: ["Granular boundaries", "Formalized map", "Strong inbound lead flow", "Vertical specialists possible"],
              },
            ].map((phase) => (
              <div key={phase.phase} style={{ background: "white", borderRadius: 12, padding: "24px",
                borderTop: `4px solid ${phase.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: phase.color, textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 4 }}>{phase.phase}</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>{phase.subtitle}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {phase.items.map((item) => (
                    <li key={item} style={{ fontSize: 14, color: "#475569", display: "flex", gap: 8, marginBottom: 10 }}>
                      <span style={{ color: phase.color, fontWeight: 700 }}>·</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, padding: "18px 24px", background: "#eff6ff", borderRadius: 10,
            border: "1px solid #bfdbfe", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#1e40af", fontWeight: 600, margin: 0 }}>
              Cardinal rule: A rep NEVER loses a client they closed, even if territory lines shift.
              Territory determines prospecting rights — not existing client ownership.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "56px 24px", textAlign: "center",
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", color: "white" }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>Which Territory Do You Want?</h2>
        <p style={{ opacity: 0.8, fontSize: 16, maxWidth: 460, margin: "0 auto 24px" }}>
          {territories.length} {territories.length === 1 ? "territory" : "territories"} available. First reps get first pick. Territories fill in order of signing.
        </p>
        <p style={{ opacity: 0.6, fontSize: 14 }}>Contact us to reserve your territory and discuss next steps.</p>
      </section>

      <footer style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
        {companyName} · Phase 1 Territory Map · Subject to revision as team scales
      </footer>
    </div>
  );
}
