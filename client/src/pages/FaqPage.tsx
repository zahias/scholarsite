import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

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
    question: "Is there a free trial?",
    answer:
      "Yes — 14 days free, no credit card required. Set up your profile, customize everything, and only pay if you keep it public.",
  },
  {
    question: "How does the auto-sync work?",
    answer:
      "We periodically query OpenAlex for your author record. When new publications appear, they're automatically added to your portfolio — no action needed on your part.",
  },
  {
    question: "Can I share my profile before paying?",
    answer:
      "During your free trial the profile is fully public. After the trial ends, it becomes private until you subscribe. Your data is never deleted.",
  },
];

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
                  className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${
                    openIndex === index ? "border-l-4 border-l-primary" : "border-border"
                  }`}
                >
                  <button
                    id={`faq-heading-${index}`}
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-panel-${index}`}
                    className={`w-full px-6 py-5 text-left flex items-center justify-between gap-4 ${
                      openIndex === index ? "bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <span className="font-medium text-foreground">{faq.question}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        openIndex === index
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
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
                      className="px-6 pb-5 bg-primary/5"
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
                  size="lg"
                  className="btn-premium"
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
