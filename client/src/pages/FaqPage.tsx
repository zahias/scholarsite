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
            <aside className="public-subtle-card p-7 sticky top-[92px]">
              <Sparkles size={22} className="text-on-secondary-container mb-4" />
              <h2 className="font-serif text-[26px] font-medium text-midnight mb-2.5">
                Quick answers before you launch
              </h2>
              <p className="text-[14.5px] text-[#44474D] leading-relaxed mb-5">
                Browse setup, billing, data, and portfolio questions. If you need institution-level help, contact us directly.
              </p>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/contact"); }}
                className="px-[18px] py-2.5 bg-midnight text-white border-none rounded-[9px] text-sm font-semibold cursor-pointer"
              >
                Contact Us
              </button>
            </aside>
            <div>
            <div className="flex flex-col gap-2.5">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-[14px] overflow-hidden border transition-colors duration-200 ${openIndex === index ? "border-warm/40" : "border-midnight/[.08]"}`}
                >
                  <button
                    id={`faq-heading-${index}`}
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-panel-${index}`}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className={`w-full text-left px-6 py-5 bg-transparent border-none cursor-pointer flex items-center justify-between gap-3 transition-colors duration-200 border-l-[3px] ${openIndex === index ? "border-l-warm" : "border-l-transparent"}`}
                  >
                    <span className="font-serif font-medium text-midnight leading-snug flex-1" style={{ fontSize: "clamp(15px,2vw,17px)" }}>
                      {faq.question}
                    </span>
                    <div className={`w-7 h-7 rounded-full border border-midnight/[.08] grid place-items-center shrink-0 transition-colors duration-200 ${openIndex === index ? "bg-warm/15" : "bg-[#F0F4F8]"}`}>
                      {openIndex === index
                        ? <ChevronUp size={14} className="text-on-secondary-container" />
                        : <ChevronDown size={14} className="text-[#75777E]" />}
                    </div>
                  </button>
                  {openIndex === index && (
                    <div id={`faq-panel-${index}`} role="region" aria-labelledby={`faq-heading-${index}`}
                      className="px-6 pb-5 pl-[27px]">
                      <p className="text-[15px] text-[#44474D] leading-relaxed m-0">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Still have questions CTA band */}
            <div className="public-cta-band mt-12 rounded-2xl px-9 py-10 text-center">
              <div className="public-cta-content">
                <h2 className="font-serif font-medium text-white mb-2.5 tracking-[-0.01em]" style={{ fontSize: "clamp(20px,3vw,26px)" }}>
                  Still have questions?
                </h2>
                <p className="text-[15px] text-white/65 mb-6">We're happy to help.</p>
                <div className="flex gap-2.5 justify-center flex-wrap">
                  <button
                    onClick={() => { window.scrollTo(0, 0); navigate("/contact"); }}
                    className="px-[22px] py-2.5 bg-white/10 text-white border border-white/[.18] rounded-[9px] text-sm font-semibold cursor-pointer"
                  >
                    Contact Us
                  </button>
                  <button
                    onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
                    className="px-[22px] py-2.5 bg-warm text-on-secondary-container border-none rounded-[9px] text-sm font-bold cursor-pointer"
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
