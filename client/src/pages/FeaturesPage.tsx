import { useEffect } from "react";
import { useLocation } from "wouter";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import { RefreshCw, BarChart3, Globe, Sparkles, Palette, Download, Users, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: RefreshCw,
    title: "Auto-Sync Publications",
    description: "Your publications update automatically from OpenAlex — the open index of 250M+ scholarly works. No manual entry, no copy-paste.",
  },
  {
    icon: BarChart3,
    title: "Citation Analytics",
    description: "Interactive charts showing citation trends, h-index growth, and publication timeline. See your research impact at a glance.",
  },
  {
    icon: Globe,
    title: "Shareable URL",
    description: "Get yourname.scholar.name or connect your own domain. A clean, memorable link for email signatures, grants, and conferences.",
  },
  {
    icon: Palette,
    title: "Customizable Themes",
    description: "Choose from professionally designed color themes to match your personal brand. Your portfolio, your style.",
  },
  {
    icon: Users,
    title: "Co-Author Network",
    description: "See your co-author connections and institutional relationships at a glance. Great for discovering shared research interests.",
  },
  {
    icon: Download,
    title: "Research Passport",
    description: "Download a polished PDF summary of your profile — perfect for tenure packets, grant appendices, and job applications.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Controls",
    description: "You decide what's visible. Hide sections, report misattributed papers, and control who sees your analytics.",
  },
  {
    icon: Sparkles,
    title: "AI-Ready Metadata",
    description: "Structured data and OpenGraph tags ensure your profile looks great when shared on social media, Slack, or in search results.",
  },
];

const ICON_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#0891B2", "#4338CA", "#DC2626", "#0F766E"];

export default function FeaturesPage() {
  const [, navigate] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff" }}>
      <SEO
        title="Features — Scholar.name"
        description="Auto-syncing publications, citation analytics, customizable themes, and more. See everything Scholar.name offers researchers."
        url="https://scholar.name/features"
        type="website"
      />
      <GlobalNav mode="landing" />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ background: "#0B1F3A", padding: "72px 0 56px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.14), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1, textAlign: "center" }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "#FFC72E", fontWeight: 600, display: "block", marginBottom: 16 }}>Platform</span>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(32px,5vw,56px)", lineHeight: 1.08, fontWeight: 500, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Everything you need to showcase your research
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.7)", lineHeight: 1.55, maxWidth: 520, margin: "0 auto" }}>
              From automatic publication syncing to downloadable Research Passports — built by academics, for academics.
            </p>
          </div>
        </section>

        {/* Feature grid */}
        <section style={{ background: "#F0F4F8", padding: "64px 24px 72px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="features-grid">
              <style>{`@media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr) !important; } } @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr !important; } }`}</style>
              {features.map((f, i) => {
                const color = ICON_COLORS[i % ICON_COLORS.length];
                return (
                  <FeatureCard key={i} f={f} color={color} />
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <div style={{ background: "#0B1F3A", padding: "64px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.15), transparent 55%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
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

function FeatureCard({ f, color }: { f: (typeof features)[number]; color: string }) {
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

// useState import needed for FeatureCard hover
import { useState } from "react";
