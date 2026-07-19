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
          <div className="public-masthead-inner text-left">
            <span className="public-eyebrow">Platform</span>
            <h1 className="public-title">
              Everything you need to showcase your research
            </h1>
            <p className="public-copy max-w-[640px] m-0">
              From automatic publication syncing to downloadable Research Passports — built by academics, for academics.
            </p>
          </div>
        </section>

        {/* Feature grid */}
        <section className="public-section pb-[72px]">
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
        <div className="public-cta-band px-8 py-16 text-center">
          <div className="public-cta-content max-w-[520px] mx-auto">
            <h2 className="font-serif font-medium text-white mb-3 tracking-[-0.015em]" style={{ fontSize: "clamp(24px,3vw,36px)" }}>
              Ready to build your portfolio?
            </h2>
            <p className="text-[15.5px] text-white/65 mb-7">No credit card required to start.</p>
            <div className="flex gap-2.5 justify-center flex-wrap">
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
                className="px-7 py-3 bg-warm text-on-secondary-container border-none rounded-[10px] text-[14.5px] font-bold cursor-pointer">
                Create Your Portfolio
              </button>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/pricing"); }}
                className="px-[22px] py-3 bg-white/10 text-white border border-white/[.18] rounded-[10px] text-[14.5px] font-semibold cursor-pointer">
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
      <div className="w-11 h-11 rounded-[11px] grid place-items-center mb-4" style={{ background: `${color}18` }}>
        <f.icon size={20} style={{ color }} />
      </div>
      <h3 className="font-serif text-lg font-medium text-midnight mb-2 tracking-[-0.01em]">
        {f.title}
      </h3>
      <p className="text-sm text-[#44474D] leading-relaxed m-0">{f.description}</p>
    </div>
  );
}
