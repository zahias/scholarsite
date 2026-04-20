import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { faqs } from "@/data/faqData";

// Structured data for Google rich snippets
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FaqPage() {
  const [, navigate] = useLocation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="FAQ — Scholar.name"
        description="Frequently asked questions about Scholar.name — data sources, pricing, custom domains, cancellation, and more."
        url="https://scholar.name/faq"
        type="website"
        structuredData={faqSchema}
      />

      <GlobalNav mode="landing" />

      <main className="flex-1">
        {/* Hero */}
        <section className="landing-hero py-16 lg:py-20 relative">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Everything you need to know about Scholar.name
            </p>
          </div>
        </section>

        {/* FAQ accordion */}
        <section className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`bg-surface-container-low rounded-xl ghost-border overflow-hidden transition-all ${
                    openIndex === index ? "border-l-4 border-l-secondary-container" : ""
                  }`}
                >
                  <button
                    id={`faq-heading-${index}`}
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-panel-${index}`}
                    className={`w-full px-6 py-5 text-left flex items-center justify-between gap-4 ${
                      openIndex === index ? "bg-surface-container" : "hover:bg-surface-container"
                    }`}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <span className="font-medium text-foreground">{faq.question}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        openIndex === index
                          ? "bg-secondary-container/10 text-primary-container"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {openIndex === index ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  {openIndex === index && (
                    <div
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-heading-${index}`}
                      className="px-6 pb-5 bg-surface-container"
                    >
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Still have questions */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">Still have questions?</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate("/contact");
                  }}
                >
                  Contact Us
                </Button>
                <Button
                  variant="primary-cta"
                  size="lg"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate("/signup");
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Your Portfolio
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <GlobalFooter mode="landing" />
    </div>
  );
}
