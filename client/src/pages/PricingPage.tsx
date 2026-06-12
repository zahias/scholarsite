import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 9.99,
    yearlyPrice: 95.88,
    yearlySavings: 24,
    description: "Perfect for individual researchers",
    features: [
      "scholar.name subdomain",
      "Publication analytics",
      "Color themes",
      "Monthly data sync",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 19.99,
    yearlyPrice: 191.88,
    yearlySavings: 48,
    description: "For established academics",
    features: [
      "Everything in Starter",
      "Custom domain (yourname.com)",
      "Research Passport download",
      "Weekly data sync",
      "Priority support",
    ],
    highlighted: true,
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const [isYearly, setIsYearly] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const billingPeriod = isYearly ? "yearly" : "monthly";
  const checkoutPathForPlan = (planName: string) =>
    `/checkout?plan=${planName.toLowerCase()}&billing=${billingPeriod}`;

  return (
    <div className="public-page">
      <SEO
        title="Pricing — Scholar.name"
        description="Simple, transparent pricing for professional research portfolios."
        url="https://scholar.name/pricing"
        type="website"
      />
      <GlobalNav mode="landing" />

      <main className="public-main">
        {/* Hero */}
        <section className="public-masthead">
          <div className="public-masthead-inner">
            <span className="public-eyebrow">Pricing</span>
            <h1 className="public-title">
              Simple, transparent pricing
            </h1>
            <p className="public-copy">
              Choose a plan and your portfolio goes live in minutes.
            </p>
          </div>
        </section>

        {/* Toggle + Plans */}
        <section className="public-section">
          <div className="public-container-lg">

            {/* Monthly / Yearly toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
              <span style={{ fontSize: 14, fontWeight: isYearly ? 400 : 600, color: isYearly ? "#75777E" : "#0B1F3A", transition: "color .15s" }}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                role="switch"
                aria-checked={isYearly}
                style={{
                  width: 44, height: 24, borderRadius: 12, background: isYearly ? "#0B1F3A" : "rgba(11,31,58,.12)",
                  border: "none", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: 3, left: isYearly ? 23 : 3, width: 18, height: 18,
                  borderRadius: "50%", background: isYearly ? "#FFC72E" : "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s, background .2s",
                }} />
              </button>
              <span style={{ fontSize: 14, fontWeight: isYearly ? 600 : 400, color: isYearly ? "#0B1F3A" : "#75777E", transition: "color .15s", display: "flex", alignItems: "center", gap: 6 }}>
                Yearly
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", background: "rgba(5,150,105,.12)", color: "#059669", padding: "2px 7px", borderRadius: 999 }}>
                  Save 2 months
                </span>
              </span>
            </div>

            {/* Free trial banner */}
            <div className="public-subtle-card" style={{ margin: "0 0 28px", padding: "28px 32px", borderStyle: "dashed", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "rgba(47,109,58,.1)", color: "#2F6D3A", border: "1px solid rgba(47,109,58,.18)", marginBottom: 8 }}>
                  <Check style={{ width: 12, height: 12, flexShrink: 0 }} />
                  Free &mdash; no credit card
                </div>
                <div style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "#0B1F3A", marginBottom: 4 }}>14-day free trial</div>
                <p style={{ fontSize: 13.5, color: "#75777E", margin: 0 }}>Full access to all features. Your portfolio goes live immediately. Choose a paid plan when you&rsquo;re ready.</p>
              </div>
              <button
                className="btn-navy"
                style={{ border: "none", padding: "10px 22px", fontSize: 14, cursor: "pointer", flexShrink: 0 }}
                onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
              >
                Start free trial
              </button>
            </div>

            {/* Plan cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 24 }} className="pricing-grid">
              <style>{`@media (max-width: 760px) { .pricing-grid { grid-template-columns: 1fr !important; } }`}</style>
              {plans.map((plan, i) => (
                <div
                  key={i}
                  className={plan.highlighted ? "plan-card plan-card-featured" : "plan-card"}
                >
                  {plan.highlighted && (
                    <div className="plan-badge">
                      Most Popular
                    </div>
                  )}

                  <div style={{ position: "relative" }}>
                    <div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, color: plan.highlighted ? "#fff" : "#0B1F3A", marginBottom: 4 }}>{plan.name}</div>
                    <p style={{ fontSize: 13.5, color: plan.highlighted ? "rgba(255,255,255,.6)" : "#75777E", margin: "0 0 20px" }}>{plan.description}</p>

                    <div style={{ marginBottom: 20 }}>
                      <span style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(36px,5vw,44px)", fontWeight: 600, color: plan.highlighted ? "#FFC72E" : "#0B1F3A", letterSpacing: "-0.02em" }}>
                        ${isYearly ? plan.yearlyPrice.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                      </span>
                      <span style={{ fontSize: 14, color: plan.highlighted ? "rgba(255,255,255,.5)" : "#75777E", marginLeft: 4 }}>/{isYearly ? "year" : "month"}</span>
                      {isYearly && (
                        <p style={{ fontSize: 12.5, color: plan.highlighted ? "rgba(255,199,46,.8)" : "#059669", marginTop: 3 }}>
                          Save ${plan.yearlySavings}
                        </p>
                      )}
                    </div>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {plan.features.map((feat, j) => (
                        <li key={j} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: plan.highlighted ? "rgba(255,255,255,.85)" : "#171C1F" }}>
                          <span style={{ width: 18, height: 18, borderRadius: "50%", background: plan.highlighted ? "rgba(255,199,46,.2)" : "rgba(11,31,58,.06)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <Check size={10} style={{ color: plan.highlighted ? "#FFC72E" : "#0B1F3A" }} />
                          </span>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => { window.scrollTo(0, 0); navigate(checkoutPathForPlan(plan.name)); }}
                      className={plan.highlighted ? "btn-gold" : "btn-navy"}
                      style={{
                        width: "100%", padding: "12px 20px", fontSize: 14.5, fontFamily: "inherit", cursor: "pointer", border: "none",
                      }}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ textAlign: "center", fontSize: 13.5, color: "#75777E", marginTop: 24 }}>
              Cancel anytime — your profile stays active until the billing period ends.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ background: "var(--surface-container-lowest)", padding: "56px 24px", textAlign: "center", borderTop: "1px solid rgba(11,31,58,.06)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 24px", letterSpacing: "-0.015em" }}>
              Have questions before you start?
            </h2>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/faq"); }}
                style={{ padding: "10px 22px", background: "var(--surface-container-lowest)", color: "var(--primary-container)", border: "1px solid rgba(11,31,58,.14)", borderRadius: 9, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                Read the FAQ →
              </button>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/contact"); }}
                style={{ padding: "10px 22px", background: "transparent", color: "#44474D", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                Contact Us
              </button>
            </div>
          </div>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
}
