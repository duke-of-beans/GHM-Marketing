import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant/server";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  const companyName = tenant?.companyName ?? "COVOS";
  return {
    title: `${companyName} — Sales Partner Opportunity`,
    description:
      "Commission-only sales partner opportunity. Claim your territory. Build residual income to $200K+ by month 18. No account management. We provide leads.",
  };
}

export default async function CompSheetPage() {
  const tenant = await getTenant();
  const companyName = tenant?.companyName ?? "COVOS";
  const months = [1, 2, 3, 6, 9, 12, 15, 18];
  const churnRate = 0.03;
  const closesPerMonth = 4;
  const residualPerClient = 250;
  const closeBonusPerMonth = closesPerMonth * 1000;

  function activeClients(month: number) {
    let clients = 0;
    for (let m = 1; m <= month; m++) {
      clients = clients * (1 - churnRate) + closesPerMonth;
    }
    return Math.round(clients * 10) / 10;
  }

  const rows = months.map((m) => {
    const ac = activeClients(m);
    const residual = Math.round(ac * residualPerClient);
    const total = closeBonusPerMonth + residual;
    return { month: m, clients: ac, residual, closes: closeBonusPerMonth, total };
  });

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* HERO */}
      <section style={{
        background: "linear-gradient(135deg, #0f2027 0%, #1e3a5f 50%, #2563eb 100%)",
        color: "white", padding: "72px 32px 56px", textAlign: "center",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", opacity: 0.5, marginBottom: 16 }}>
          {companyName}
        </p>
        <h1 style={{ fontSize: "clamp(30px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 20px" }}>
          Claim Your Territory.<br />Build Real Residual Income.
        </h1>
        <p style={{ fontSize: 19, opacity: 0.8, maxWidth: 540, margin: "0 auto 36px" }}>
          Commission-only sales partner. No salary needed — the math speaks for itself.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          {["$200K+ by month 18", "No account management", "We feed you leads"].map((tag) => (
            <span key={tag} style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 40, padding: "8px 20px", fontSize: 14, fontWeight: 600,
            }}>{tag}</span>
          ))}
        </div>
      </section>

      {/* THE MATH */}
      <section style={{ padding: "64px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>
          The Math (4 Closes/Month · 3% Monthly Churn)
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: 40, fontSize: 15 }}>
          Conservative projections. Real numbers. No fluff.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr style={{ background: "#1e3a5f", color: "white" }}>
                {["Month", "Active Clients", "Close Bonuses", "Residual Income", "Total Monthly"].map((h, i) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: i === 0 ? "left" : "right", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.month} style={{ background: i % 2 === 0 ? "#f8fafc" : "white", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700 }}>Month {row.month}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right", color: "#1e3a5f", fontWeight: 600 }}>{row.clients}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>${row.closes.toLocaleString()}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right", color: "#2563eb", fontWeight: 600 }}>
                    ${row.residual.toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, fontSize: 17,
                    color: row.month >= 12 ? "#16a34a" : "inherit" }}>
                    ${row.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: "#94a3b8", marginTop: 16 }}>
          Residual rate assumes $250/client (4–6 closes/month tier). Service commission income not included — add ~$700/mo if 50% of closes include a basic website build.
        </p>

        {/* STACKED BAR CHART */}
        <div style={{ marginTop: 52 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, textAlign: "center" }}>Income Composition Over Time</h3>
          {rows.map((row) => {
            const closesPct = Math.round((row.closes / row.total) * 100);
            const residualPct = 100 - closesPct;
            return (
              <div key={row.month} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>Month {row.month}</span>
                  <span style={{ fontWeight: 700, color: row.month >= 12 ? "#16a34a" : "inherit" }}>
                    ${row.total.toLocaleString()}/mo
                  </span>
                </div>
                <div style={{ display: "flex", height: 28, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${closesPct}%`, background: "#1e3a5f", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "white", fontSize: 12, fontWeight: 600 }}>
                    {closesPct > 18 ? "Closes" : ""}
                  </div>
                  <div style={{ width: `${residualPct}%`, background: "#2563eb", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "white", fontSize: 12, fontWeight: 600 }}>
                    {residualPct > 10 ? "Residual" : ""}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 16, height: 16, background: "#1e3a5f", borderRadius: 3, display: "inline-block" }}></span>
              Close bonuses ($1,000/client)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 16, height: 16, background: "#2563eb", borderRadius: 3, display: "inline-block" }}></span>
              Monthly residuals (locked at close)
            </span>
          </div>
        </div>
      </section>

      {/* HOW YOU GET PAID */}
      <section style={{ background: "#f1f5f9", padding: "64px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 40 }}>How You Get Paid</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {[
              {
                icon: "💰",
                title: "$1,000 Close Bonus",
                body: "Paid per signed client upon onboarding. Flat rate regardless of industry. Close 4/month = $4,000 before residuals touch.",
              },
              {
                icon: "📈",
                title: "Residual Income (Locked Forever)",
                body: "Each client pays $200–$300/month permanently — rate locked at close based on your volume that month. Strong months pay better, forever.",
              },
              {
                icon: "🔗",
                title: "10% Service Commission",
                body: "Website builds ($350–$500 per) and consultation days ($100/day) stack on top. No ceiling, no splits.",
              },
              {
                icon: "🏴",
                title: "Territory Ownership",
                body: "Your territory is exclusively yours. Leads generated inside it route to you. Build it like a franchise — without the franchise fee.",
              },
            ].map((card) => (
              <div key={card.title} style={{ background: "white", borderRadius: 12, padding: "28px 24px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{card.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU'RE SELLING */}
      <section style={{ padding: "64px 24px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 12 }}>
          What You&apos;re Selling
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: 40, fontSize: 15 }}>
          $2,400/month · Month-to-month · All-inclusive local SEO. The easiest close in the industry.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {[
            "Satellite site clusters",
            "Domain acquisition",
            "Authority link building",
            "Active rank monitoring",
            "PPC campaign management",
            "Monthly competitive reports",
            "No lock-in contracts",
            "No surprise fees ever",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
              background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <span style={{ color: "#2563eb", fontWeight: 800, fontSize: 18 }}>✓</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32, padding: "20px 24px", background: "#eff6ff", borderRadius: 12,
          border: "1px solid #bfdbfe", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "#1e40af", fontWeight: 600, margin: 0 }}>
            Month-to-month means every renewal is a choice — clients stay because results speak.
            9 active clients, 7 retained 2+ years with zero lock-in.
          </p>
        </div>
      </section>

      {/* TERRITORY + WHO WE WANT */}
      <section style={{ background: "#0f2027", color: "white", padding: "64px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Claim Your Territory</h2>
            <p style={{ opacity: 0.75, lineHeight: 1.7, fontSize: 15 }}>
              First 4 reps get first pick — major metro areas or national verticals. Your territory is
              exclusively yours as long as you maintain 2 closes/month averaged over 90 days.
              Think franchise ownership without the buy-in.
            </p>
            <p style={{ opacity: 0.75, lineHeight: 1.7, fontSize: 15, marginTop: 16 }}>
              We generate leads. Your territory routes exclusively to you. As you prove production,
              you get increasing direct access to the lead-gen engine.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Who We Want</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                "Experience selling SEO, digital, or recurring B2B services",
                "Comfortable with commission-only (has runway or existing pipeline)",
                "Self-sourcing ability — cold outreach, own network",
                "Understands local SEO value proposition",
                "Bonus: existing vertical or metro relationships",
              ].map((item) => (
                <li key={item} style={{ display: "flex", gap: 12, marginBottom: 14, fontSize: 14, opacity: 0.85 }}>
                  <span style={{ color: "#60a5fa", marginTop: 2, flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 24px", textAlign: "center",
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", color: "white" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Ready to Claim Your Territory?</h2>
        <p style={{ opacity: 0.8, fontSize: 17, maxWidth: 480, margin: "0 auto 32px" }}>
          4 territories available. First reps get first pick. This fills fast.
        </p>
        <p style={{ opacity: 0.6, fontSize: 14 }}>Contact us to discuss available territories and next steps.</p>
      </section>

      <footer style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
        {companyName} · Commission-Only Sales Partner Program ·
        Projections: 4 closes/month, 3% monthly churn, $250/client residual
      </footer>
    </div>
  );
}
