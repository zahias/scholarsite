import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import { marketingFeatures } from "@/data/marketingData";

const ICON_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#0891B2", "#4338CA", "#DC2626", "#0F766E"];

export default function FeaturesPage() {
  const [, navigate] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="public-page">
      <SEO
        title="Features — Scholar.name"
        description="Auto-syncing publications, citation analytics, customizable themes, and more. See everything Scholar.name offers researchers."
        url="https://scholar.name/features"
        type="website"
      />
      <GlobalNav mode="landing" />

      <main className="public-main">
        {/* Hero */}
        <section className="public-masthead">
          <div className="public-masthead-inner" style={{ textAlign: "left" }}>
            <span className="public-eyebrow">Platform</span>
            <h1 className="public-title">
              Everything you need to showcase your research
            </h1>
            <p className="public-copy" style={{ maxWidth: 640, margin: 0 }}>
              From automatic publication syncing to downloadable Research Passports — built by academics, for academics.
            </p>
          </div>
        </section>

        {/* Feature grid */}
        <section className="public-section" style={{ paddingBottom: 72 }}>
          <div className="public-container-lg">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }} className="features-grid">
              <style>{`@media (max-width: 1120px) { .features-grid { grid-template-columns: repeat(3, 1fr) !important; } } @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr) !important; } } @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr !important; } }`}</style>
              {marketingFeatures.map((f, i) => {
                const color = ICON_COLORS[i % ICON_COLORS.length];
                return (
                  <FeatureCard key={i} f={f} color={color} />
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <div className="public-cta-band" style={{ padding: "64px 32px", textAlign: "center" }}>
          <div className="public-cta-content" style={{ maxWidth: 520, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(24px,3vw,36px)", fontWeight: 500, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.015em" }}>
              Ready to build your portfolio?
            </h2>
            <p style={{ fontSize: 15.5, color: "rgba(255,255,255,.65)", margin: "0 0 28px" }}>No credit card required to start.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
                style={{ padding: "12px 28px", background: "#FFC72E", color: "#6F5400", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                Create Your Portfolio
              </button>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/pricing"); }}
                style={{ padding: "12px 22px", background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.18)", borderRadius: 10, fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                View Pricing →
              </button>
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}

function FeatureCard({ f, color }: { f: (typeof marketingFeatures)[number]; color: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 16, border: "1px solid rgba(11,31,58,.08)", padding: "28px 26px",
        transition: "transform .2s, box-shadow .2s",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 12px 32px -12px rgba(11,31,58,.14)" : "none",
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 11, background: `${color}18`, display: "grid", placeItems: "center", marginBottom: 16 }}>
        <f.icon size={20} style={{ color }} />
      </div>
      <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 500, color: "#0B1F3A", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
        {f.title}
      </h3>
      <p style={{ fontSize: 14, color: "#44474D", lineHeight: 1.6, margin: 0 }}>{f.description}</p>
    </div>
  );
}
