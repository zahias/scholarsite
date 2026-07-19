import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import { Check } from "lucide-react";
import { pricingPlans } from "@/data/marketingData";

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
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className={`text-sm transition-colors duration-150 ${isYearly ? "font-normal text-[#75777E]" : "font-semibold text-midnight"}`}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                role="switch"
                aria-checked={isYearly}
                className={`w-11 h-6 rounded-xl border-none cursor-pointer relative transition-colors duration-200 shrink-0 ${isYearly ? "bg-midnight" : "bg-midnight/[.12]"}`}
              >
                <span
                  className={`absolute top-[3px] w-[18px] h-[18px] rounded-full shadow-[0_1px_4px_rgba(0,0,0,.2)] transition-[left,background] duration-200 ${isYearly ? "bg-warm" : "bg-white"}`}
                  style={{ left: isYearly ? 23 : 3 }}
                />
              </button>
              <span className={`text-sm transition-colors duration-150 flex items-center gap-1.5 ${isYearly ? "font-semibold text-midnight" : "font-normal text-[#75777E]"}`}>
                Yearly
                <span className="text-[11px] font-bold tracking-[.08em] bg-[#059669]/10 text-[#059669] px-[7px] py-0.5 rounded-full">
                  Save 2 months
                </span>
              </span>
            </div>

            {/* Free trial banner */}
            <div className="public-subtle-card mb-7 px-8 py-7 border-dashed flex flex-row items-center justify-between gap-6 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-xs font-semibold bg-[#2F6D3A]/10 text-[#2F6D3A] border border-[#2F6D3A]/[.18] mb-2">
                  <Check className="w-3 h-3 shrink-0" />
                  Free &mdash; no credit card
                </div>
                <div className="font-serif text-xl font-medium text-midnight mb-1">14-day free trial</div>
                <p className="text-[13.5px] text-[#75777E] m-0">Full access to all features. Your portfolio goes live immediately. Choose a paid plan when you&rsquo;re ready.</p>
              </div>
              <button
                className="btn-navy border-none px-[22px] py-2.5 text-sm cursor-pointer shrink-0"
                onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
              >
                Start free trial
              </button>
            </div>

            {/* Plan cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 24 }} className="pricing-grid">
              <style>{`@media (max-width: 760px) { .pricing-grid { grid-template-columns: 1fr !important; } }`}</style>
              {pricingPlans.map((plan, i) => (
                <div
                  key={i}
                  className={plan.highlighted ? "plan-card plan-card-featured" : "plan-card"}
                >
                  {plan.highlighted && (
                    <div className="plan-badge">
                      Most Popular
                    </div>
                  )}

                  <div className="relative">
                    <div className={`font-serif text-[22px] font-medium mb-1 ${plan.highlighted ? "text-white" : "text-midnight"}`}>{plan.name}</div>
                    <p className={`text-[13.5px] mb-5 ${plan.highlighted ? "text-white/60" : "text-[#75777E]"}`}>{plan.description}</p>

                    <div className="mb-5">
                      <span
                        className={`font-serif font-semibold tracking-[-0.02em] ${plan.highlighted ? "text-warm" : "text-midnight"}`}
                        style={{ fontSize: "clamp(36px,5vw,44px)" }}
                      >
                        ${isYearly ? plan.yearlyPrice.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                      </span>
                      <span className={`text-sm ml-1 ${plan.highlighted ? "text-white/50" : "text-[#75777E]"}`}>/{isYearly ? "year" : "month"}</span>
                      {isYearly && (
                        <p className={`text-[12.5px] mt-[3px] ${plan.highlighted ? "text-warm/80" : "text-[#059669]"}`}>
                          Save ${plan.yearlySavings}
                        </p>
                      )}
                    </div>

                    <ul className="list-none p-0 mb-6 flex flex-col gap-2.5">
                      {plan.features.map((feat, j) => (
                        <li key={j} className={`flex items-center gap-[9px] text-sm ${plan.highlighted ? "text-white/85" : "text-[#171C1F]"}`}>
                          <span className={`w-[18px] h-[18px] rounded-full grid place-items-center shrink-0 ${plan.highlighted ? "bg-warm/20" : "bg-midnight/[.06]"}`}>
                            <Check size={10} className={plan.highlighted ? "text-warm" : "text-midnight"} />
                          </span>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => { window.scrollTo(0, 0); navigate(checkoutPathForPlan(plan.name)); }}
                      className={`${plan.highlighted ? "btn-gold" : "btn-navy"} w-full px-5 py-3 text-[14.5px] cursor-pointer border-none`}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-[13.5px] text-[#75777E] mt-6">
              Cancel anytime — your profile stays active until the billing period ends.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-surface-container-lowest px-6 py-14 text-center border-t border-midnight/[.06]">
          <div className="max-w-[480px] mx-auto">
            <h2 className="font-serif font-medium text-midnight mb-6 tracking-[-0.015em]" style={{ fontSize: "clamp(22px,3vw,30px)" }}>
              Have questions before you start?
            </h2>
            <div className="flex gap-2.5 justify-center flex-wrap">
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/faq"); }}
                className="px-[22px] py-2.5 bg-surface-container-lowest text-primary-container border border-midnight/[.14] rounded-[9px] text-sm font-semibold cursor-pointer">
                Read the FAQ →
              </button>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/contact"); }}
                className="px-[22px] py-2.5 bg-transparent text-[#44474D] border-none rounded-[9px] text-sm font-medium cursor-pointer">
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
