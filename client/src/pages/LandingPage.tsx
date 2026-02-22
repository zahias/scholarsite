import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import {
  Search,
  ArrowRight,
  Check,
  BookOpen,
  Users,
  Loader2,
  GraduationCap,
  RefreshCw,
  BarChart3,
  ChevronDown,
  Lock,
  Zap,
  Sparkles,
  Globe,
  Mail,
  FileText,
  Handshake,
} from "lucide-react";

// ───── Types ─────

interface AuthorSearchResult {
  id: string;
  display_name: string;
  hint: string;
  works_count: number;
  cited_by_count: number;
}

interface SearchResponse {
  results: AuthorSearchResult[];
}

// ───── Static data (M4: hoisted to module scope) ─────

const faqs = [
  {
    question: "Where does the publication data come from?",
    answer:
      "All publication data comes from OpenAlex, a free and open index of 250\u202fM+ scholarly works. Your profile syncs automatically. You can report issues directly from your profile.",
  },
  {
    question: "How accurate is the publication matching?",
    answer:
      "OpenAlex uses advanced algorithms, but no system is perfect for common names. You can see all attributed publications and report any that don\u2019t belong to you.",
  },
  {
    question: "Can I edit my publications?",
    answer:
      "You control your bio, photo, themes, and featured works. The publication list comes from OpenAlex \u2014 we\u2019ll guide you through requesting corrections if needed.",
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
      "Yes \u2014 14 days free, no credit card required. Set up your profile, customize everything, and only pay if you keep it public.",
  },
];

const features = [
  {
    icon: RefreshCw,
    title: "Auto-Updated Publications",
    description:
      "Your publication list stays current automatically. New papers appear on your profile without lifting a finger.",
  },
  {
    icon: BarChart3,
    title: "Impact Visualizations",
    description:
      "Beautiful charts showing citation trends, h-index growth, and research topic maps that bring your work to life.",
  },
  {
    icon: Globe,
    title: "Your Own Academic URL",
    description:
      "Get yourname.scholar.name \u2014 a clean, professional link for email signatures, CVs, and conference bios.",
  },
];

const pricingPlans = [
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
      "Collaboration Map",
      "Weekly data sync",
      "Priority support",
    ],
    highlighted: true,
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Scholar.name",
  applicationCategory: "WebApplication",
  description: "Professional research portfolio platform for academics.",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "9.99",
    highPrice: "19.99",
    priceCurrency: "USD",
    offerCount: "2",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

// ───── Component ─────

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: searchResults, isLoading: isSearching } =
    useQuery<SearchResponse>({
      queryKey: ["/api/openalex/autocomplete", debouncedQuery],
      queryFn: async () => {
        const response = await fetch(
          "/api/openalex/autocomplete?q=" + encodeURIComponent(debouncedQuery),
        );
        if (!response.ok) throw new Error("Search failed");
        return response.json();
      },
      enabled: debouncedQuery.length >= 2,
    });

  const handleSelectAuthor = useCallback(
    (authorId: string) => {
      setShowResults(false);
      setSearchQuery("");
      window.scrollTo(0, 0);
      navigate("/researcher/" + authorId);
    },
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const results = searchResults?.results || [];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (
      e.key === "Enter" &&
      selectedIndex >= 0 &&
      results[selectedIndex]
    ) {
      e.preventDefault();
      handleSelectAuthor(results[selectedIndex].id);
    } else if (e.key === "Escape") {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  const resultsListId = "hero-search-results";
  const activeDescendant =
    selectedIndex >= 0 ? "search-result-" + selectedIndex : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Scholar.name - Professional Research Portfolios for Academics"
        description="Professional research portfolios for academics. Showcase publications, citations & impact &mdash; auto-updated from OpenAlex."
        url="https://scholar.name"
        type="website"
        structuredData={structuredData}
      />

      <GlobalNav mode="landing" />

      <main id="main-content">
        {/* ═══════ Hero ═══════ */}
        <section
          className="bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1500&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative min-h-[85vh] flex items-center py-20 lg:py-28"
          aria-labelledby="hero-heading"
        >
          <div className="absolute inset-0 bg-midnight/85 md:bg-gradient-to-br md:from-[#0B1F3A]/90 md:to-transparent" />
          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1
                id="hero-heading"
                className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold tracking-tight mb-6 sm:mb-8 text-white leading-tight"
              >
                Your research, one link,{" "}
                <span className="text-[var(--theme-accent)]">
                  always up to date
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-4 sm:mb-6 leading-relaxed px-2">
                Scholar.name creates a professional academic portfolio from your
                publications &mdash; no manual entry, no maintenance.
              </p>

              <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8">
                <Button
                  size="lg"
                  className="btn-premium px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate("/signup");
                  }}
                  data-testid="button-free-trial"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Your Portfolio
                </Button>
                <button
                  className="text-white/70 hover:text-white text-sm underline-offset-4 hover:underline transition-colors py-3 min-h-[44px] inline-flex items-center"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate("/researcher/A5037710835");
                  }}
                >
                  View a demo profile &rarr;
                </button>
              </div>

              {/* Search — Combobox ARIA (H5) */}
              <div className="max-w-xl mx-auto relative" ref={searchRef}>
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5"
                    aria-hidden="true"
                  />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for any researcher by name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                      setSelectedIndex(-1);
                    }}
                    onFocus={() => setShowResults(true)}
                    onKeyDown={handleKeyDown}
                    className="pl-12 pr-12 h-14 text-base rounded-xl border-2 focus:border-primary bg-white shadow-lg"
                    role="combobox"
                    aria-expanded={showResults && searchQuery.length >= 2}
                    aria-controls={resultsListId}
                    aria-activedescendant={activeDescendant}
                    aria-autocomplete="list"
                    aria-label="Search for any researcher by name"
                    data-testid="input-researcher-search"
                  />
                  {isSearching && (
                    <Loader2
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {showResults && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-lg z-40 max-h-80 overflow-hidden">
                    {isSearching ? (
                      <div className="p-6 text-center" role="status">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-muted-foreground">
                          Searching researchers&hellip;
                        </p>
                      </div>
                    ) : searchResults?.results &&
                      searchResults.results.length > 0 ? (
                      <ul
                        id={resultsListId}
                        role="listbox"
                        className="max-h-72 overflow-y-auto"
                        aria-label="Search results"
                      >
                        {searchResults.results.map((author, index) => (
                          <li
                            key={author.id}
                            id={"search-result-" + index}
                            role="option"
                            aria-selected={index === selectedIndex}
                            onClick={() => handleSelectAuthor(author.id)}
                            className={
                              "p-4 cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors " +
                              (index === selectedIndex ? "bg-muted/70" : "")
                            }
                            data-testid={"search-result-" + index}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <h4
                                  className="font-medium text-foreground truncate"
                                  data-testid={"author-name-" + index}
                                >
                                  {author.display_name}
                                </h4>
                                {author.hint && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {author.hint}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {author.works_count.toLocaleString()}{" "}
                                    publications
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {author.cited_by_count.toLocaleString()}{" "}
                                    citations
                                  </span>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center">
                        <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No researchers found for &ldquo;{searchQuery}&rdquo;
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                          Try a different name
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ Trust Bar ═══════ */}
        <section
          className="py-4 sm:py-6 bg-gradient-to-r from-slate-50 to-white border-b"
          aria-label="Trust indicators"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen
                  className="w-4 h-4 text-primary"
                  aria-hidden="true"
                />
                <span>250M+ indexed works</span>
              </div>
              <div
                className="hidden sm:block w-px h-4 bg-border"
                aria-hidden="true"
              />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Secure &amp; private</span>
              </div>
              <div
                className="hidden sm:block w-px h-4 bg-border"
                aria-hidden="true"
              />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Ready in 5 minutes</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ Social Proof (C2: replaces institutional logos) ═══════ */}
        <section
          className="py-6 sm:py-8 bg-white border-b"
          aria-label="Data source"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <a
                href="https://openalex.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                OpenAlex
              </a>{" "}
              &mdash; the free, open catalog of the world&rsquo;s research.
              250M+ works &middot; 90K+ sources &middot; updated daily.
            </p>
          </div>
        </section>

        {/* ═══════ Features ═══════ */}
        <section id="features" className="py-24 sm:py-32 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-midnight mb-4 sm:mb-6">
                Built for Researchers
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Features designed to showcase your academic achievements.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="group border bg-white shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-serif text-midnight">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ Use Cases (M1: Lucide icons instead of emoji) ═══════ */}
        <section id="use-cases" className="py-24 sm:py-32 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-midnight mb-4 sm:mb-6">
                Where You&rsquo;ll Use It
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                One link for email signatures, grant applications, and
                conference networking.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border bg-gradient-to-br from-primary/5 to-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-midnight mb-2">
                    Email Signature
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    A clean, memorable link instead of an ugly Google Scholar
                    URL.
                  </p>
                </CardContent>
              </Card>

              <Card className="border bg-gradient-to-br from-primary/5 to-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-midnight mb-2">
                    Grant Applications
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    A professional portfolio when they ask for your
                    &ldquo;personal website.&rdquo;
                  </p>
                </CardContent>
              </Card>

              <Card className="border bg-gradient-to-br from-primary/5 to-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Handshake className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-midnight mb-2">
                    Collaboration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Potential co-authors see your research areas and top papers
                    instantly.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ═══════ Pricing ═══════ */}
        <section id="pricing" className="py-24 sm:py-32 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-midnight mb-4 sm:mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Start with a 14-day free trial. No credit card required.
              </p>

              <div className="flex items-center justify-center gap-3 mb-8">
                <label
                  htmlFor="billing-toggle"
                  className={
                    "text-sm font-medium cursor-pointer " +
                    (!isYearly ? "text-foreground" : "text-muted-foreground")
                  }
                >
                  Monthly
                </label>
                <Switch
                  id="billing-toggle"
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  aria-label="Toggle yearly billing"
                  data-testid="switch-billing-toggle"
                />
                <label
                  htmlFor="billing-toggle"
                  className={
                    "text-sm font-medium cursor-pointer " +
                    (isYearly ? "text-foreground" : "text-muted-foreground")
                  }
                >
                  Yearly
                  <Badge
                    variant="secondary"
                    className="ml-2 text-xs bg-green-100 text-green-700"
                  >
                    Save 2 months
                  </Badge>
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={
                    "relative " +
                    (plan.highlighted
                      ? "border-2 border-primary shadow-lg"
                      : "border bg-white")
                  }
                  data-testid={"card-pricing-" + plan.name.toLowerCase()}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-8">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        $
                        {isYearly
                          ? plan.yearlyPrice.toFixed(2)
                          : plan.monthlyPrice.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        /{isYearly ? "year" : "month"}
                      </span>
                      {isYearly && (
                        <p className="text-sm text-green-600 mt-1">
                          Save ${plan.yearlySavings}
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                      data-testid={
                        "button-select-" + plan.name.toLowerCase()
                      }
                      onClick={() => {
                        window.scrollTo(0, 0);
                        navigate("/signup?plan=" + plan.name.toLowerCase());
                      }}
                    >
                      {plan.highlighted ? "Start Free Trial" : "Get Started"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ FAQ (C4+H3+H4: ARIA, animated, white bg) ═══════ */}
        <section id="faq" className="py-24 sm:py-32 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-midnight mb-4 sm:mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground">
                Everything you need to know about Scholar.name
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                const panelId = "faq-answer-" + index;
                const buttonId = "faq-btn-" + index;
                return (
                  <div
                    key={index}
                    className={
                      "bg-muted/20 rounded-lg shadow-sm border overflow-hidden transition-all " +
                      (isOpen
                        ? "border-l-4 border-l-primary"
                        : "border-border")
                    }
                  >
                    <button
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className={
                        "w-full px-6 py-5 text-left flex items-center justify-between gap-4 " +
                        (isOpen ? "bg-primary/5" : "hover:bg-muted/50")
                      }
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      data-testid={"faq-question-" + index}
                    >
                      <span className="font-medium text-foreground">
                        {faq.question}
                      </span>
                      <div
                        className={
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 " +
                          (isOpen
                            ? "bg-primary/10 text-primary rotate-180"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="grid transition-all duration-200 ease-in-out"
                      style={{
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-5 bg-primary/5">
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <p className="text-muted-foreground mb-3">
                Still have questions?
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate("/contact");
                }}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════ Final CTA (C3) ═══════ */}
        <section
          className="py-20 sm:py-24 bg-midnight text-white"
          aria-labelledby="final-cta-heading"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2
              id="final-cta-heading"
              className="text-3xl sm:text-4xl font-serif font-bold mb-4"
            >
              Ready to showcase your research?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              Join researchers who&rsquo;ve replaced outdated faculty pages with
              a living, breathing portfolio. 14 days free &mdash; no credit
              card.
            </p>
            <Button
              size="lg"
              className="btn-premium px-10 py-4 text-base font-semibold"
              onClick={() => {
                window.scrollTo(0, 0);
                navigate("/signup");
              }}
              data-testid="button-final-cta"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Your Free Trial
            </Button>
          </div>
        </section>

        {/* FAQ Schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </main>

      <GlobalFooter mode="landing" />

      {/* H10: Exit intent popup for lead capture */}
      <ExitIntentPopup />
    </div>
  );
}
