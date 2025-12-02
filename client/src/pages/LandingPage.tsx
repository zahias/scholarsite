import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  TrendingUp,
  Shield,
  Zap,
  FileText
} from "lucide-react";

interface OpenAlexAuthor {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  summary_stats?: {
    h_index: number;
    i10_index: number;
  };
  affiliations?: Array<{
    institution: {
      display_name: string;
    };
  }>;
  topics?: Array<{
    display_name: string;
  }>;
}

export default function LandingPage() {
  const [openalexInput, setOpenalexInput] = useState("");
  const [searchId, setSearchId] = useState("");

  const { data: previewData, isLoading: isPreviewLoading, error: previewError } = useQuery<OpenAlexAuthor>({
    queryKey: ['/api/openalex/author', searchId],
    enabled: !!searchId,
  });

  const handlePreview = () => {
    const cleanId = openalexInput.trim();
    if (cleanId) {
      const idMatch = cleanId.match(/A\d+/);
      if (idMatch) {
        setSearchId(idMatch[0]);
      } else {
        setSearchId(cleanId);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePreview();
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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold">ScholarSite</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Features</a>
              <a href="#preview" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-preview">Preview</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">Pricing</a>
              <Button data-testid="button-get-started-nav">Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by OpenAlex
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Research Portfolio,{" "}
              <span className="text-primary">Beautifully Presented</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create a stunning academic portfolio website in minutes. Showcase your publications, 
              citations, and research impact with automatic updates from OpenAlex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" data-testid="button-start-free-trial">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" data-testid="button-see-demo">
                <a href="#preview">See a Demo</a>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Researchers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50M+</div>
              <div className="text-sm text-muted-foreground">Publications Indexed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Auto-Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Shine
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional research portfolios with powerful features designed specifically for academics.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Preview Your Portfolio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter your OpenAlex Author ID to see how your research portfolio would look.
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Enter OpenAlex ID (e.g., A5056485484)"
                  value={openalexInput}
                  onChange={(e) => setOpenalexInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-lg"
                  data-testid="input-openalex-id"
                />
              </div>
              <Button 
                size="lg" 
                onClick={handlePreview}
                disabled={!openalexInput.trim()}
                data-testid="button-preview"
              >
                Preview
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Find your OpenAlex ID at{" "}
              <a 
                href="https://openalex.org/authors" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                openalex.org/authors
              </a>
            </p>
          </div>

          {/* Preview Card */}
          {searchId && (
            <div className="max-w-4xl mx-auto">
              {isPreviewLoading ? (
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary/80 p-8">
                    <div className="flex items-center gap-6">
                      <Skeleton className="w-24 h-24 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-6">
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                    </div>
                  </CardContent>
                </Card>
              ) : previewError ? (
                <Card className="p-8 text-center">
                  <div className="text-destructive mb-2">Could not find researcher</div>
                  <p className="text-muted-foreground">
                    Please check the OpenAlex ID and try again. The ID should start with "A" followed by numbers.
                  </p>
                </Card>
              ) : previewData ? (
                <Card className="overflow-hidden shadow-xl" data-testid="card-preview-result">
                  {/* Preview Header */}
                  <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-white">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                        {previewData.display_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1" data-testid="text-researcher-name">
                          {previewData.display_name}
                        </h3>
                        <p className="text-white/80">
                          {previewData.affiliations?.[0]?.institution.display_name || "Researcher"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview Stats */}
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold" data-testid="text-works-count">
                          {previewData.works_count.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Publications</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold" data-testid="text-citations-count">
                          {previewData.cited_by_count.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Citations</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold">
                          {previewData.summary_stats?.h_index || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">h-index</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold">
                          {previewData.summary_stats?.i10_index || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">i10-index</div>
                      </div>
                    </div>

                    {/* Research Topics Preview */}
                    {previewData.topics && previewData.topics.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3">Research Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {previewData.topics.slice(0, 6).map((topic, i) => (
                            <Badge key={i} variant="secondary">
                              {topic.display_name}
                            </Badge>
                          ))}
                          {previewData.topics.length > 6 && (
                            <Badge variant="outline">+{previewData.topics.length - 6} more</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 text-center">
                      <h4 className="font-semibold mb-2">This could be your website!</h4>
                      <p className="text-muted-foreground mb-4">
                        Get your own professional research portfolio with custom domain and email.
                      </p>
                      <Button data-testid="button-create-portfolio">
                        Create My Portfolio
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.highlighted ? 'border-primary shadow-xl scale-105' : 'border-border'}`}
                data-testid={`card-pricing-${plan.name.toLowerCase()}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
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

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Showcase Your Research?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of researchers who have already created their professional portfolio.
            Start your free trial today - no credit card required.
          </p>
          <Button size="lg" className="text-lg px-8" data-testid="button-start-trial-cta">
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BookOpen className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold">ScholarSite</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Beautiful research portfolios for academics, powered by OpenAlex.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground" data-testid="link-footer-features">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground" data-testid="link-footer-pricing">Pricing</a></li>
                <li><a href="#preview" className="hover:text-foreground" data-testid="link-footer-preview">Preview</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground" data-testid="link-footer-documentation">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground" data-testid="link-footer-help">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground" data-testid="link-footer-blog">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground" data-testid="link-footer-privacy">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground" data-testid="link-footer-terms">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground" data-testid="link-footer-contact">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ScholarSite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
