import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Network,
  Palette,
  Clock
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
  const [isYearly, setIsYearly] = useState(false);
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
      description: "Download a printable PDF with your name, institution, and QR code linking to your portfolio. Perfect for conferences and networking."
    },
    {
      icon: Network,
      title: "Collaboration Map",
      description: "Visual network showing your co-author connections and research collaborations across institutions."
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

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Navigation */}
      <nav className="sticky top-0 z-50 nav-premium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-7 w-7 text-white mr-2" />
              <span className="text-lg font-semibold text-white">ScholarName</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#demo" className="nav-link text-sm" data-testid="link-demo">Demo</a>
              <a href="#features" className="nav-link text-sm" data-testid="link-features">Features</a>
              <a href="#pricing" className="nav-link text-sm" data-testid="link-pricing">Pricing</a>
              <Button size="sm" className="btn-premium text-sm px-5 py-2" data-testid="button-get-started-nav" onClick={() => navigate('/contact')}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Simplified */}
      <section className="landing-hero py-20 lg:py-28 relative">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white">
              Your Research Deserves{" "}
              <span className="bg-gradient-to-r from-orange-300 via-orange-200 to-amber-200 bg-clip-text text-transparent">Better</span>
            </h1>
            <p className="text-lg lg:text-xl text-white/80 mb-4 leading-relaxed">
              Professional research portfolios that update automatically.
            </p>
            <div className="flex items-center justify-center gap-2 mb-8 text-white/70 text-sm">
              <Clock className="w-4 h-4" />
              <span>Set up in 60 seconds</span>
            </div>
            <Button 
              size="lg" 
              className="btn-premium text-base px-8 py-6" 
              data-testid="button-get-started-hero"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Try the Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Credibility Badges */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center gap-3" data-testid="badge-auto-sync">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Auto-Sync</h3>
                <p className="text-xs text-muted-foreground">Updates automatically</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3" data-testid="badge-enterprise">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Enterprise Security</h3>
                <p className="text-xs text-muted-foreground">Bank-level encryption</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3" data-testid="badge-early-adopter">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Early Adopters</h3>
                <p className="text-xs text-muted-foreground">Lock in founder pricing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section - Main focus */}
      <section id="demo" className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search for any researcher and preview their portfolio instantly.
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search by researcher name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setShowResults(true)}
                onKeyDown={handleKeyDown}
                className="pl-12 pr-12 h-14 text-base rounded-xl border-2 focus:border-primary bg-white shadow-sm"
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
                          <div className="flex-1 min-w-0">
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
          <div className="mt-12 max-w-3xl mx-auto">
            <h3 className="text-center text-sm font-medium text-muted-foreground mb-6">
              Or try these examples:
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { name: "Albert Einstein", id: "A5109805546", field: "Physics" },
                { name: "Richard Feynman", id: "A5037710835", field: "Physics" },
                { name: "Stephen Hawking", id: "A5066175077", field: "Cosmology" }
              ].map((researcher, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 bg-white"
                  onClick={() => { window.scrollTo(0, 0); navigate(`/researcher/${researcher.id}`); }}
                  data-testid={`card-example-${researcher.name.toLowerCase().replace(' ', '-')}`}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-medium">{researcher.name}</h4>
                    <p className="text-sm text-muted-foreground">{researcher.field}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-100">
              <Award className="w-3 h-3 mr-1" />
              Early Adopter Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Lock in these rates as a founding member.
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
                    onClick={() => navigate(`/contact?plan=${plan.name.toLowerCase()}`)}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-premium py-16 lg:py-20 relative">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Create your professional research portfolio in 60 seconds.
          </p>
          <Button 
            size="lg" 
            className="btn-premium text-base px-8 py-6" 
            data-testid="button-get-started-cta"
            onClick={() => navigate('/contact')}
          >
            Start Your Portfolio
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BookOpen className="h-6 w-6 text-primary mr-2" />
                <span className="font-semibold">ScholarName</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional research portfolios for academics.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#demo" className="hover:text-foreground transition-colors" data-testid="link-footer-demo">Demo</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors" data-testid="link-footer-features">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors" data-testid="link-footer-pricing">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors" data-testid="link-footer-contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ScholarName. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
