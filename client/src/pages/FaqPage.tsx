import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { faqs } from "@/data/faqData";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function FaqPage() {
  const [, navigate] = useLocation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="public-page">
      <SEO
        title="FAQ — Scholar.name"
        description="Frequently asked questions about Scholar.name — data sources, pricing, custom domains, cancellation, and more."
        url="https://scholar.name/faq"
        type="website"
        structuredData={faqSchema}
      />
      <GlobalNav mode="landing" />

      <main className="public-main">
        {/* Hero */}
        <section className="public-masthead">
          <div className="public-masthead-inner">
            <span className="public-eyebrow">Support</span>
            <h1 className="public-title">
              Frequently asked questions
            </h1>
            <p className="public-copy">
              Everything you need to know about Scholar.name.
            </p>
          </div>
        </section>

        {/* FAQ accordion */}
        <section className="public-section">
          <div className="public-container-lg public-aside-grid">
            <aside className="public-subtle-card" style={{ padding: 28, position: "sticky", top: 92 }}>
              <Sparkles size={22} style={{ color: "#6F5400", marginBottom: 16 }} />
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 500, color: "#0B1F3A", margin: "0 0 10px" }}>
                Quick answers before you launch
              </h2>
              <p style={{ fontSize: 14.5, color: "#44474D", lineHeight: 1.65, margin: "0 0 20px" }}>
                Browse setup, billing, data, and portfolio questions. If you need institution-level help, contact us directly.
              </p>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/contact"); }}
                style={{ padding: "10px 18px", background: "#0B1F3A", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
              >
                Contact Us
              </button>
            </aside>
            <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    border: openIndex === index ? "1px solid rgba(255,199,46,.4)" : "1px solid rgba(11,31,58,.08)",
                    overflow: "hidden",
                    transition: "border-color .2s",
                  }}
                >
                  <button
                    id={`faq-heading-${index}`}
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-panel-${index}`}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    style={{
                      width: "100%", textAlign: "left", padding: "20px 24px",
                      background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      borderLeft: openIndex === index ? "3px solid #FFC72E" : "3px solid transparent",
                      transition: "border-color .2s",
                    }}
                  >
                    <span style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(15px,2vw,17px)", fontWeight: 500, color: "#0B1F3A", lineHeight: 1.35, flex: 1 }}>
                      {faq.question}
                    </span>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: openIndex === index ? "rgba(255,199,46,.15)" : "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", display: "grid", placeItems: "center", flexShrink: 0, transition: "background .2s" }}>
                      {openIndex === index
                        ? <ChevronUp size={14} style={{ color: "#6F5400" }} />
                        : <ChevronDown size={14} style={{ color: "#75777E" }} />}
                    </div>
                  </button>
                  {openIndex === index && (
                    <div id={`faq-panel-${index}`} role="region" aria-labelledby={`faq-heading-${index}`}
                      style={{ padding: "0 24px 20px 27px" }}>
                      <p style={{ fontSize: 15, color: "#44474D", lineHeight: 1.65, margin: 0 }}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Still have questions CTA band */}
            <div className="public-cta-band" style={{ marginTop: 48, borderRadius: 16, padding: "40px 36px", textAlign: "center" }}>
              <div className="public-cta-content">
                <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(20px,3vw,26px)", fontWeight: 500, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
                  Still have questions?
                </h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,.65)", margin: "0 0 24px" }}>We're happy to help.</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => { window.scrollTo(0, 0); navigate("/contact"); }}
                    style={{ padding: "10px 22px", background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.18)", borderRadius: 9, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
                  >
                    Contact Us
                  </button>
                  <button
                    onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
                    style={{ padding: "10px 22px", background: "#FFC72E", color: "#6F5400", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                  >
                    Create Your Portfolio
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <GlobalFooter />
    </div>
  );
}
