import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  BarChart3, 
  Mail, 
  Palette, 
  Search, 
  ArrowRight, 
  Check, 
  Sparkles,
  BookOpen,
  Users,
  Shield,
  Zap,
  Loader2,
  GraduationCap
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

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
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
    }
  };

  const features = [
    {
      icon: Globe,
      title: "Your Own Domain",
      description: "Get a professional web address like yourname.researchprofile.com or use your own custom domain."
    },
    {
      icon: BarChart3,
      title: "Rich Analytics",
      description: "Beautiful publication charts, citation trends, and impact visualizations powered by OpenAlex data."
    },
    {
      icon: Mail,
      title: "Professional Email",
      description: "Receive a dedicated email address that matches your research portfolio domain."
    },
    {
      icon: Palette,
      title: "Customizable Themes",
      description: "Choose from elegant themes and color schemes to match your personal brand and style."
    },
    {
      icon: Zap,
      title: "Auto-Updated",
      description: "Your profile stays current with automatic syncing from OpenAlex - no manual updates needed."
    },
    {
      icon: Shield,
      title: "Reliable Hosting",
      description: "Your site is always online with fast, secure hosting and SSL certificates included."
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "Subdomain (name.researchprofile.com)",
        "All publication analytics",
        "Basic theme customization",
        "Profile picture upload",
        "CV/Resume upload",
        "Monthly data sync"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "$19",
      period: "/month",
      description: "Most popular for researchers",
      features: [
        "Everything in Starter",
        "Custom domain support",
        "Professional email",
        "Premium themes",
        "Priority support",
        "Weekly data sync"
      ],
      highlighted: true
    },
    {
      name: "Institution",
      price: "$49",
      period: "/month",
      description: "For research groups & labs",
      features: [
        "Everything in Professional",
        "Up to 10 researcher profiles",
        "Shared branding",
        "Admin dashboard",
        "Daily data sync",
        "Dedicated support"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold font-serif tracking-tight">ScholarSite</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider" data-testid="link-features">Features</a>
              <a href="#preview" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider" data-testid="link-preview">Preview</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider" data-testid="link-pricing">Pricing</a>
              <Button className="btn-premium px-6 py-2" data-testid="button-get-started-nav">Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Premium Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-36 hero-banner">
        <div className="hero-pattern"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-8 bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by OpenAlex
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 font-serif text-white">
              Your Research Legacy,{" "}
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">Beautifully Presented</span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/80 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
              Create a stunning academic portfolio website in minutes. Showcase your publications, 
              citations, and research impact with automatic updates from OpenAlex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-premium text-lg px-10 py-6" data-testid="button-start-free-trial">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm" data-testid="button-see-demo">
                <a href="#preview">See a Demo</a>
              </Button>
            </div>
          </div>

          {/* Premium Stats */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center glass-dark rounded-xl p-6">
              <div className="text-4xl font-bold text-white font-serif">1000+</div>
              <div className="text-sm text-white/70 uppercase tracking-wider mt-1">Researchers</div>
            </div>
            <div className="text-center glass-dark rounded-xl p-6">
              <div className="text-4xl font-bold text-white font-serif">50M+</div>
              <div className="text-sm text-white/70 uppercase tracking-wider mt-1">Publications</div>
            </div>
            <div className="text-center glass-dark rounded-xl p-6">
              <div className="text-4xl font-bold text-white font-serif">99.9%</div>
              <div className="text-sm text-white/70 uppercase tracking-wider mt-1">Uptime</div>
            </div>
            <div className="text-center glass-dark rounded-xl p-6">
              <div className="text-4xl font-bold text-white font-serif">24/7</div>
              <div className="text-sm text-white/70 uppercase tracking-wider mt-1">Auto-Sync</div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="hero-decorative top-20 right-20 w-80 h-80 bg-gradient-to-r from-white/8 to-white/3"></div>
        <div className="hero-decorative bottom-20 left-20 w-64 h-64 bg-gradient-to-r from-white/5 to-white/2"></div>
      </section>

      {/* Premium Features Section */}
      <section id="features" className="py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-xs uppercase tracking-widest">Features</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 font-serif">
              Everything You Need to <span className="text-accent">Shine</span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional research portfolios with powerful features designed specifically for academics.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-premium border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl">
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-serif">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Preview Section with Autocomplete Search */}
      <section id="preview" className="py-24 lg:py-32 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-xs uppercase tracking-widest">Live Preview</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 font-serif">
              See Your Portfolio in <span className="text-accent">Action</span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Search for any researcher by name and preview their complete academic portfolio.
            </p>
          </div>

          {/* Autocomplete Search Box */}
          <div className="max-w-2xl mx-auto" ref={searchRef}>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by researcher name (e.g., Albert Einstein)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => setShowResults(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-12 pr-12 h-14 text-lg rounded-xl border-2 focus:border-primary"
                  data-testid="input-researcher-search"
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border-2 border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  {isSearching ? (
                    <div className="p-6 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-muted-foreground">Searching researchers...</p>
                    </div>
                  ) : searchResults?.results && searchResults.results.length > 0 ? (
                    <ul className="max-h-96 overflow-y-auto">
                      {searchResults.results.map((author, index) => (
                        <li 
                          key={author.id}
                          onClick={() => handleSelectAuthor(author.id)}
                          className={`p-4 cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
                            index === selectedIndex ? 'bg-muted/70' : ''
                          }`}
                          data-testid={`search-result-${index}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <GraduationCap className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground truncate" data-testid={`author-name-${index}`}>
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
                            <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center">
                      <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No researchers found for "{searchQuery}"</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Try a different name or spelling</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Powered by{" "}
              <a 
                href="https://openalex.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-testid="link-openalex"
              >
                OpenAlex
              </a>
              {" "}- an open catalog of the world's scholarly papers, researchers, and institutions.
            </p>
          </div>

          {/* Example Profiles */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h3 className="text-center text-lg font-medium text-muted-foreground mb-6">
              Or try these example profiles:
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { name: "Albert Einstein", id: "A5109805546", institution: "Princeton University" },
                { name: "Richard Feynman", id: "A5072318964", institution: "California Institute of Technology" },
                { name: "Stephen Hawking", id: "A5112382587", institution: "University of Cambridge" }
              ].map((example) => (
                <Card 
                  key={example.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary/50"
                  onClick={() => navigate(`/researcher/${example.id}`)}
                  data-testid={`example-profile-${example.id}`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium truncate">{example.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{example.institution}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium Pricing Section */}
      <section id="pricing" className="py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-xs uppercase tracking-widest">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 font-serif">
              Simple, Transparent <span className="text-accent">Pricing</span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative card-premium ${plan.highlighted ? 'border-2 border-accent shadow-2xl scale-105 bg-card' : 'border-border bg-card/80 backdrop-blur-sm'}`}
                data-testid={`card-pricing-${plan.name.toLowerCase()}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="btn-premium px-4 py-1 text-xs uppercase tracking-wider shadow-lg">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-8">
                  <CardTitle className="text-2xl font-serif">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-5xl font-bold font-serif">{plan.price}</span>
                    <span className="text-muted-foreground text-lg">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-accent" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full py-6 ${plan.highlighted ? 'btn-premium' : ''}`}
                    variant={plan.highlighted ? "default" : "outline"}
                    data-testid={`button-select-${plan.name.toLowerCase()}`}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-24 lg:py-32 hero-banner relative overflow-hidden">
        <div className="hero-pattern"></div>
        <div className="hero-decorative top-10 right-10 w-64 h-64 bg-gradient-to-r from-white/5 to-white/2"></div>
        <div className="hero-decorative bottom-10 left-10 w-48 h-48 bg-gradient-to-r from-white/3 to-white/1"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 font-serif text-white">
            Ready to Showcase Your Research?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
            Join thousands of researchers who have already created their professional portfolio.
            Start your free trial today - no credit card required.
          </p>
          <Button size="lg" className="btn-premium text-lg px-10 py-6" data-testid="button-start-trial-cta">
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center mb-6">
                <BookOpen className="h-7 w-7 text-white mr-2" />
                <span className="font-bold text-xl font-serif">ScholarSite</span>
              </div>
              <p className="text-white/70 leading-relaxed">
                Beautiful research portfolios for academics, powered by OpenAlex.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-6 uppercase tracking-wider text-sm">Product</h4>
              <ul className="space-y-3 text-white/70">
                <li><a href="#features" className="hover:text-white transition-colors" data-testid="link-footer-features">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors" data-testid="link-footer-pricing">Pricing</a></li>
                <li><a href="#preview" className="hover:text-white transition-colors" data-testid="link-footer-preview">Preview</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 uppercase tracking-wider text-sm">Resources</h4>
              <ul className="space-y-3 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-documentation">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-help">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-blog">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-3 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-privacy">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-terms">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-contact">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/20 text-center text-white/60">
            <p>&copy; {new Date().getFullYear()} ScholarSite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
