// TENANT-READY: all strings pull from TenantConfig as of Sprint 29-B
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant/server";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  const companyName = tenant?.companyName ?? "COVOS";
  return {
    title: `${companyName} — Local SEO That Dominates`,
    description:
      "All-inclusive local SEO at $2,400/month. Month-to-month, no lock-in. Satellite site cluster methodology proven to dominate local search.",
  };
}

export default async function BrochurePage() {
  const tenant = await getTenant();
  const companyName = tenant?.companyName ?? "COVOS";
  const fromName = tenant?.fromName ?? companyName;
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
          color: "white",
          padding: "64px 32px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            opacity: 0.6,
            marginBottom: 20,
          }}
        >
          {companyName}
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: "0 auto 16px",
            maxWidth: 640,
          }}
        >
          Own the Top Spot.<br />Keep It Forever.
        </h1>
        <p
          style={{
            fontSize: 17,
            opacity: 0.8,
            maxWidth: 480,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          All-inclusive local SEO at $2,400/month. Month-to-month — because we&apos;re confident in our results.
        </p>
        <div
          style={{
            display: "inline-block",
            background: "white",
            color: "#1e3a5f",
            padding: "12px 32px",
            borderRadius: 28,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          No Contracts. No Surprises. No Excuses.
        </div>
      </section>

      {/* THE PROBLEM */}
      <section style={{ padding: "48px 32px", maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          Most SEO agencies lock you in and underdeliver.
        </h2>
        <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 15, maxWidth: 620 }}>
          You sign a 12-month contract, pay month after month, and spend more time chasing updates than seeing results.
          Meanwhile, your competitors are climbing above you and taking the phone calls that should be yours.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 28,
          }}
        >
          {[
            { icon: "🔒", label: "Lock-In Contracts", sub: "Tied in even when results don't come" },
            { icon: "💸", label: "Hidden Fees", sub: "Add-ons for things you assumed were included" },
            { icon: "📊", label: "Vague Reporting", sub: "Traffic numbers without competitive context" },
            { icon: "🤷", label: "Opaque Methods", sub: "No visibility into what they're actually doing" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "16px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "0 32px" }} />

      {/* THE SOLUTION */}
      <section style={{ padding: "48px 32px", maxWidth: 760, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#2563eb",
            marginBottom: 8,
          }}
        >
          The {fromName} Way
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          One price. Everything included. Results or you leave — it&apos;s that simple.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            {
              icon: "📍",
              title: "Satellite Site Clusters",
              body:
                "We build and manage a network of optimized satellite properties targeting your highest-value keywords — multiplying your visibility across the local search landscape.",
            },
            {
              icon: "🔗",
              title: "Authority Link Building",
              body:
                "Strategic backlink acquisition from relevant local and industry sources, building the domain authority needed to outrank entrenched competitors.",
            },
            {
              icon: "📈",
              title: "Rank Monitoring & Defense",
              body:
                "Your rankings are watched continuously. When competitors make moves, we respond — protecting your position rather than waiting for monthly check-ins.",
            },
            {
              icon: "🗺️",
              title: "Local Pack Domination",
              body:
                "Google Maps placement drives the majority of local calls. We optimize your GBP profile, citations, and local signals to put you in the top 3.",
            },
            {
              icon: "📊",
              title: "Competitive Intelligence Reports",
              body:
                "Monthly reporting that shows exactly where you stand vs. your top competitors — not just your rankings, but theirs too.",
            },
            {
              icon: "🖥️",
              title: "PPC Campaign Management",
              body:
                "Standard paid search campaigns included. No additional management fees.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "20px 18px",
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "0 32px" }} />

      {/* PPC / PAID SEARCH SECTION */}
      <section style={{ padding: "48px 32px", maxWidth: 760, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#2563eb",
            marginBottom: 8,
          }}
        >
          Paid + Organic — The Full Stack
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          SEO gets you there. Paid search keeps you there — and fills the gap while you climb.
        </h2>
        <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 15, maxWidth: 620, marginBottom: 32 }}>
          Organic rankings take time. Paid search starts working the day a campaign goes live.
          GHM manages both under one roof — no separate ad agency, no double billing,
          no coordination overhead. Your $2,400/mo retainer includes campaign management.
          You own your ad accounts; we manage them.
        </p>

        {/* SVG funnel visual */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <svg viewBox="0 0 480 180" width="100%" style={{ maxWidth: 480, height: "auto" }} aria-hidden="true">
            {/* Funnel shape */}
            <polygon points="40,20 440,20 360,90 120,90" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5" />
            <polygon points="120,95 360,95 300,155 180,155" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5" />
            {/* Labels */}
            <text x="240" y="58" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e40af">Paid Search — Immediate Clicks</text>
            <text x="240" y="73" textAnchor="middle" fontSize="11" fill="#3b82f6">Google Search Ads · Local Services Ads · Remarketing</text>
            <text x="240" y="128" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e3a5f">Organic SEO — Compounding Visibility</text>
            <text x="240" y="143" textAnchor="middle" fontSize="11" fill="#2563eb">Local Pack · Satellite Sites · Authority Building</text>
          </svg>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              icon: "🎯",
              title: "Local Services Ads",
              body: "Google-verified listings that appear above all search results. Pay per lead, not per click. Ideal for service businesses.",
            },
            {
              icon: "🔎",
              title: "Google Search Ads",
              body: "Keyword-targeted ads for high-intent searches. We write the copy, manage the bids, and optimize weekly.",
            },
            {
              icon: "🔄",
              title: "Remarketing",
              body: "Re-engage visitors who saw your site but didn't call. Keep your business top of mind across the web.",
            },
            {
              icon: "📋",
              title: "Monthly Reporting",
              body: "Impressions, clicks, calls, cost-per-lead, and conversion rate — every month, alongside your SEO report.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: 10,
                padding: "18px 16px",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 28,
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: "20px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 28, flexShrink: 0 }}>💡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#1e40af" }}>
              What&apos;s included in your retainer
            </div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
              PPC campaign setup, copywriting, bid management, landing page recommendations, and monthly reporting are included in your $2,400/mo retainer.
              Ad spend (the budget you pay Google directly) is separate — we recommend starting at $500–$1,500/mo and scaling based on results.
              You maintain full ownership of your Google Ads account.
            </div>
          </div>
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "0 32px" }} />
      <section
        style={{
          padding: "48px 32px",
          maxWidth: 760,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Simple, Transparent Pricing
        </h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
          No tiers. No hidden fees. One plan that includes everything.
        </p>

        <div
          style={{
            display: "inline-block",
            background: "white",
            border: "2px solid #2563eb",
            borderRadius: 16,
            padding: "36px 48px",
            textAlign: "center",
            maxWidth: 360,
            width: "100%",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            All-Inclusive Retainer
          </p>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
            $2,400
          </div>
          <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>/month</div>
          <div style={{ textAlign: "left", fontSize: 13, lineHeight: 2, color: "#374151" }}>
            {[
              "Satellite site cluster build & management",
              "Authority link building",
              "GBP optimization",
              "Citation consistency monitoring",
              "Rank monitoring & defense",
              "PPC campaign management",
              "Monthly competitive intelligence report",
              "Dedicated point of contact",
            ].map((item) => (
              <div key={item}>
                <span style={{ color: "#10b981", fontWeight: 700 }}>✓ </span>{item}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 24,
              background: "#eff6ff",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: "#1d4ed8",
              fontWeight: 600,
            }}
          >
            Month-to-month — cancel anytime
          </div>
        </div>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Basic Website Build", price: "$3,500" },
            { label: "Advanced Website Build", price: "$5,000" },
            { label: "Business Consultation", price: "$1,000/day" },
          ].map((u) => (
            <div
              key={u.label}
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13,
              }}
            >
              <span style={{ color: "#6b7280" }}>{u.label}: </span>
              <span style={{ fontWeight: 700 }}>{u.price}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>
          Additional services available — never required
        </p>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "0 32px" }} />

      {/* PROOF */}
      <section style={{ padding: "48px 32px", maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
          Built on a Track Record
        </h2>
        <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 32 }}>
          Our clients don&apos;t stay because of a contract. They stay because the results are real.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            textAlign: "center",
          }}
        >
          {[
            { stat: "9", label: "Active Clients" },
            { stat: "2+ yrs", label: "Average Retention" },
            { stat: "~97%", label: "Monthly Retention Rate" },
            { stat: "$0", label: "Lock-In Required" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "20px 12px",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#2563eb",
                  marginBottom: 4,
                }}
              >
                {item.stat}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
          color: "white",
          padding: "56px 32px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
          See Exactly Where You Stand
        </h2>
        <p
          style={{
            opacity: 0.8,
            fontSize: 15,
            maxWidth: 460,
            margin: "0 auto 28px",
            lineHeight: 1.6,
          }}
        >
          We&apos;ll run a free competitive audit of your business — live rankings, citation health,
          and how you stack up against the top 3 competitors in your market. No pitch, just data.
        </p>
        <div
          style={{
            display: "inline-block",
            background: "white",
            color: "#1e3a5f",
            padding: "14px 36px",
            borderRadius: 28,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Get Your Free Audit →
        </div>
        <p style={{ marginTop: 16, opacity: 0.5, fontSize: 12 }}>
          Takes about 15 minutes. No obligation.
        </p>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: "20px 32px",
          textAlign: "center",
          fontSize: 12,
          color: "#9ca3af",
          borderTop: "1px solid #f3f4f6",
        }}
      >
        {companyName} · All-inclusive local SEO · Month-to-month
      </footer>
    </div>
  );
}
