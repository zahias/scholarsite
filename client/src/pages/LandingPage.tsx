import { useState, useEffect, useRef } from "react";
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
  ChevronUp,
  Lock,
  Zap,
  Sparkles,
  Globe
} from "lucide-react";

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

// FAQ data - purchase-blocker questions only (6 items)
const faqs = [
  {
    question: "Where does the publication data come from?",
    answer: "All publication data comes from OpenAlex, a free and open index of 250M+ scholarly works. Your profile syncs automatically. You can report issues directly from your profile."
  },
  {
    question: "How accurate is the publication matching?",
    answer: "OpenAlex uses advanced algorithms, but no system is perfect for common names. You can see all attributed publications and report any that don't belong to you."
  },
  {
    question: "Can I edit my publications?",
    answer: "You control your bio, photo, themes, and featured works. The publication list comes from OpenAlex — we'll guide you through requesting corrections if needed."
  },
  {
    question: "Can I use my own domain?",
    answer: "Yes! Pro plan includes custom domains (yourname.com). Starter uses yourname.scholar.name. Both are professional and memorable."
  },
  {
    question: "What happens if I cancel?",
    answer: "Cancel anytime. Your profile stays active until the billing period ends, then becomes private (not deleted). Reactivate anytime."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes — 14 days free, no credit card required. Set up your profile, customize everything, and only pay if you keep it public."
  }
];

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
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: searchResults, isLoading: isSearching } = useQuery<SearchResponse>({
    queryKey: ['/api/openalex/autocomplete', debouncedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/openalex/autocomplete?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelectAuthor = (authorId: string) => {
    setShowResults(false);
    setSearchQuery("");
    window.scrollTo(0, 0);
    navigate(`/researcher/${authorId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const results = searchResults?.results || [];
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleSelectAuthor(results[selectedIndex].id);
    } else if (e.key === "Escape") {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  const features = [
    {
      icon: RefreshCw,
      title: "Auto-Updated Publications",
      description: "Your publication list stays current automatically. New papers appear on your profile without lifting a finger."
    },
    {
      icon: BarChart3,
      title: "Impact Visualizations",
      description: "Beautiful charts showing citation trends, h-index growth, and research topic maps that bring your work to life."
    },
    {
      icon: Globe,
      title: "Your Own Academic URL",
      description: "Get yourname.scholar.name — a clean, professional link for email signatures, CVs, and conference bios."
    }
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
        "Email support"
      ],
      highlighted: false
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
        "Priority support"
      ],
      highlighted: true
    }
  ];

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Scholar.name",
    "applicationCategory": "WebApplication",
    "description": "Professional research portfolio platform for academics. Showcase publications, citations, and research impact with beautiful visualizations.",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "9.99",
      "highPrice": "19.99",
      "priceCurrency": "USD",
      "offerCount": "2"
    }
  };

  // FAQ Schema for Google rich snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Scholar.name - Professional Research Portfolios for Academics"
        description="Create a professional research portfolio that showcases your publications, citations, and academic impact. Auto-updates. One link for everything."
        url="https://scholar.name"
        type="website"
        structuredData={structuredData}
      />
      
      <GlobalNav mode="landing" />

      {/* Hero Section with Embedded Search */}
      <main id="main-content">
      <section className="landing-hero py-16 lg:py-24 relative" aria-labelledby="hero-heading">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 id="hero-heading" className="text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 text-white leading-tight">
              Your research, one link,{" "}
              <span className="bg-gradient-to-r from-orange-300 via-orange-200 to-amber-200 bg-clip-text text-transparent">always up to date</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-4 sm:mb-6 leading-relaxed px-2">
              Scholar.name creates a professional academic portfolio from your publications — no manual entry, no maintenance.
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8">
              <Button 
                size="lg" 
                className="btn-premium px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => { window.scrollTo(0, 0); navigate('/signup'); }}
                data-testid="button-free-trial"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Your Portfolio
              </Button>
              <button 
                className="text-white/70 hover:text-white text-sm underline-offset-4 hover:underline transition-colors"
                onClick={() => { window.scrollTo(0, 0); navigate('/researcher/A5037710835'); }}
              >
                View a demo profile →
              </button>
            </div>

            {/* Search Box - Embedded in Hero */}
            <div className="max-w-xl mx-auto relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
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
                  data-testid="input-researcher-search"
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-lg z-40 max-h-80 overflow-hidden">
                  {isSearching ? (
                    <div className="p-6 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-muted-foreground">Searching researchers...</p>
                    </div>
                  ) : searchResults?.results && searchResults.results.length > 0 ? (
                    <ul className="max-h-72 overflow-y-auto">
                      {searchResults.results.map((author, index) => (
                        <li 
                          key={author.id}
                          onClick={() => handleSelectAuthor(author.id)}
                          className={`p-4 cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
                            index === selectedIndex ? 'bg-muted/70' : ''
                          }`}
                          data-testid={`search-result-${index}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="font-medium text-foreground truncate" data-testid={`author-name-${index}`}>
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
                                  {author.works_count.toLocaleString()} publications
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {author.cited_by_count.toLocaleString()} citations
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
                      <p className="text-muted-foreground">No researchers found for "{searchQuery}"</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Try a different name</p>
                    </div>
                  )}
                </div>
              )}
            </div>


          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-4 sm:py-6 bg-gradient-to-r from-slate-50 to-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="trust-openalex">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>250M+ indexed works</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="trust-secure">
              <Lock className="w-4 h-4 text-green-600" />
              <span>Secure & private</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="trust-setup">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Ready in 5 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Note */}
      <section className="py-6 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground text-sm italic">
            "I built this because I was tired of sending people to an outdated faculty page that didn't reflect my work." — Founder
          </p>
        </div>
      </section>

      {/* Institutional Logos - Aspirational */}
      <section className="py-6 sm:py-8 bg-muted/20 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-4">Built for researchers at leading institutions</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-60">
            {['MIT', 'Stanford', 'Harvard', 'Oxford', 'Cambridge'].map((uni) => (
              <span key={uni} className="text-lg sm:text-xl font-serif text-muted-foreground/80">{uni}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Built for Researchers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Features designed to showcase your academic achievements.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="group border bg-white shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section - simplified to 3 cards */}
      <section id="use-cases" className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Where You'll Use It
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              One link for email signatures, grant applications, and conference networking.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">✉️</div>
                <h3 className="font-semibold text-lg mb-2">Email Signature</h3>
                <p className="text-sm text-muted-foreground">
                  A clean, memorable link instead of an ugly Google Scholar URL.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-semibold text-lg mb-2">Grant Applications</h3>
                <p className="text-sm text-muted-foreground">
                  A professional portfolio when they ask for your "personal website."
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-gradient-to-br from-amber-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="font-semibold text-lg mb-2">Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Potential co-authors see your research areas and top papers instantly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Start with a 14-day free trial. No credit card required.
            </p>
            
            {/* Monthly/Yearly Toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                data-testid="switch-billing-toggle"
              />
              <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">Save 2 months</Badge>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.highlighted ? 'border-2 border-primary shadow-lg' : 'border bg-white'}`}
                data-testid={`card-pricing-${plan.name.toLowerCase()}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-8">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${isYearly ? plan.yearlyPrice.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                    {isYearly && (
                      <p className="text-sm text-green-600 mt-1">Save ${plan.yearlySavings}</p>
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
                    data-testid={`button-select-${plan.name.toLowerCase()}`}
                    onClick={() => { window.scrollTo(0, 0); navigate(`/signup?plan=${plan.name.toLowerCase()}`); }}
                  >
                    {plan.highlighted ? 'Start Free Trial' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 sm:py-16 lg:py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about Scholar.name
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${
                  openFaq === index ? 'border-l-4 border-l-primary' : 'border-border'
                }`}
              >
                <button
                  className={`w-full px-6 py-5 text-left flex items-center justify-between gap-4 ${
                    openFaq === index ? 'bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  data-testid={`faq-question-${index}`}
                >
                  <span className="font-medium text-foreground">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    openFaq === index ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {openFaq === index ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 bg-primary/5">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still have questions CTA */}
          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-3">Still have questions?</p>
            <Button 
              variant="outline"
              onClick={() => { window.scrollTo(0, 0); navigate('/contact'); }}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      </main>
      
      <GlobalFooter mode="landing" />
    </div>
  );
}
