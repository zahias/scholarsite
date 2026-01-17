import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import SEO from "@/components/SEO";
import { 
  Search, 
  ArrowRight, 
  Check, 
  BookOpen,
  Users,
  Loader2,
  GraduationCap,
  RefreshCw,
  Shield,
  Award,
  FileText,
  BarChart3,
  Palette,
  ChevronDown,
  ChevronUp,
  Lock,
  Zap,
  Sparkles,
  LogIn
} from "lucide-react";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import CountdownTimer from "@/components/CountdownTimer";

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

// FAQ data - addresses real user objections
const faqs = [
  {
    question: "Where does the publication data come from?",
    answer: "All publication data is sourced from OpenAlex, a free and open index of over 250 million scholarly works, updated daily. Your profile syncs automatically based on your plan (monthly or weekly). We show exactly when data was last updated, and you can report any issues directly from your profile."
  },
  {
    question: "How accurate is the publication matching?",
    answer: "OpenAlex uses advanced algorithms to match publications to authors, but no system is perfect — especially for common names or transliterated names. You can see all attributed publications on your profile and report any that don't belong to you. We'll help you request corrections at the source."
  },
  {
    question: "Can I edit my publications or add missing papers?",
    answer: "You control your bio, profile photo, themes, and which publications to feature. However, the publication list itself comes from OpenAlex. If papers are missing or incorrectly attributed, we'll guide you through requesting a correction — it usually takes 1-2 weeks to reflect."
  },
  {
    question: "Will this affect my Google Scholar profile?",
    answer: "No. Scholar.name is completely separate from Google Scholar. It's a professional portfolio that complements (not replaces) your other academic profiles. Many researchers use both — Google Scholar for discovery, and Scholar.name for a polished, shareable landing page."
  },
  {
    question: "Is this an official academic registry?",
    answer: "No, we're not a registry or identifier system like ORCID. Scholar.name is a portfolio platform — think of it as your personal research website, professionally designed and automatically updated. You control what's shown and how."
  },
  {
    question: "Can I use my own domain name?",
    answer: "Yes! Pro plan subscribers can connect a custom domain like yourname.com. We handle all SSL certificates and DNS configuration. Starter plans use a yourname.scholar.name subdomain, which is also professional and memorable."
  },
  {
    question: "What happens if I cancel?",
    answer: "No long-term contracts — cancel anytime from your dashboard. Your profile stays active until the end of your billing period, then becomes private (not deleted). You can reactivate anytime and all your customizations will still be there."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! 14 days free to explore all features. No credit card required to start. Set up your profile, customize everything, and only pay if you decide to keep it public."
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
      icon: FileText,
      title: "Research Passport",
      description: "Download a printable PDF with your name, institution, and QR code linking to your portfolio. Perfect for conferences."
    },
    {
      icon: BarChart3,
      title: "Research Visuals",
      description: "Interactive charts, topic clouds, citation trends, and co-author network maps that bring your research to life."
    },
    {
      icon: Palette,
      title: "Custom Bio Sections",
      description: "Add awards, grants, teaching experience, media mentions, and other achievements to your profile."
    },
    {
      icon: RefreshCw,
      title: "Auto-Sync",
      description: "Your publications update automatically from OpenAlex. No manual entry needed."
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

  // Founder pricing end date (6 weeks from now)
  const founderPricingEndDate = new Date('2026-02-28T23:59:59');

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link for keyboard accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <SEO 
        title="Scholar.name - Professional Research Portfolios for Academics"
        description="Create a stunning research portfolio that showcases your publications, citations, and academic impact. Auto-syncs with OpenAlex. Better than Google Scholar."
        url="https://scholar.name"
        type="website"
        structuredData={structuredData}
      />
      
      {/* Premium Navigation */}
      <nav className="sticky top-0 z-50 nav-premium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/" className="flex items-center cursor-pointer" onClick={() => window.scrollTo(0, 0)} data-testid="link-logo">
              <BookOpen className="h-7 w-7 text-white mr-2" />
              <span className="text-lg font-semibold text-white">ScholarName</span>
            </Link>
            <div className="flex items-center gap-3 md:gap-6">
              <a href="#features" className="nav-link text-xs md:text-sm hidden sm:block" data-testid="link-features">Features</a>
              <a href="#pricing" className="nav-link text-xs md:text-sm hidden sm:block" data-testid="link-pricing">Pricing</a>
              <a href="#faq" className="nav-link text-xs md:text-sm hidden sm:block" data-testid="link-faq">FAQ</a>
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 text-xs md:text-sm hidden sm:flex items-center gap-1" data-testid="link-login" onClick={() => { window.scrollTo(0, 0); navigate('/login'); }}>
                <LogIn className="w-3.5 h-3.5" />
                Login
              </Button>
              <Button size="sm" className="btn-premium text-xs md:text-sm px-3 md:px-5 py-2" data-testid="button-get-started-nav" onClick={() => { window.scrollTo(0, 0); navigate('/signup'); }}>Create Portfolio</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Embedded Search */}
      <main id="main-content">
      <section className="landing-hero py-16 lg:py-24 relative" aria-labelledby="hero-heading">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 id="hero-heading" className="text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 text-white leading-tight">
              Your Research Deserves Better Than{" "}
              <span className="bg-gradient-to-r from-orange-300 via-orange-200 to-amber-200 bg-clip-text text-transparent">a Google Scholar Page</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-4 sm:mb-6 leading-relaxed px-2">
              Create a stunning portfolio that showcases your publications, citations, and research impact. 
              Auto-syncs with OpenAlex. Setup takes 5 minutes.
            </p>

            {/* Free Trial CTA */}
            <div className="flex flex-wrap justify-center gap-3 mb-6 sm:mb-8">
              <Button 
                size="lg" 
                className="btn-premium px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => { window.scrollTo(0, 0); navigate('/signup'); }}
                data-testid="button-free-trial"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 px-6 py-3"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Pricing
              </Button>
            </div>

            {/* Search Box - Embedded in Hero */}
            <div className="max-w-xl mx-auto relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for yourself or a colleague..."
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

            {/* Example Profiles */}
            <div className="mt-8 sm:mt-10">
              <p className="text-white/70 text-sm mb-4">Or explore example profiles:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { name: "Richard Feynman", id: "A5037710835" },
                  { name: "Marie Curie", id: "A5046643220" },
                  { name: "Albert Einstein", id: "A5109805546" }
                ].map((researcher, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all"
                    onClick={() => { window.scrollTo(0, 0); navigate(`/researcher/${researcher.id}`); }}
                    data-testid={`button-example-${researcher.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <GraduationCap className="w-4 h-4 mr-2 opacity-70" />
                    {researcher.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-4 sm:py-6 bg-gradient-to-r from-slate-50 to-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="trust-secure">
              <Lock className="w-4 h-4 text-green-600" />
              <span>256-bit SSL Secure</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="trust-openalex">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Powered by OpenAlex</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="trust-setup">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Setup in 5 minutes</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="trust-founding">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Be among the first 100 founding members</span>
            </div>
          </div>
        </div>
      </section>

      {/* Built by a Researcher - Founder Story */}
      <section className="py-8 sm:py-12 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg">
              <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
            <div className="text-center md:text-left">
              <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/10">Built by a Researcher, for Researchers</Badge>
              <p className="text-muted-foreground leading-relaxed">
                "I built Scholar.name because I was tired of pointing collaborators to my outdated faculty page 
                or a bare Google Scholar listing. As a researcher myself, I wanted a professional portfolio 
                that actually reflects my work — one that updates automatically and looks great."
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2 italic">— Founder, Scholar.name</p>
            </div>
          </div>
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

      {/* Use Cases Section - Why not just Google Scholar? */}
      <section id="use-cases" className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-3 sm:mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
              Common Question
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              "I already have Google Scholar..."
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Google Scholar is where people <strong>find</strong> your papers. Scholar.name is where you <strong>send</strong> them.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">✉️</div>
                <h3 className="font-semibold text-lg mb-2">Email Signature</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Replace that ugly Google Scholar URL with a clean, memorable link.
                </p>
                <div className="text-xs font-mono bg-muted/50 rounded p-2">
                  <span className="line-through text-muted-foreground">scholar.google.com/citations?user=xY3z...</span>
                  <br />
                  <span className="text-primary font-semibold">yourname.scholar.name</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-gradient-to-br from-amber-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">🎫</div>
                <h3 className="font-semibold text-lg mb-2">Conference Badge</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Print your Research Passport with QR code. Colleagues scan → see your full portfolio.
                </p>
                <div className="text-xs text-muted-foreground italic">
                  "Way better than handing out business cards that go in the trash."
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-semibold text-lg mb-2">Grant Applications</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  When they ask for a "personal website" — give them a professional research portfolio.
                </p>
                <div className="text-xs text-muted-foreground italic">
                  Beats linking to a dusty faculty page from 2015.
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">💼</div>
                <h3 className="font-semibold text-lg mb-2">LinkedIn Profile</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Your website link field finally has something impressive to show.
                </p>
                <div className="text-xs text-muted-foreground italic">
                  Recruiters and collaborators see your impact instantly.
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-gradient-to-br from-rose-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">🎤</div>
                <h3 className="font-semibold text-lg mb-2">Speaker Bio</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Event organizers need your bio, photo, and credentials — one link has it all.
                </p>
                <div className="text-xs text-muted-foreground italic">
                  No more emailing attachments back and forth.
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-gradient-to-br from-cyan-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="font-semibold text-lg mb-2">Collaboration</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Potential co-authors can browse your research areas and top papers in seconds.
                </p>
                <div className="text-xs text-muted-foreground italic">
                  Start the conversation with context already shared.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Comparison */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-muted/30 rounded-xl p-6 border">
              <h3 className="font-semibold text-center mb-4">The Difference</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground mb-2">Google Scholar</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Search engine</li>
                    <li>• Same look as everyone</li>
                    <li>• No customization</li>
                    <li>• Ugly URL</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-primary mb-2">Scholar.name</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Portfolio you control</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Your brand, your story</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Bio, CV, themes</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> yourname.scholar.name</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-3 sm:mb-4 bg-amber-100 text-amber-800 hover:bg-amber-100 animate-pulse">
              <Award className="w-3 h-3 mr-1" />
              Founder Pricing — Limited Time
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              Lock in these founding member rates forever. Prices increase after Feb 28.
            </p>
            
            {/* Countdown Timer */}
            <div className="flex justify-center mb-6">
              <CountdownTimer targetDate={founderPricingEndDate} />
            </div>
            
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
                    {plan.highlighted ? 'Start 14-Day Free Trial' : `Choose ${plan.name}`}
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
              onClick={() => { window.scrollTo(0, 0); navigate('/contact'); }}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Exit Intent Popup */}
      <ExitIntentPopup />

      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      </main>
      
      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BookOpen className="h-6 w-6 text-primary mr-2" />
                <span className="font-semibold">ScholarName</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Professional research portfolios for academics. Auto-syncs with OpenAlex.
              </p>
              <p className="text-xs text-muted-foreground">
                Data sourced from{" "}
                <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  OpenAlex
                </a>
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors" data-testid="link-footer-features">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors" data-testid="link-footer-pricing">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors" data-testid="link-footer-faq">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => { window.scrollTo(0, 0); navigate('/about'); }} className="hover:text-foreground transition-colors" data-testid="link-footer-about">About Us</button></li>
                <li><button onClick={() => { window.scrollTo(0, 0); navigate('/contact'); }} className="hover:text-foreground transition-colors" data-testid="link-footer-contact">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => { window.scrollTo(0, 0); navigate('/privacy'); }} className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">Privacy Policy</button></li>
                <li><button onClick={() => { window.scrollTo(0, 0); navigate('/terms'); }} className="hover:text-foreground transition-colors" data-testid="link-footer-terms">Terms of Service</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
            <p>&copy; {new Date().getFullYear()} ScholarName. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> SSL Secured
              </span>
              <span>•</span>
              <span>Made for Researchers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
