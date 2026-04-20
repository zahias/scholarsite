import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "Where does the publication data come from?",
    answer:
      "All publication data comes from OpenAlex, a free and open index of 250M+ scholarly works. Your profile syncs automatically. You can report issues directly from your profile.",
  },
  {
    question: "How accurate is the publication matching?",
    answer:
      "OpenAlex uses advanced algorithms, but no system is perfect for common names. You can see all attributed publications and report any that don't belong to you.",
  },
  {
    question: "Can I edit my publications?",
    answer:
      "You control your bio, photo, themes, and featured works. The publication list comes from OpenAlex — we'll guide you through requesting corrections if needed.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes! Pro plan includes custom domains (yourname.com). Starter uses yourname.scholar.name. Both are professional and memorable.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "Cancel anytime. Your profile stays active until the billing period ends, then becomes private (not deleted). Reactivate anytime.",
  },
  {
    question: "How does the auto-sync work?",
    answer:
      "We periodically query OpenAlex for your author record. When new publications appear, they're automatically added to your portfolio — no action needed on your part.",
  },
  {
    question: "Can I share my profile before paying?",
    answer:
      "Choose a plan on the pricing page and your portfolio goes live immediately after payment. Your data is never deleted if you cancel.",
  },
];

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
    <div className="min-h-screen flex flex-col" style={{ background: "#fff" }}>
      <SEO
        title="FAQ — Scholar.name"
        description="Frequently asked questions about Scholar.name — data sources, pricing, custom domains, cancellation, and more."
        url="https://scholar.name/faq"
        type="website"
        structuredData={faqSchema}
      />
      <GlobalNav mode="landing" />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ background: "#0B1F3A", padding: "72px 0 56px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.14), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1, textAlign: "center" }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "#FFC72E", fontWeight: 600, display: "block", marginBottom: 16 }}>Support</span>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(32px,5vw,56px)", lineHeight: 1.08, fontWeight: 500, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Frequently asked questions
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.7)", lineHeight: 1.55, margin: 0 }}>
              Everything you need to know about Scholar.name.
            </p>
          </div>
        </section>

        {/* FAQ accordion */}
        <section style={{ background: "#F0F4F8", padding: "64px 24px 80px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
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
            <div style={{ marginTop: 48, background: "#0B1F3A", borderRadius: 16, padding: "40px 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.15), transparent 55%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
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
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <GlobalFooter />
    </div>
  );
}
